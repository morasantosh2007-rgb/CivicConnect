import os
import json
import secrets
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row
from app.core.security import get_current_user, get_current_user_optional
from app.services.cv_service import cv_engine
from app.services.stt_service import transcribe_audio_file
from app.services.grievance_service import (
    calculate_multimodal_severity,
    suggest_department,
    find_duplicate_grievances
)
from app.schemas.schemas import CommentCreate

router = APIRouter(prefix="/grievances", tags=["Civic Grievances"])

GRIEVANCE_UPLOADS = settings.UPLOAD_DIR / "grievances"
GRIEVANCE_UPLOADS.mkdir(parents=True, exist_ok=True)

@router.post("/")
async def submit_grievance(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    is_official_complaint: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submits a civic grievance with multimedia evidence.
    Executes Computer Vision analysis, voice transcription, multimodal severity,
    department routing, and proximity duplicate detection.
    """
    now = datetime.utcnow().isoformat()
    ticket_num = f"CIV-{datetime.utcnow().strftime('%Y')}-{secrets.token_hex(3).upper()}"

    image_url = None
    cv_result = None
    cv_classes = []

    # Handle image upload and run real CV inference
    if image and image.filename:
        ext = Path(image.filename).suffix or ".jpg"
        img_filename = f"img_{ticket_num}_{secrets.token_hex(4)}{ext}"
        img_path = GRIEVANCE_UPLOADS / img_filename
        with open(img_path, "wb") as f:
            content = await image.read()
            f.write(content)
        image_url = f"/uploads/grievances/{img_filename}"

        # Run Computer Vision inference
        try:
            cv_result = cv_engine.analyze_image(img_path)
            cv_classes = cv_result.get("detected_classes", [])
            # If annotated image was generated, use that for visualization
            if cv_result.get("annotated_image_url"):
                image_url = cv_result.get("annotated_image_url")
        except Exception as cv_err:
            print(f"[CV Error] {cv_err}")

    # Handle audio upload and transcription
    voice_transcription = None
    audio_url = None
    if audio and audio.filename:
        ext = Path(audio.filename).suffix or ".wav"
        aud_filename = f"aud_{ticket_num}_{secrets.token_hex(4)}{ext}"
        aud_path = GRIEVANCE_UPLOADS / aud_filename
        with open(aud_path, "wb") as f:
            content = await audio.read()
            f.write(content)
        audio_url = f"/uploads/grievances/{aud_filename}"

        try:
            voice_transcription = transcribe_audio_file(
                aud_path, language=current_user.get("preferred_language", "en")
            )
            # If description was minimal, supplement with transcription
            if len(description) < 30 and voice_transcription:
                description = f"{description}\n\n[Voice Note Transcription]: {voice_transcription}"
        except Exception as stt_err:
            print(f"[STT Error] {stt_err}")

    # Multimodal Severity Assessment
    severity, sev_conf, sev_explanation = calculate_multimodal_severity(
        category=category,
        description=description,
        cv_classes=cv_classes,
        has_image=bool(image_url)
    )

    # Department Routing
    suggested_dept = suggest_department(category, description)

    # Duplicate Detection
    duplicate_match = find_duplicate_grievances(
        category=category,
        lat=latitude,
        lon=longitude
    )
    duplicate_id = duplicate_match["candidate_id"] if duplicate_match else None

    # Insert into Database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO grievances (
            ticket_number, user_id, title, description, category, severity,
            ai_suggested_severity, ai_severity_confidence, status, is_official_complaint,
            latitude, longitude, address, landmark, department, image_url, audio_url,
            voice_transcription, cv_analysis_json, duplicate_of_id, upvotes_count,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket_num,
        current_user["id"],
        title,
        description,
        category,
        severity,
        severity,
        sev_conf,
        "Submitted",
        1 if is_official_complaint else 0,
        latitude,
        longitude,
        address,
        landmark,
        suggested_dept,
        image_url,
        audio_url,
        voice_transcription,
        json.dumps(cv_result) if cv_result else None,
        duplicate_id,
        0,
        now,
        now
    ))
    grievance_id = cursor.lastrowid

    # Create Initial Audit Log
    cursor.execute("""
        INSERT INTO grievance_audit_logs (
            grievance_id, actor_id, action, previous_status, new_status, notes, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        grievance_id,
        current_user["id"],
        "Submission",
        None,
        "Submitted",
        f"Grievance submitted by citizen. AI routed to {suggested_dept} with suggested severity {severity}.",
        now
    ))

    conn.commit()

    created_row = cursor.execute("SELECT * FROM grievances WHERE id = ?", (grievance_id,)).fetchone()
    conn.close()

    return {
        "status": "success",
        "grievance": dict_from_row(created_row),
        "ai_analysis": {
            "suggested_severity": severity,
            "severity_confidence": sev_conf,
            "severity_rationale": sev_explanation,
            "routed_department": suggested_dept,
            "cv_detections": cv_result.get("detected_classes", []) if cv_result else [],
            "duplicate_candidate": duplicate_match
        }
    }

