from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row
from app.core.security import get_current_user_optional, get_current_user
from app.services.pib_ingestion import (
    fetch_live_pib_releases,
    evaluate_scheme_eligibility,
    seed_benchmark_schemes
)
from app.services.scheme_translations import get_localized_scheme_attributes
from app.services.tts_service import synthesize_speech
from app.schemas.schemas import SchemeEligibilityCheck, TextToSpeechRequest

router = APIRouter(prefix="/policies", tags=["Policies & Schemes"])

@router.get("/")
async def list_policies(
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_scheme: Optional[int] = None,
    language: str = "en",
    limit: int = 50,
    offset: int = 0
):
    conn = get_db_connection()
    query = "SELECT * FROM policy_announcements WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)

    if is_scheme is not None:
        query += " AND is_scheme = ?"
        params.append(is_scheme)

    if search:
        query += " AND (title LIKE ? OR summary_en LIKE ? OR original_text LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY publication_date DESC, id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    total_count = conn.execute("SELECT COUNT(*) FROM policy_announcements").fetchone()[0]
    conn.close()

    results = []
    summary_key = f"summary_{language}" if language in ["te", "hi", "ta", "kn"] else "summary_en"

    for r in rows:
        d = dict_from_row(r)
        # Select appropriate language summary with fallback to English
        d["localized_summary"] = d.get(summary_key) or d.get("summary_en", "")
        # Apply authoritative native translations for titles, departments, benefits, targets
        loc_attrs = get_localized_scheme_attributes(d.get("title", ""), language)
        if loc_attrs:
            d["title"] = loc_attrs["title"]
            d["department"] = loc_attrs["department"]
            d["category"] = loc_attrs["category"]
            d["affected_citizens"] = loc_attrs["affected_citizens"]
            d["deadline"] = loc_attrs["deadline"]
            d["benefits_description"] = loc_attrs["benefits_description"]
        results.append(d)

    return {
        "total": total_count,
        "items": results,
        "language": language
    }

@router.get("/schemes")
async def list_schemes(language: str = "en"):
    return await list_policies(is_scheme=1, language=language)

@router.get("/{policy_id}")
async def get_policy(policy_id: int, language: str = "en"):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM policy_announcements WHERE id = ?", (policy_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Policy or scheme not found.")

    d = dict_from_row(row)
    summary_key = f"summary_{language}" if language in ["te", "hi", "ta", "kn"] else "summary_en"
    d["localized_summary"] = d.get(summary_key) or d.get("summary_en", "")
    loc_attrs = get_localized_scheme_attributes(d.get("title", ""), language)
    if loc_attrs:
        d["title"] = loc_attrs["title"]
        d["department"] = loc_attrs["department"]
        d["category"] = loc_attrs["category"]
        d["affected_citizens"] = loc_attrs["affected_citizens"]
        d["deadline"] = loc_attrs["deadline"]
        d["benefits_description"] = loc_attrs["benefits_description"]
    return d

@router.post("/refresh-live-pib")
async def trigger_pib_refresh():
    """Fetches live official releases from Press Information Bureau (PIB) RSS feeds."""
    ingested = await fetch_live_pib_releases()
    return {
        "status": "success",
        "message": f"Successfully queried live PIB RSS feed. {len(ingested)} new official notices ingested.",
        "new_records": ingested
    }

@router.post("/check-eligibility")
async def check_eligibility(
    criteria: SchemeEligibilityCheck,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Evaluates citizen's profile against all official government schemes.
    Considers age, income, state, category, disability, employment status.
    """
    conn = get_db_connection()
    schemes = conn.execute("SELECT * FROM policy_announcements WHERE is_scheme = 1").fetchall()
    
    # If user is logged in and criteria fields are blank, merge with profile
    profile_data = {}
    if current_user:
        p_row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (current_user["id"],)).fetchone()
        if p_row:
            profile_data = dict_from_row(p_row)

    conn.close()

    # Priority: criteria specified in request, fallback to saved profile
    effective_profile = {
        "age": criteria.age if criteria.age is not None else profile_data.get("age"),
        "annual_income": criteria.annual_income if criteria.annual_income is not None else profile_data.get("annual_income"),
        "state": criteria.state or profile_data.get("state"),
        "district": criteria.district or profile_data.get("district"),
        "category": criteria.category or profile_data.get("category"),
        "disability_status": criteria.disability_status or profile_data.get("disability_status"),
        "employment_status": criteria.employment_status or profile_data.get("employment_status"),
        "occupation": profile_data.get("occupation", "")
    }

    evaluations = []
    for s_row in schemes:
        s_dict = dict_from_row(s_row)
        ev = evaluate_scheme_eligibility(s_dict, effective_profile, language=criteria.language)
        evaluations.append(ev)

    return {
        "evaluated_schemes_count": len(evaluations),
        "profile_evaluated": effective_profile,
        "results": evaluations
    }

@router.post("/speak")
async def speak_text(req: TextToSpeechRequest):
    """Generates real regional voice MP3 narration."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    audio_url = await synthesize_speech(req.text, language=req.language)
    return {
        "status": "success",
        "audio_url": audio_url,
        "language": req.language
    }
