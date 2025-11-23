# routes/qr_routes.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from utils.db import get_db
from models.active_session import ActiveSession
from utils.jwt_token import verify_token
from datetime import datetime, timedelta
import uuid

router = APIRouter()


# ---------------------------
# 📘 Schemas
# ---------------------------
class QRGenerateSchema(BaseModel):
    subject: str
    teacher_id: str
    section: str      # ✅ REQUIRED NOW


class QRStopSchema(BaseModel):
    session_id: str


# ---------------------------
# 🚀 Generate New QR Session
# ---------------------------
@router.post("/generate")
def generate_qr(
    payload: QRGenerateSchema,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Creates a new QR attendance session.
    Includes SECTION.
    Only one active session allowed.
    """

    # Deactivate previous sessions
    db.query(ActiveSession).update({ActiveSession.active: False})
    db.commit()

    session_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # CREATE NEW SESSION WITH SECTION
    new_session = ActiveSession(
        session_id=session_id,
        subject=payload.subject,
        teacher_id=payload.teacher_id,
        section=payload.section,     # ✅ ADDED
        active=True,
        created_at=datetime.utcnow(),
        expires_at=expires_at
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "message": "QR session created",
        "session_id": session_id,
        "subject": payload.subject,
        "section": payload.section,       # ✅ SEND BACK
        "expires_at": expires_at.isoformat()
    }


# ---------------------------
# 🟥 Stop QR Session
# ---------------------------
@router.post("/stop")
def stop_qr(
    payload: QRStopSchema,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):

    session = db.query(ActiveSession).filter(
        ActiveSession.session_id == payload.session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.active = False
    db.commit()

    return {"message": "QR session stopped", "session_id": payload.session_id}


# ---------------------------
# 🔎 Verify QR Session Validity
# ---------------------------
@router.get("/verify/{session_id}")
def verify_qr_session(session_id: str, db: Session = Depends(get_db)):

    session = db.query(ActiveSession).filter(
        ActiveSession.session_id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.active or (
        session.expires_at and session.expires_at < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Session expired")

    return {
        "valid": True,
        "subject": session.subject,
        "teacher_id": session.teacher_id,
        "section": session.section      # ✅ INCLUDED
    }


# ---------------------------
# 🟩 Fetch Active Session (Student Dashboard)
# ---------------------------
@router.get("/active-session")
def get_active_session(db=Depends(get_db)):
    now = datetime.utcnow()

    # Auto-expire old sessions
    db.query(ActiveSession).filter(
        ActiveSession.expires_at < now
    ).update({ActiveSession.active: False})
    db.commit()

    # Latest active session
    active_session = (
        db.query(ActiveSession)
        .filter(
            ActiveSession.active == True,
            ActiveSession.expires_at > now
        )
        .order_by(ActiveSession.created_at.desc())
        .first()
    )

    if not active_session:
        return {"active": False}

    return {
        "active": True,
        "session_id": active_session.session_id,
        "subject": active_session.subject,
        "teacher_id": active_session.teacher_id,
        "section": active_session.section,   # ✅ IMPORTANT
        "expires_at": active_session.expires_at.isoformat(),
    }
