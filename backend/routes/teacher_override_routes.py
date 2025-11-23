from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from utils.db import get_db
from utils.jwt_token import verify_token
from models.user_model import User
from models.student_model import Student
from models.attendance_model import Attendance

router = APIRouter()


# ===============================
# FETCH STUDENTS BY SECTION
# ===============================
@router.get("/students/{section}")
def list_students_by_section(
    section: str,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    students = db.query(Student).filter(Student.section == section).all()

    if not students:
        raise HTTPException(status_code=404, detail=f"No students found in section {section}")

    return {
        "students": [
            {
                "name": s.name,
                "usn": s.usn,
                "email": s.email,
                "section": s.section
            }
            for s in students
        ]
    }


# ===============================
# MANUAL TEACHER OVERRIDE MARKING
# ===============================
@router.post("/mark")
def manual_mark_attendance(
    data: dict,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    subject = data.get("subject")
    usns = data.get("usns", [])
    classroom_id = data.get("classroom_id", 1)

    if not subject:
        raise HTTPException(status_code=400, detail="Subject missing")

    if not usns:
        raise HTTPException(status_code=400, detail="No students provided")

    teacher_usn = token.get("usn") or "T_MANUAL"
    manual_session_id = f"manual-{teacher_usn}-{subject.replace(' ', '_')}"

    marked = []

    try:
        for usn in usns:
            student = db.query(Student).filter(Student.usn == usn).first()
            if not student:
                continue

            att = Attendance(
                usn=student.usn,
                student_name=student.name,
                session_id=manual_session_id,
                classroom_id=classroom_id,
                subject=subject,
                qr=False,
                location=False,
                face=False,
                by_teacher=True,
                timestamp=datetime.utcnow()
            )

            db.add(att)
            marked.append(student.usn)

        db.commit()

        return {
            "success": True,
            "marked": marked,
            "session_id": manual_session_id,
            "message": "Attendance overridden successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
