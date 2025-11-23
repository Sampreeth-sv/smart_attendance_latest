# routes/teacher_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.db import get_db
from utils.jwt_token import verify_token
from models.user_model import User
from models.teacher_model import Teacher

router = APIRouter()

# -------------------------------------------
# 📘 Fetch Teacher Subjects
# -------------------------------------------
@router.get("/subjects")
def get_teacher_subjects(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Return subjects handled by the logged-in teacher"""

    email = token.get("email")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_teacher:
        raise HTTPException(status_code=403, detail="Not a teacher")

    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    if not teacher:
        return {"subjects": []}

    return {
        "teacher_id": teacher.teacher_id,
        "subjects": teacher.subjects_taken or []
    }
