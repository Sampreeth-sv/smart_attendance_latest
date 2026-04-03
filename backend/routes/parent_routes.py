from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from utils.db import get_db
from utils.jwt_token import verify_token

from models.student_model import Student
from models.attendance_model import Attendance

router = APIRouter()

@router.get("/my-child")
def get_child_attendance(token=Depends(verify_token), db: Session = Depends(get_db)):

    email = token.get("email")

    student = db.query(Student).filter(Student.parent_email == email).first()

    if not student:
        raise HTTPException(status_code=404, detail="No child linked")

    records = db.query(Attendance).filter(Attendance.usn == student.usn).all()

    return {
        "student": {
            "usn": student.usn,
            "name": student.name,
            "section": student.section
        },
        "attendance": [
            {
                "subject": r.subject,
                "timestamp": r.timestamp.isoformat(),
                "qr": r.qr,
                "location": r.location,
                "face": r.face
            }
            for r in records
        ]
    }