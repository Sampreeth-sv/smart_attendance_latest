from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from utils.db import Base
from datetime import datetime

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    usn = Column(String(20), nullable=False)
    student_name = Column(String(255), nullable=True)

    session_id = Column(String(100), nullable=False)
    classroom_id = Column(Integer, nullable=True)
    subject = Column(String(255), nullable=True)

    qr = Column(Boolean, default=False)
    location = Column(Boolean, default=False)
    face = Column(Boolean, default=False)

    by_teacher = Column(Boolean, default=False)

    timestamp = Column(DateTime, default=datetime.utcnow)
