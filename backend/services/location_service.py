# Location helper (re-usable)
def within_radius(student_lat, student_lon, room_lat, room_lon, radius_m=50):
    import math
    R = 6371000
    phi1 = math.radians(student_lat)
    phi2 = math.radians(room_lat)
    dphi = math.radians(room_lat - student_lat)
    dlambda = math.radians(room_lon - student_lon)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    dist = R * c
    return dist <= radius_m, dist