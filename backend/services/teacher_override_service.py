from utils.db import SessionLocal
from models.attendance_model import Attendance

def teacher_mark(usn, classroom_id, subject=None):
    db = SessionLocal()
    try:
        att = Attendance(user_usn=usn, classroom_id=classroom_id, subject=subject, marked_by_teacher=True)
        db.add(att)
        db.commit()
        db.refresh(att)
        return att.id
    finally:
        db.close()