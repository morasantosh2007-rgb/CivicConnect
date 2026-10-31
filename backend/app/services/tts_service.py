import os
import hashlib
import asyncio
from pathlib import Path
from app.core.config import settings

TTS_DIR = settings.UPLOAD_DIR / "tts"
TTS_DIR.mkdir(parents=True, exist_ok=True)

VOICE_MAP = {
    "hi": "hi-IN-MadhurNeural",
    "te": "te-IN-MohanNeural",
    "ta": "ta-IN-ValluvarNeural",
    "kn": "kn-IN-GaganNeural",
    "en": "en-IN-NeerjaNeural"
}

async def generate_speech_edge(text: str, language: str = "en") -> str:
    import edge_tts

    voice = VOICE_MAP.get(language, "en-IN-NeerjaNeural")
    filename = f"tts_{hashlib.md5((text + voice).encode('utf-8')).hexdigest()[:16]}.mp3"
    filepath = TTS_DIR / filename

    if filepath.exists() and filepath.stat().st_size > 0:
        return f"/uploads/tts/{filename}"

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(filepath))
        return f"/uploads/tts/{filename}"
    except Exception as e:
        print(f"[EdgeTTS] Error generating speech: {e}, falling back to gTTS")
        return generate_speech_gtts(text, language)

def generate_speech_gtts(text: str, language: str = "en") -> str:
    from gtts import gTTS

    lang_code = language if language in ["hi", "ta", "te", "kn", "en"] else "en"
    # gtts might not support te or kn natively in all versions; fallback to hi or en if missing
    try:
        filename = f"tts_{hashlib.md5((text + lang_code).encode('utf-8')).hexdigest()[:16]}.mp3"
        filepath = TTS_DIR / filename
        if filepath.exists() and filepath.stat().st_size > 0:
            return f"/uploads/tts/{filename}"

        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(str(filepath))
        return f"/uploads/tts/{filename}"
    except Exception as e:
        print(f"[gTTS] Error: {e}, using en fallback")
        try:
            filename = f"tts_en_{hashlib.md5(text.encode('utf-8')).hexdigest()[:16]}.mp3"
            filepath = TTS_DIR / filename
            tts = gTTS(text=text, lang="en", slow=False)
            tts.save(str(filepath))
            return f"/uploads/tts/{filename}"
        except Exception as fallback_err:
            print(f"[TTS Fallback] Critical error: {fallback_err}")
            return ""

async def synthesize_speech(text: str, language: str = "en") -> str:
    # Try edge_tts first as it provides natural regional voices
    try:
        return await generate_speech_edge(text, language)
    except Exception:
        return generate_speech_gtts(text, language)
