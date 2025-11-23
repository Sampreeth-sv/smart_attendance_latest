# routes/face_registration_routes.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from utils.jwt_token import verify_token
from utils.db import get_db
from models.user_model import User
import base64
import os
from datetime import datetime

router = APIRouter()

# Schema for receiving the face image from frontend
class FaceRegisterSchema(BaseModel):
    image: str
    user_id: str


@router.post("/register")
def register_face(payload: FaceRegisterSchema, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """
    Save a user's face image to the face_data folder.
    This will be used for future DeepFace verification.
    """

    try:
        # Fetch user
        user = db.query(User).filter(User.usn == payload.user_id).first()


        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Decode incoming image
        image_str = payload.image
        if "," in image_str:
            image_str = image_str.split(",")[1]  # Remove "data:image/jpeg;base64,"

        try:
            image_bytes = base64.b64decode(image_str)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Ensure folder exists
        folder_path = "face_data"
        os.makedirs(folder_path, exist_ok=True)

        # Save image as <usn>.jpg
        save_path = os.path.join(folder_path, f"{user.usn}.jpg")

        with open(save_path, "wb") as f:
            f.write(image_bytes)

        print(f"📸 Face registered for user: {user.name} ({user.usn}) → {save_path}")

        return {
            "success": True,
            "message": "Face registered successfully!",
            "file": f"{user.usn}.jpg"
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"❌ Error in face registration: {e}")
        raise HTTPException(status_code=500, detail=str(e))
