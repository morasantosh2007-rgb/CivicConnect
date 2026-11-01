import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db_connection, dict_from_row
from app.core.security import get_current_user
from app.services.browser_agent import (
    browser_agent,
    SUPPORTED_GOVERNMENT_SERVICES
)
from app.services.services_translations import get_localized_service
from app.schemas.schemas import ServiceApplicationRequest, ServiceApprovalRequest

router = APIRouter(prefix="/services", tags=["Autonomous Bureaucracy Agent"])

@router.get("/catalog")
def get_service_catalog(language: str = "en"):
    """Lists supported government services available for agent assistance."""
    return [get_localized_service(s, language) for s in SUPPORTED_GOVERNMENT_SERVICES]

@router.post("/initiate")
async def initiate_service(
    req: ServiceApplicationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Step 1: Gathers profile, initiates browser agent session,
    navigates portal, generates pre-approval snapshot.
    Pauses before submission at mandatory citizen approval checkpoint.
    """
    conn = get_db_connection()
    p_row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (current_user["id"],)).fetchone()
    conn.close()

    profile = dict_from_row(p_row) if p_row else {}
    profile["full_name"] = current_user["full_name"]
    profile["email"] = current_user["email"]

    try:
        result = await browser_agent.initiate_application_draft(
            user_id=current_user["id"],
            service_id=req.service_id,
            profile_data=profile,
            custom_inputs=req.custom_inputs
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent initialization error: {e}")

@router.post("/approve")
async def approve_and_submit(
    req: ServiceApprovalRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Step 2: Explicit citizen consent checkpoint.
    Only proceeds with final form submission when approved == True.
    """
    if not req.approved:
        # User declined or cancelled
        conn = get_db_connection()
        conn.execute(
            "UPDATE applications SET status = 'Draft', next_action = 'Application cancelled by citizen prior to submission.' WHERE id = ? AND user_id = ?",
            (req.application_id, current_user["id"])
        )
        conn.commit()
        conn.close()
        return {"status": "Cancelled", "message": "Application submission cancelled by user."}

    try:
        result = await browser_agent.execute_authorized_submission(
            application_id=req.application_id,
            user_id=current_user["id"]
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=403, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission execution error: {e}")

@router.get("/my-applications")
def list_my_applications(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns all citizen applications and tracking statuses."""
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC",
        (current_user["id"],)
    ).fetchall()
    conn.close()

    items = []
    for r in rows:
        d = dict_from_row(r)
        if d.get("form_data_json"):
            try:
                d["form_data"] = json.loads(d["form_data_json"])
            except Exception:
                d["form_data"] = {}
        if d.get("agent_telemetry_json"):
            try:
                d["telemetry"] = json.loads(d["agent_telemetry_json"])
            except Exception:
                d["telemetry"] = []
        items.append(d)

    return {"total": len(items), "items": items}
