from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.security import get_current_user
from app.services.digilocker_service import digilocker_adapter

router = APIRouter(prefix="/digilocker", tags=["DigiLocker Integration"])

@router.get("/status")
def get_digilocker_status():
    """Returns honest DigiLocker Partner API configuration status."""
    return digilocker_adapter.get_status()

@router.get("/authorize-url")
def get_authorize_url(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Generates official DigiLocker OAuth2 redirect authorization URL."""
    return digilocker_adapter.generate_authorization_url(user_id=current_user["id"])

@router.post("/callback")
async def process_callback(
    code: str = Query(...),
    state: str = Query(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Processes DigiLocker authorization code exchange."""
    try:
        return await digilocker_adapter.exchange_token_and_sync_documents(
            code=code, user_id=current_user["id"]
        )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DigiLocker sync error: {e}")

@router.post("/disconnect")
def disconnect(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Revokes DigiLocker consent and deletes synced records."""
    return digilocker_adapter.disconnect_digilocker(user_id=current_user["id"])
