# utils/db.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# -------------------------------
# DATABASE CONFIG
# -------------------------------
DATABASE_URL = "mysql+pymysql://attendance_user:attendance123@localhost:3306/smart_attendance"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

# -------------------------------
# IMPORT MODELS BEFORE CREATE
# -------------------------------
from models.user_model import User
from models.student_model import Student
from models.teacher_model import Teacher
from models.classroom_model import Classroom
from models.attendance_model import Attendance
from models.active_session import ActiveSession

# -------------------------------
# CREATE TABLES
# -------------------------------
Base.metadata.create_all(bind=engine)

# -------------------------------
# DB SESSION
# -------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
