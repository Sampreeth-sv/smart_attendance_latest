from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from utils.db import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    # Link with users.id (1-to-1 relation)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    # Student details
    usn = Column(String(20), unique=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)

    department = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    section = Column(String(10), nullable=True)

    # Relationship back to user
    user = relationship("User", backref="student_profile")
