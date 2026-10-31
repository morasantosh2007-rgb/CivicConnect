import json
import secrets
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row
from app.core.security import get_current_user
from app.services.verification_service import audit_engine
from app.schemas.schemas import VerificationRequest

router = APIRouter(prefix="/verification", tags=["Trust & Verify"])

VERIFICATION_UPLOADS = settings.UPLOAD_DIR / "verifications"
VERIFICATION_UPLOADS.mkdir(parents=True, exist_ok=True)

@router.post("/verify")
def verify_claim(
    req: VerificationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Evaluates factual statements against official government records and PIB releases.
    Generates grounded citations and verifiable outcome.
    """
    res = audit_engine.verify_fact_claim(claim_text=req.claim_text, source_url=req.source_url)
    share_token = f"audit_{secrets.token_urlsafe(16)}"
    now = datetime.utcnow().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO verifications (
            user_id, claim_text, source_url, media_url, media_type,
            verdict, confidence_score, extracted_claims_json, explanation,
            citations_json, forensic_report_json, share_token, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        current_user["id"],
        req.claim_text,
        req.source_url,
        req.media_url,
        req.media_type,
        res["verdict"],
        res["confidence_score"],
        json.dumps(res["extracted_claims"]),
        res["explanation"],
        json.dumps(res["citations"]),
        None,
        share_token,
        now
    ))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()

    res["report_id"] = report_id
    res["share_token"] = share_token
    return res

@router.post("/audit-media")
async def audit_multimedia(
    claim_text: Optional[str] = Form("Forensic audit of submitted media asset"),
    media_file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Executes forensic media analysis on uploaded image, video, or audio.
    Runs Error Level Analysis (ELA), EXIF metadata inspection, and synthetic artifact checks.
    """
    ext = Path(media_file.filename).suffix.lower() if media_file.filename else ".jpg"
    is_image = ext in [".jpg", ".jpeg", ".png", ".webp"]
    is_audio = ext in [".wav", ".mp3", ".ogg", ".m4a"]
    is_video = ext in [".mp4", ".mov", ".avi", ".webm"]

    media_type = "image" if is_image else ("audio" if is_audio else ("video" if is_video else "image"))
    filename = f"media_{secrets.token_hex(6)}{ext}"
    file_path = VERIFICATION_UPLOADS / filename

    with open(file_path, "wb") as f:
        content = await media_file.read()
        f.write(content)

    media_url = f"/uploads/verifications/{filename}"

    # Run forensic audit
    forensic_res = audit_engine.analyze_media_forensics(file_path=file_path, media_type=media_type)

    # Correlate with fact checking
    fact_res = audit_engine.verify_fact_claim(claim_text=claim_text or "Media claim audit")

    share_token = f"audit_media_{secrets.token_urlsafe(16)}"
    now = datetime.utcnow().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO verifications (
            user_id, claim_text, source_url, media_url, media_type,
            verdict, confidence_score, extracted_claims_json, explanation,
            citations_json, forensic_report_json, share_token, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        current_user["id"],
        claim_text,
        None,
        media_url,
        media_type,
        fact_res["verdict"],
        forensic_res.get("manipulation_probability", 0.5),
        json.dumps(fact_res["extracted_claims"]),
        forensic_res.get("assessment", "Forensic analysis completed."),
        json.dumps(fact_res["citations"]),
        json.dumps(forensic_res),
        share_token,
        now
    ))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "report_id": report_id,
        "media_url": media_url,
        "media_type": media_type,
        "forensic_analysis": forensic_res,
        "fact_check": fact_res,
        "share_token": share_token
    }

@router.get("/history")
def get_verification_history(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns past verification and forensic audits for the user."""
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM verifications WHERE user_id = ? ORDER BY id DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()

    items = []
    for r in rows:
        d = dict_from_row(r)
        if d.get("citations_json"):
            try:
                d["citations"] = json.loads(d["citations_json"])
            except Exception:
                d["citations"] = []
        if d.get("forensic_report_json"):
            try:
                d["forensic_report"] = json.loads(d["forensic_report_json"])
            except Exception:
                d["forensic_report"] = None
        items.append(d)

    return {"total": len(items), "items": items}

@router.get("/share/{share_token}")
def get_public_report(share_token: str):
    """Publicly viewable verification certificate without revealing user identity."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM verifications WHERE share_token = ?", (share_token,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Verification report not found or expired.")

    d = dict_from_row(row)
    del d["user_id"] # Strip private citizen identifier

    if d.get("citations_json"):
        try:
            d["citations"] = json.loads(d["citations_json"])
        except Exception:
            d["citations"] = []
    if d.get("forensic_report_json"):
        try:
            d["forensic_report"] = json.loads(d["forensic_report_json"])
        except Exception:
            d["forensic_report"] = None

    return d
