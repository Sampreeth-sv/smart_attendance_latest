# routes/attendance_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from utils.db import get_db
from utils.jwt_token import verify_token

from models.attendance_model import Attendance
from models.user_model import User
from models.active_session import ActiveSession
from models.student_model import Student

router = APIRouter()


class MarkAttendanceSchema(BaseModel):
    session_id: str
    student_id: str
    location: dict | None = None
    face_image: str | None = None


@router.post("/mark")
def mark_attendance(
    payload: MarkAttendanceSchema,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(User.usn == payload.student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    student = db.query(Student).filter(Student.usn == user.usn).first()

    session = db.query(ActiveSession).filter(
        ActiveSession.session_id == payload.session_id,
        ActiveSession.active == True
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Invalid or expired session")

    # ❗ BLOCK WRONG-SECTION STUDENT
    if student.section != session.section:
        raise HTTPException(status_code=403, detail="You are not part of this section")

    record = Attendance(
        usn=user.usn,
        student_name=user.name,
        session_id=session.session_id,
        classroom_id=None,
        subject=session.subject,
        qr=True,
        location=bool(payload.location),
        face=bool(payload.face_image),
        by_teacher=False,
        timestamp=datetime.utcnow()
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {"success": True, "attendance_id": record.id}



# ---------------------------
# FETCH LIVE ATTENDANCE
# ---------------------------
@router.get("/session/{session_id}")
def get_attendance_for_session(
    session_id: str,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    session = db.query(ActiveSession).filter(
        ActiveSession.session_id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # fetch students in same section
    section_students = db.query(Student).filter(
        Student.section == session.section
    ).all()

    total_students = len(section_students)

    # fetch attendance records
    records = db.query(Attendance).filter(
        Attendance.session_id == session_id
    ).all()

    present = len(records)

    percentage = (present / total_students * 100) if total_students > 0 else 0

    return {
        "session_id": session_id,
        "section": session.section,
        "present_count": present,
        "total_students": total_students,
        "percentage": percentage,
        "records": [
            {
                "id": r.id,
                "usn": r.usn,
                "student_name": r.student_name,
                "subject": r.subject,
                "timestamp": r.timestamp.isoformat(),
                "qr": r.qr,
                "location": r.location,
                "face": r.face,
                "by_teacher": r.by_teacher,
            }
            for r in records
        ]
    }
# routes/attendance_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from utils.db import get_db
from utils.jwt_token import verify_token

from models.attendance_model import Attendance
from models.user_model import User
from models.active_session import ActiveSession
from models.student_model import Student

router = APIRouter()


class MarkAttendanceSchema(BaseModel):
    session_id: str
    student_id: str
    location: dict | None = None
    face_image: str | None = None


@router.post("/mark")
def mark_attendance(
    payload: MarkAttendanceSchema,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(User.usn == payload.student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    student = db.query(Student).filter(Student.usn == user.usn).first()

    session = db.query(ActiveSession).filter(
        ActiveSession.session_id == payload.session_id,
        ActiveSession.active == True
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Invalid or expired session")

    # ❗ BLOCK WRONG-SECTION STUDENT
    if student.section != session.section:
        raise HTTPException(status_code=403, detail="You are not part of this section")

    record = Attendance(
        usn=user.usn,
        student_name=user.name,
        session_id=session.session_id,
        classroom_id=None,
        subject=session.subject,
        qr=True,
        location=bool(payload.location),
        face=bool(payload.face_image),
        by_teacher=False,
        timestamp=datetime.utcnow()
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {"success": True, "attendance_id": record.id}



# ---------------------------
# FETCH LIVE ATTENDANCE
# ---------------------------
@router.get("/session/{session_id}")
def get_attendance_for_session(
    session_id: str,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    session = db.query(ActiveSession).filter(
        ActiveSession.session_id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # fetch students in same section
    section_students = db.query(Student).filter(
        Student.section == session.section
    ).all()

    total_students = len(section_students)

    # fetch attendance records
    records = db.query(Attendance).filter(
        Attendance.session_id == session_id
    ).all()

    present = len(records)

    percentage = (present / total_students * 100) if total_students > 0 else 0

    return {
        "session_id": session_id,
        "section": session.section,
        "present_count": present,
        "total_students": total_students,
        "percentage": percentage,
        "records": [
            {
                "id": r.id,
                "usn": r.usn,
                "student_name": r.student_name,
                "subject": r.subject,
                "timestamp": r.timestamp.isoformat(),
                "qr": r.qr,
                "location": r.location,
                "face": r.face,
                "by_teacher": r.by_teacher,
            }
            for r in records
        ]
    }
# -------------------------------------------------------
# STUDENT ATTENDANCE HISTORY
# -------------------------------------------------------
@router.get("/history/{usn}")
def get_attendance_history(
    usn: str,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Check if student exists
    student = db.query(Student).filter(Student.usn == usn).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Fetch attendance records for this USN
    records = db.query(Attendance).filter(Attendance.usn == usn).all()

    total_records = len(records)
    attended = sum(1 for r in records)

    return {
        "usn": usn,
        "total_records": total_records,
        "attended": attended,
        "percentage": (attended / total_records * 100) if total_records > 0 else 0,
        "records": [
            {
                "id": r.id,
                "timestamp": r.timestamp.isoformat(),
                "subject": r.subject,
                "qr": r.qr,
                "location": r.location,
                "face": r.face,
                "by_teacher": r.by_teacher
            }
            for r in records
        ]
    }
