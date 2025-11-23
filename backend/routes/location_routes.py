# routes/location_routes.py

from fastapi import APIRouter, Depends, HTTPException
from utils.jwt_token import verify_token
from utils.db import get_db
from sqlalchemy.orm import Session

router = APIRouter()

# ---------------------------------------------------
# TEMPORARY CLASSROOM LOCATION (you can update later)
# ---------------------------------------------------
CLASSROOM_LAT = 12.934533  
CLASSROOM_LNG = 77.605000  
ALLOWED_RADIUS = 0.0009     # ~100 meters


@router.get("/verify")
def verify_location(lat: float, lng: float, token=Depends(verify_token)):
    """
    Verify if student is inside classroom allowed range.
    Uses simple coordinate distance comparison (not full Haversine).
    """

    try:
        lat_diff = abs(lat - CLASSROOM_LAT)
        lng_diff = abs(lng - CLASSROOM_LNG)

        inside = lat_diff <= ALLOWED_RADIUS and lng_diff <= ALLOWED_RADIUS

        return {
            "inside_classroom": inside,
            "lat_diff": lat_diff,
            "lng_diff": lng_diff
        }

    except Exception as e:
        print("❌ Location verify error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/classroom-location")
def get_classroom_location(token=Depends(verify_token)):
    """
    Return classroom coordinates to frontend.
    """

    return {
        "latitude": CLASSROOM_LAT,
        "longitude": CLASSROOM_LNG,
        "radius": ALLOWED_RADIUS
    }
