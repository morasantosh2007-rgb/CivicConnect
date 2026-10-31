import math
import json
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def calculate_multimodal_severity(
    category: str,
    description: str,
    cv_classes: List[str],
    has_image: bool
) -> Tuple[str, float, str]:
    """
    Computes recommended severity based on hazard level, public danger, and evidence.
    Returns: (Severity, Confidence, EvidenceExplanation)
    """
    text = (description + " " + category + " " + " ".join(cv_classes)).lower()
    
    # Critical risk triggers
    critical_keywords = [
        "exposed wire", "electric shock", "sparking", "live wire", "open manhole", 
        "bridge collapse", "structural collapse", "gas leak", "electrocution"
    ]
    if any(k in text for k in critical_keywords) or "Electrical hazard" in cv_classes or "Open manholes" in category:
        return (
            "Critical",
            0.92,
            "Critical safety hazard detected: immediate physical danger or severe electrical/structural hazard."
        )

    # High risk triggers
    high_keywords = [
        "major waterlogging", "flooding", "burst pipe", "road collapse", "arterial road",
        "highway", "deep trench", "fallen tree on road", "traffic blocked"
    ]
    if any(k in text for k in high_keywords) or "Water leakage / Waterlogging" in cv_classes:
        return (
            "High",
            0.85,
            "High severity: significant public impact, risk of accidents or severe traffic disruption."
        )

    # Medium risk
    if category in ["Potholes", "Damaged roads", "Road cracks", "Overflowing dustbins", "Water leakage"]:
        return (
            "Medium",
            0.80 if has_image else 0.70,
            "Medium severity: infrastructure deterioration requiring scheduled municipal repair."
        )

    # Low risk
    return (
        "Low",
        0.75,
        "Low severity: minor cosmetic or low-risk maintenance issue."
    )

def suggest_department(category: str, description: str) -> str:
    """Map category and context to responsible department."""
    # First check category direct mapping
    mapped = settings.DEPARTMENT_MAPPINGS.get(category)
    if mapped:
        return mapped
    
    desc_lower = description.lower()
    if any(w in desc_lower for w in ["water", "pipe", "leak", "tap"]):
        return "Municipal Water Supply & Sewerage Board"
    elif any(w in desc_lower for w in ["light", "pole", "wire", "electric", "dark"]):
        return "Electrical & Public Lighting Authority"
    elif any(w in desc_lower for w in ["garbage", "trash", "waste", "bin", "smell", "dump"]):
        return "Sanitation & Solid Waste Management"
    elif any(w in desc_lower for w in ["drain", "sewage", "flood", "manhole", "waterlog"]):
        return "Stormwater Drainage & Flood Control"
    elif any(w in desc_lower for w in ["tree", "branch", "garden", "park"]):
        return "Urban Forestry & Parks Division"
    elif any(w in desc_lower for w in ["road", "pothole", "tar", "asphalt", "bridge"]):
        return "Public Works & Roads Department"
    
    return "General Municipal Administration"

def find_duplicate_grievances(
    category: str,
    lat: Optional[float],
    lon: Optional[float],
    exclude_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    Checks if a similar grievance exists within 120 meters.
    """
    if lat is None or lon is None:
        return None

    conn = get_db_connection()
    # Check open grievances within recent 30 days
    query = """
        SELECT id, ticket_number, title, category, latitude, longitude, status, created_at
        FROM grievances
        WHERE status NOT IN ('Resolved', 'Rejected')
    """
    if exclude_id:
        query += f" AND id != {exclude_id}"

    rows = conn.execute(query).fetchall()
    conn.close()

    closest_candidate = None
    min_dist = float("inf")

    for r in rows:
        row = dict_from_row(r)
        r_lat = row.get("latitude")
        r_lon = row.get("longitude")
        if r_lat is not None and r_lon is not None:
            dist = haversine_distance(lat, lon, r_lat, r_lon)
            # If within 120 meters
            if dist < 120.0:
                # Stronger if same category
                if row.get("category") == category or dist < 50.0:
                    if dist < min_dist:
                        min_dist = dist
                        closest_candidate = {
                            "candidate_id": row["id"],
                            "ticket_number": row["ticket_number"],
                            "title": row["title"],
                            "category": row["category"],
                            "distance_meters": round(dist, 1),
                            "status": row["status"]
                        }

    return closest_candidate
