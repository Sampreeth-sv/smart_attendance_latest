# small helper functions used by qr_routes; kept for separation of concerns
import qrcode
import io
from utils.config import QR_EXPIRY_SECONDS
import time

_active_qrs = {}

def create_qr_for_classroom(classroom_id: int):
    token = f"{int(time.time())}-{classroom_id}"
    _active_qrs[token] = {"classroom_id": classroom_id, "expires": time.time() + QR_EXPIRY_SECONDS}
    img = qrcode.make(token)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return token, buf

def validate_token(token: str):
    entry = _active_qrs.get(token)
    if not entry:
        return False, "invalid"
    if time.time() > entry["expires"]:
        _active_qrs.pop(token, None)
        return False, "expired"
    return True, entry["classroom_id"]