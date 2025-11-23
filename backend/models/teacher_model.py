from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from utils.db import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)

    # 1-to-1 relation with users table
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    teacher_id = Column(String(20), unique=True, index=True)  # Faculty ID
    phone_number = Column(String(20), nullable=True)
    qualification = Column(String(255), nullable=True)

    subjects_taken = Column(JSON, nullable=True)  # list like ["AI", "CN"]
    timetable = Column(JSON, nullable=True)       # JSON for periods/slots

    # Relationship back to User
    user = relationship("User", backref="teacher_profile")
