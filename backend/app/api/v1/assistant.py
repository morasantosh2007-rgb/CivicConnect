from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db_connection, dict_from_row
from app.core.security import get_current_user_optional
from app.services.gemini_service import ask_gemini_or_grounded_rag
from app.services.tts_service import synthesize_speech
from app.schemas.schemas import AssistantMessage

router = APIRouter(prefix="/assistant", tags=["Multilingual AI Citizen Assistant"])

@router.post("/chat")
async def citizen_assistant_chat(
    req: AssistantMessage,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Multilingual Citizen Governance AI Assistant.
    Provides plain-language answers, scheme explanations, grievance guidance,
    strictly grounded in official government records.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Retrieve official policy documents for RAG context
    conn = get_db_connection()
    # Find relevant policies by query keywords
    terms = [w for w in req.message.lower().split() if len(w) > 3]
    if terms:
        like_clauses = " OR ".join(["title LIKE ?" for _ in terms])
        params = [f"%{t}%" for t in terms]
        rows = conn.execute(f"SELECT * FROM policy_announcements WHERE {like_clauses} LIMIT 5", params).fetchall()
    else:
        rows = conn.execute("SELECT * FROM policy_announcements ORDER BY id DESC LIMIT 5").fetchall()

    context_docs = [dict_from_row(r) for r in rows]

    # If empty, fetch top schemes
    if not context_docs:
        rows = conn.execute("SELECT * FROM policy_announcements WHERE is_scheme = 1 LIMIT 5").fetchall()
        context_docs = [dict_from_row(r) for r in rows]

    conn.close()

    result = await ask_gemini_or_grounded_rag(
        prompt=req.message,
        context_documents=context_docs,
        user_language=req.language
    )

    return result

@router.post("/speak")
async def assistant_speak(text: str, language: str = "en"):
    """Generates audio for assistant response."""
    audio_url = await synthesize_speech(text, language=language)
    return {"audio_url": audio_url, "language": language}
