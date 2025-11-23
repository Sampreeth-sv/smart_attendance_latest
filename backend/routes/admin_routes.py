# routes/admin_routes.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, date

from utils.db import get_db
from utils.jwt_token import create_access_token, verify_token
from models.user_model import User
from models.student_model import Student
from models.teacher_model import Teacher
from models.classroom_model import Classroom
from models.attendance_model import Attendance

import os, base64

router = APIRouter()

# ----------------------------
# SCHEMAS
# ----------------------------
class AdminLoginSchema(BaseModel):
    email: str
    password: str

class NewStudentSchema(BaseModel):
    usn: str
    name: str
    email: str
    department: str
    year: int
    section: str
    password: str

class NewTeacherSchema(BaseModel):
    teacher_id: str
    name: str
    email: str
    phone_number: Optional[str] = None
    qualification: Optional[str] = None
    subjects: List[str]
    password: str

class ClassroomSchema(BaseModel):
    room_number: str
    lat: float
    lon: float
    image_paths: Optional[List[str]] = None   # e.g. ["img/c304_1.jpg", "img/c304_2.jpg"]

class TimetableUploadSchema(BaseModel):
    teacher_id: str
    timetable: Dict[str, Any]   # still available if you want raw JSON upload

# ✨ NEW: single slot (Format B)
class TimetableSlotSchema(BaseModel):
    teacher_id: str
    day: str          # e.g. "Monday"
    time: str         # e.g. "9:00-10:00"
    subject: str      # e.g. "Computer Networks"
    section: str      # e.g. "CSE-3A"

class SectionAssignSchema(BaseModel):
    usns: List[str]
    department: str
    year: int
    section: str

class FaceRegisterSchema(BaseModel):
    usn: str
    image: str   # base64 image

# Kept for reference (we won't use this directly in endpoint now)
class AttendanceReportQuery(BaseModel):
    subject: Optional[str] = None
    from_date: Optional[date] = None
    to_date: Optional[date] = None