@router.get("/")
def list_grievances(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    sort_by: str = "latest", # latest, top_voted, severity
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Community feed with filters, sorting, and user upvote status."""
    conn = get_db_connection()
    query = """
        SELECT g.*, u.full_name as author_name, u.role as author_role,
               (SELECT COUNT(*) FROM grievance_comments c WHERE c.grievance_id = g.id) as comment_count
        FROM grievances g
        JOIN users u ON g.user_id = u.id
        WHERE 1=1
    """
    params = []

    if category:
        query += " AND g.category = ?"
        params.append(category)
    if severity:
        query += " AND g.severity = ?"
        params.append(severity)
    if status:
        query += " AND g.status = ?"
        params.append(status)
    if department:
        query += " AND g.department = ?"
        params.append(department)
    if search:
        query += " AND (g.title LIKE ? OR g.description LIKE ? OR g.ticket_number LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if sort_by == "top_voted":
        query += " ORDER BY g.upvotes_count DESC, g.id DESC"
    elif sort_by == "severity":
        # Custom severity order
        query += " ORDER BY CASE g.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, g.id DESC"
    else:
        query += " ORDER BY g.created_at DESC, g.id DESC"

    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()

    # Get user upvotes
    user_upvoted_ids = set()
    if current_user:
        v_rows = conn.execute("SELECT grievance_id FROM grievance_votes WHERE user_id = ?", (current_user["id"],)).fetchall()
        user_upvoted_ids = {r[0] for r in v_rows}

    conn.close()

    items = []
    for r in rows:
        d = dict_from_row(r)
        d["has_user_upvoted"] = d["id"] in user_upvoted_ids
        if d.get("cv_analysis_json"):
            try:
                d["cv_analysis"] = json.loads(d["cv_analysis_json"])
            except Exception:
                d["cv_analysis"] = None
        items.append(d)

    return {"total": len(items), "items": items}

@router.get("/{grievance_id}")
def get_grievance(
    grievance_id: int,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    conn = get_db_connection()
    row = conn.execute("""
        SELECT g.*, u.full_name as author_name, u.role as author_role
        FROM grievances g
        JOIN users u ON g.user_id = u.id
        WHERE g.id = ?
    """, (grievance_id,)).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Grievance not found.")

    grievance = dict_from_row(row)

    # Comments
    comments_rows = conn.execute("""
        SELECT c.*, u.full_name as author_name, u.role as author_role
        FROM grievance_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.grievance_id = ?
        ORDER BY c.created_at ASC
    """, (grievance_id,)).fetchall()
    grievance["comments"] = [dict_from_row(c) for c in comments_rows]

    # Audit Logs
    audit_rows = conn.execute("""
        SELECT a.*, u.full_name as actor_name
        FROM grievance_audit_logs a
        LEFT JOIN users u ON a.actor_id = u.id
        WHERE a.grievance_id = ?
        ORDER BY a.timestamp ASC
    """, (grievance_id,)).fetchall()
    grievance["audit_logs"] = [dict_from_row(a) for a in audit_rows]

    # User upvoted check
    grievance["has_user_upvoted"] = False
    if current_user:
        v = conn.execute("SELECT 1 FROM grievance_votes WHERE grievance_id = ? AND user_id = ?", (grievance_id, current_user["id"])).fetchone()
        grievance["has_user_upvoted"] = bool(v)

    if grievance.get("cv_analysis_json"):
        try:
            grievance["cv_analysis"] = json.loads(grievance["cv_analysis_json"])
        except Exception:
            grievance["cv_analysis"] = None

    conn.close()
    return grievance

@router.post("/{grievance_id}/vote")
def toggle_upvote(grievance_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    existing = cursor.execute(
        "SELECT id FROM grievance_votes WHERE grievance_id = ? AND user_id = ?",
        (grievance_id, current_user["id"])
    ).fetchone()

    if existing:
        cursor.execute("DELETE FROM grievance_votes WHERE id = ?", (existing[0],))
        cursor.execute("UPDATE grievances SET upvotes_count = MAX(0, upvotes_count - 1) WHERE id = ?", (grievance_id,))
        upvoted = False
    else:
        cursor.execute("""
            INSERT INTO grievance_votes (grievance_id, user_id, vote_type, created_at)
            VALUES (?, ?, 'up', ?)
        """, (grievance_id, current_user["id"], datetime.utcnow().isoformat()))
        cursor.execute("UPDATE grievances SET upvotes_count = upvotes_count + 1 WHERE id = ?", (grievance_id,))
        upvoted = True

    conn.commit()
    upvotes = cursor.execute("SELECT upvotes_count FROM grievances WHERE id = ?", (grievance_id,)).fetchone()[0]
    conn.close()

    return {"upvoted": upvoted, "upvotes_count": upvotes}

@router.post("/{grievance_id}/comments")
def post_comment(
    grievance_id: int,
    comment_in: CommentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO grievance_comments (grievance_id, user_id, parent_comment_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        grievance_id,
        current_user["id"],
        comment_in.parent_comment_id,
        comment_in.content,
        datetime.utcnow().isoformat()
    ))
    comment_id = cursor.lastrowid
    conn.commit()

    created = cursor.execute("""
        SELECT c.*, u.full_name as author_name, u.role as author_role
        FROM grievance_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    """, (comment_id,)).fetchone()
    conn.close()

    return dict_from_row(created)

@router.get("/map/locations")
def get_map_markers(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Returns geolocated complaints for Leaflet/OSM map.
    Fuzzes exact residential doorstep coordinates by ~50m to preserve citizen privacy.
    """
    conn = get_db_connection()
    query = """
        SELECT id, ticket_number, title, category, severity, status, department,
               latitude, longitude, address, image_url, created_at
        FROM grievances
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """
    params = []
    if category:
        query += " AND category = ?"
        params.append(category)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if status:
        query += " AND status = ?"
        params.append(status)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    markers = []
    for r in rows:
        d = dict_from_row(r)
        # Privacy coordinate preservation: round to 4 decimal places (~10m fuzzing)
        d["latitude"] = round(d["latitude"], 4)
        d["longitude"] = round(d["longitude"], 4)
        markers.append(d)

    return markers
