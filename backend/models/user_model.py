from sqlalchemy import Column, Integer, String, Boolean
from utils.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    usn = Column(String(20), unique=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)

    # Plain password (you prefer no hashing)
    password_hash = Column(String(255), nullable=False)

    is_teacher = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    photo_path = Column(String(255), nullable=True)
