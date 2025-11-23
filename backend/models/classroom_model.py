from sqlalchemy import Column, Integer, String, Float
from utils.db import Base

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)

    # MUST include length in MySQL
    room_number = Column(String(50), unique=True, index=True)

    # center coords for room (latitude, longitude)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

    # Optional: images (comma-separated)
    image_paths = Column(String(255), nullable=True)
