import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import engine, Base

import models.user_model
import models.attendance_model
import models.active_session
import models.teacher_model
import models.student_model

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")