# ----------------------------
# ADMIN AUTH CHECK
# ----------------------------
def require_admin(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> User:
    """
    Ensures the caller is an admin.
    Token is decoded by verify_token (reads Authorization: Bearer <token>)
    """

    email = token.get("email") or token.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()

    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


# ----------------------------
# 1) ADMIN LOGIN
# ----------------------------
@router.post("/login")
def admin_login(payload: AdminLoginSchema, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not user.is_admin:
        raise HTTPException(status_code=401, detail="Not an admin")

    if user.password_hash != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({
        "email": user.email,
        "is_admin": True,
        "is_teacher": False,
        "sub": user.email
    })

    return {
        "access_token": access_token,
        "admin": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


# ----------------------------
# 2) CREATE STUDENT
# ----------------------------
@router.post("/students", dependencies=[Depends(require_admin)])
def create_student(payload: NewStudentSchema, db: Session = Depends(get_db)):

    existing = db.query(User).filter(
        (User.usn == payload.usn) | (User.email == payload.email)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User with USN or Email exists")

    user = User(
        usn=payload.usn,
        name=payload.name,
        email=payload.email,
        password_hash=payload.password,   # plain password (your choice)
        is_teacher=False,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    student = Student(
        user_id=user.id,
        usn=payload.usn,
        name=payload.name,
        email=payload.email,
        department=payload.department,
        year=payload.year,
        section=payload.section
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {"message": "Student created", "id": student.id}


# ----------------------------
# 3) CREATE TEACHER
# ----------------------------
@router.post("/teachers", dependencies=[Depends(require_admin)])
def create_teacher(payload: NewTeacherSchema, db: Session = Depends(get_db)):

    existing = db.query(User).filter(
        (User.usn == payload.teacher_id) | (User.email == payload.email)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Teacher already exists")

    user = User(
        usn=payload.teacher_id,
        name=payload.name,
        email=payload.email,
        password_hash=payload.password,
        is_teacher=True,
        is_admin=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    teacher = Teacher(
        user_id=user.id,
        teacher_id=payload.teacher_id,
        phone_number=payload.phone_number,
        qualification=payload.qualification,
        subjects_taken=payload.subjects,
        timetable={}  # we'll store {"slots": [...]}
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return {"message": "Teacher created", "id": teacher.id}


# ----------------------------
# 4) LIST TEACHERS
# ----------------------------
@router.get("/teachers", dependencies=[Depends(require_admin)])
def list_teachers(db: Session = Depends(get_db)):

    teachers = db.query(Teacher).all()
    result = []

    for t in teachers:
        user = db.query(User).filter(User.id == t.user_id).first()
        result.append({
            "teacher_id": t.teacher_id,
            "name": user.name if user else None,
            "email": user.email if user else None,
            "phone_number": t.phone_number,
            "qualification": t.qualification,
            "subjects": t.subjects_taken or [],
            "timetable": t.timetable or {}
        })

    return {"teachers": result}


# ----------------------------
# 5) LIST STUDENTS
# ----------------------------
@router.get("/students", dependencies=[Depends(require_admin)])
def list_students(
    department: Optional[str] = None,
    year: Optional[int] = None,
    section: Optional[str] = None,
    db: Session = Depends(get_db)
):

    q = db.query(Student)

    if department:
        q = q.filter(Student.department == department)
    if year:
        q = q.filter(Student.year == year)
    if section:
        q = q.filter(Student.section == section)

    students = q.all()

    return {
        "students": [
            {
                "usn": s.usn,
                "name": s.name,
                "email": s.email,
                "department": s.department,
                "year": s.year,
                "section": s.section
            }
            for s in students
        ]
    }


# ----------------------------
# 6) ASSIGN SECTIONS
# ----------------------------
@router.post("/sections/assign", dependencies=[Depends(require_admin)])
def assign_section(payload: SectionAssignSchema, db: Session = Depends(get_db)):

    updated = db.query(Student).filter(Student.usn.in_(payload.usns)).update(
        {
            Student.department: payload.department,
            Student.year: payload.year,
            Student.section: payload.section
        },
        synchronize_session=False
    )

    db.commit()
    return {"message": f"Updated {updated} students"}


# ----------------------------
# 7) TIMETABLE UPLOAD (raw JSON, still available)
# ----------------------------
@router.post("/timetable", dependencies=[Depends(require_admin)])
def upload_timetable(payload: TimetableUploadSchema, db: Session = Depends(get_db)):

    teacher = db.query(Teacher).filter(Teacher.teacher_id == payload.teacher_id).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    teacher.timetable = payload.timetable
    db.commit()

    return {"message": "Timetable saved"}


# ----------------------------
# 7b) ADD SINGLE TIMETABLE SLOT (Format B)
# ----------------------------
@router.post("/timetable/slot", dependencies=[Depends(require_admin)])
def add_timetable_slot(payload: TimetableSlotSchema, db: Session = Depends(get_db)):
    """
    Add one slot to a teacher timetable.
    Timetable stored as:
    {
      "slots": [
        {"day": "Monday", "time": "9:00-10:00", "subject": "CN", "section": "CSE-3A"}
      ]
    }
    """

    teacher = db.query(Teacher).filter(Teacher.teacher_id == payload.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Ensure dict
    if not teacher.timetable or not isinstance(teacher.timetable, dict):
        teacher.timetable = {}

    slots = teacher.timetable.get("slots", [])
    if not isinstance(slots, list):
        slots = []

    new_slot = {
        "day": payload.day,
        "time": payload.time,
        "subject": payload.subject,
        "section": payload.section
    }

    slots.append(new_slot)
    teacher.timetable["slots"] = slots

    db.commit()

    return {"message": "Slot added", "slot": new_slot}


# ----------------------------
# 7c) SECTION-WISE TIMETABLE (Admin view)
# ----------------------------
@router.get("/timetable/section/{section}", dependencies=[Depends(require_admin)])
def section_timetable(section: str, db: Session = Depends(get_db)):
    """
    Aggregate timetable for a SECTION (e.g. CSE-3A) across all teachers.
    Looks through Teacher.timetable["slots"] using Format B.
    """

    teachers = db.query(Teacher).all()
    slots: List[Dict[str, Any]] = []

    for t in teachers:
        if not t.timetable or not isinstance(t.timetable, dict):
            continue

        t_slots = t.timetable.get("slots", [])
        if not isinstance(t_slots, list):
            continue

        for s in t_slots:
            try:
                if s.get("section") == section:
                    slots.append({
                        "day": s.get("day"),
                        "time": s.get("time"),
                        "subject": s.get("subject"),
                        "section": s.get("section"),
                        "teacher_id": t.teacher_id
                    })
            except Exception:
                continue

    # Optional: sort by day + time for nicer table on frontend
    day_order = {
        "Monday": 1, "Tuesday": 2, "Wednesday": 3,
        "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7
    }

    def sort_key(x):
        return (
            day_order.get(x.get("day"), 99),
            x.get("time") or ""
        )

    slots.sort(key=sort_key)

    return {
        "section": section,
        "count": len(slots),
        "slots": slots
    }


# ----------------------------
# 8) CLASSROOM SETUP
# ----------------------------
@router.post("/classrooms", dependencies=[Depends(require_admin)])
def create_classroom(payload: ClassroomSchema, db: Session = Depends(get_db)):

    img_paths = ",".join(payload.image_paths) if payload.image_paths else None

    room = db.query(Classroom).filter(Classroom.room_number == payload.room_number).first()

    if room:
        room.lat = payload.lat
        room.lon = payload.lon
        room.image_paths = img_paths
    else:
        room = Classroom(
            room_number=payload.room_number,
            lat=payload.lat,
            lon=payload.lon,
            image_paths=img_paths
        )
        db.add(room)

    db.commit()
    return {"message": "Classroom saved"}


# ----------------------------
# 9) ADMIN FACE REGISTER
# ----------------------------
@router.post("/face/register", dependencies=[Depends(require_admin)])
def admin_register_face(payload: FaceRegisterSchema, db: Session = Depends(get_db)):

    student = db.query(Student).filter(Student.usn == payload.usn).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    img_data = payload.image.split(",")[-1]
    img_bytes = base64.b64decode(img_data)

    os.makedirs("face_data", exist_ok=True)
    file_path = os.path.join("face_data", f"{student.usn}.jpg")

    with open(file_path, "wb") as f:
        f.write(img_bytes)

    return {"message": "Face registered", "path": file_path}


# ----------------------------
# 🔟 ATTENDANCE REPORT (NO 422)
# ----------------------------
@router.post("/attendance/report", dependencies=[Depends(require_admin)])
def attendance_report(body: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Safer version: accepts raw dict so frontend can send "" for dates
    without causing 422 errors.
    """

    subject = (body.get("subject") or "").strip() or None
    from_raw = (body.get("from_date") or "").strip() or None
    to_raw = (body.get("to_date") or "").strip() or None

    from_date_obj: Optional[date] = None
    to_date_obj: Optional[date] = None

    try:
        if from_raw:
            from_date_obj = date.fromisoformat(from_raw)
        if to_raw:
            to_date_obj = date.fromisoformat(to_raw)
    except Exception:
        # If parsing fails, just ignore filters instead of crashing
        from_date_obj = None
        to_date_obj = None

    q = db.query(Attendance)

    if subject:
        q = q.filter(Attendance.subject == subject)

    if from_date_obj:
        q = q.filter(Attendance.timestamp >= datetime.combine(from_date_obj, datetime.min.time()))

    if to_date_obj:
        q = q.filter(Attendance.timestamp <= datetime.combine(to_date_obj, datetime.max.time()))

    records = q.all()

    return {
        "count": len(records),
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
                "by_teacher": r.by_teacher
            }
            for r in records
        ]
    }
