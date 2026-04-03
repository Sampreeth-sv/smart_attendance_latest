from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict

from utils.db import get_db
from utils.jwt_token import verify_token

from models.attendance_model import Attendance
from models.active_session import ActiveSession
from models.student_model import Student

router = APIRouter()

# -------------------------------------------------------
# SECTION ANALYTICS
# -------------------------------------------------------
@router.get("/section/{section}")
def section_analytics(section: str, token=Depends(verify_token), db: Session = Depends(get_db)):

    students = db.query(Student).filter(Student.section == section).all()
    if not students:
        raise HTTPException(status_code=404, detail="No students in section")

    # total sessions per subject
    sessions = db.query(ActiveSession).filter(
        ActiveSession.section == section
    ).all()

    subject_sessions = defaultdict(int)
    for s in sessions:
        subject_sessions[s.subject] += 1

    # attendance count
    attendance = db.query(Attendance).all()

    subject_attendance = defaultdict(int)

    for a in attendance:
        if a.usn in [s.usn for s in students]:
            subject_attendance[a.subject] += 1

    result = []

    for subject, total in subject_sessions.items():
        attended = subject_attendance.get(subject, 0)
        percentage = (attended / (total * len(students))) * 100 if total > 0 else 0

        result.append({
            "subject": subject,
            "total_sessions": total,
            "attendance_records": attended,
            "percentage": round(percentage, 2)
        })

    return {
        "section": section,
        "subjects": result
    }


# -------------------------------------------------------
# STUDENT ANALYTICS
# -------------------------------------------------------
@router.get("/student/{usn}")
def student_analytics(usn: str, token=Depends(verify_token), db: Session = Depends(get_db)):

    student = db.query(Student).filter(Student.usn == usn).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    sessions = db.query(ActiveSession).filter(
        ActiveSession.section == student.section
    ).all()

    subject_sessions = defaultdict(int)
    for s in sessions:
        subject_sessions[s.subject] += 1

    attendance = db.query(Attendance).filter(
        Attendance.usn == usn
    ).all()

    subject_attendance = defaultdict(int)
    for a in attendance:
        subject_attendance[a.subject] += 1

    result = []
    total_attended = 0
    total_sessions = 0

    for subject, total in subject_sessions.items():
        attended = subject_attendance.get(subject, 0)
        percentage = (attended / total) * 100 if total > 0 else 0

        total_attended += attended
        total_sessions += total

        result.append({
            "subject": subject,
            "attended": attended,
            "total": total,
            "percentage": round(percentage, 2)
        })

    overall = (total_attended / total_sessions) * 100 if total_sessions > 0 else 0

    return {
        "usn": usn,
        "overall_percentage": round(overall, 2),
        "subjects": result
    }