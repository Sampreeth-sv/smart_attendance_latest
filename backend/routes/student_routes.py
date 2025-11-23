from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.db import get_db
from utils.jwt_token import verify_token
from models.user_model import User
from models.student_model import Student

router = APIRouter()

@router.get("/me")
def get_student_profile(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    usn = token.get("usn")

    user = db.query(User).filter(User.usn == usn).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record missing")

    return {
        "id": student.id,
        "usn": student.usn,
        "name": student.name,
        "email": student.email,
        "department": student.department,
        "year": student.year,
        "section": student.section
    }
