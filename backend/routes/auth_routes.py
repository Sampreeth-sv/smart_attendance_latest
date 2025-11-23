# routes/auth_routes.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from utils.db import get_db
from models.user_model import User
from models.student_model import Student
from models.teacher_model import Teacher
from utils.jwt_token import create_access_token

router = APIRouter()


# ---------------------------
# 📘 Schemas
# ---------------------------
class LoginSchema(BaseModel):
    email: str
    password: str


# ---------------------------
# 🔐 LOGIN (Supports Student + Teacher + Admin)
# ---------------------------
@router.post("/login")
def login(payload: LoginSchema, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == payload.email).first()

    if not user or user.password_hash != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ====== If STUDENT ======
    student = None
    teacher = None

    if not user.is_teacher and not user.is_admin:
        student = db.query(Student).filter(Student.user_id == user.id).first()

    if user.is_teacher:
        teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()

    # BUILD JWT
    token_data = {
        "usn": user.usn,
        "email": user.email,
        "is_teacher": user.is_teacher,
        "is_admin": user.is_admin,
        "sub": user.email
    }

    if student:
        token_data["section"] = student.section
        token_data["department"] = student.department
        token_data["year"] = student.year

    token = create_access_token(token_data)

    # BUILD RESPONSE USER OBJECT
    user_json = {
        "usn": user.usn,
        "name": user.name,
        "email": user.email,
        "is_teacher": user.is_teacher,
        "is_admin": user.is_admin
    }

    if student:
        user_json["department"] = student.department
        user_json["year"] = student.year
        user_json["section"] = student.section

    if teacher:
        user_json["subjects"] = teacher.subjects_taken or []

    return {
        "access_token": token,
        "user": user_json
    }
