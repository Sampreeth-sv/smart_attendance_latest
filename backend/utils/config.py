import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'attendance.db')}")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")  # change in prod
JWT_ALGORITHM = "HS256"
QR_EXPIRY_SECONDS = 60 * 5  # QR valid for 5 minutes