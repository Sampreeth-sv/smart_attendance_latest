from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import Routers
from routes import (
    auth_routes,
    attendance_routes,
    facial_routes,
    qr_routes,
    location_routes,
    face_registration_routes,
    teacher_override_routes,
    teacher_routes,
    admin_routes
)

app = FastAPI(title="Smart Attendance System")

# 🔥 FIXED CORS (FINAL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],         # Allow POST, GET, PUT, DELETE
    allow_headers=["*"],         # Allow all headers
    expose_headers=["*"],        # ⭐ REQUIRED FOR FRONTEND
)

# Routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(attendance_routes.router, prefix="/attendance", tags=["Attendance"])
app.include_router(facial_routes.router, prefix="/facial", tags=["Facial Recognition"])
app.include_router(qr_routes.router, prefix="/qr", tags=["QR"])
app.include_router(location_routes.router, prefix="/location", tags=["Location"])
app.include_router(face_registration_routes.router, prefix="/face-registration", tags=["Face Registration"])
app.include_router(teacher_override_routes.router, prefix="/teacher", tags=["Teacher Override"])
app.include_router(teacher_routes.router, prefix="/teacher", tags=["Teacher"])
app.include_router(admin_routes.router, prefix="/admin", tags=["Admin"])

@app.get("/")
def home():
    return {"message": "Smart Attendance Backend Running ✅"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
