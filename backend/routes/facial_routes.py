from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from utils.jwt_token import verify_token
from utils.db import get_db
from models.user_model import User
import base64
import os
from deepface import DeepFace
from datetime import datetime

router = APIRouter()

class FaceVerifySchema(BaseModel):
    image: str
    user_id: str

@router.post("/verify")
def verify_face(payload: FaceVerifySchema, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """
    Verify face using DeepFace.
    - If no registered face exists, fails verification.
    - Uses a temp file for comparison, removes it afterwards.
    """

    try:
        # Lookup user by USN, not name
        user = db.query(User).filter(User.usn == payload.user_id).first()

        if not user:
            return {"verified": False, "message": "User not found"}

        # Path where registered face photos are stored
        registered_face_path = f"face_data/{user.usn}.jpg"

        if not os.path.exists(registered_face_path):
            # No registered face — fail verification
            print(f"❌ No registered face for {user.usn} — verification failed.")
            return {
                "verified": False,
                "message": "No registered face found. Please register your face first.",
                "confidence": 0.00
            }

        # Decode incoming image (data URL or base64 string)
        image_str = payload.image
        if "," in image_str:
            image_str = image_str.split(",")[1]

        image_bytes = base64.b64decode(image_str)

        # Save temp image file
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        temp_path = f"face_data/temp_{user.usn}_{timestamp}.jpg"
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(image_bytes)

        print(f"📸 Verifying face for {user.usn} using DeepFace...")

        # Run DeepFace verify (enforce_detection False to avoid strict failure)
        result = DeepFace.verify(
            img1_path=registered_face_path,
            img2_path=temp_path,
            model_name="VGG-Face",
            enforce_detection=False
        )

        # Clean up temp file
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            print(f"⚠️ Failed to remove temp file {temp_path}: {e}")

        verified = result.get("verified", False)
        distance = result.get("distance", None)
        threshold = result.get("threshold", None)

        print(f"✅ Face verification: verified={verified}, distance={distance}, threshold={threshold}")

        # Compute a safety confidence if possible
        confidence = None
        if distance is not None and threshold:
            try:
                confidence = 1 - (distance / threshold) if threshold > 0 else 0
            except Exception:
                confidence = None

        return {
            "verified": bool(verified),
            "message": "Face verified successfully" if verified else "Face verification failed",
            "confidence": confidence,
            "distance": distance,
            "threshold": threshold
        }

    except Exception as e:
        print(f"❌ Error in face verification: {e}")
        return {
            "verified": False,
            "message": f"Verification error: {str(e)}",
            "confidence": 0.0
        }
