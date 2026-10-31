import os
from pathlib import Path
import speech_recognition as sr
from app.core.config import settings

RECOG_LANG_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "kn": "kn-IN"
}

def transcribe_audio_file(audio_path: Path, language: str = "en") -> str:
    recognizer = sr.Recognizer()
    recog_lang = RECOG_LANG_MAP.get(language, "en-IN")

    # If file is not standard wav, attempt converting via pydub or reading
    wav_path = audio_path
    temp_wav = None

    if audio_path.suffix.lower() not in [".wav"]:
        try:
            from pydub import AudioSegment
            sound = AudioSegment.from_file(str(audio_path))
            temp_wav = audio_path.with_suffix(".temp.wav")
            sound.export(str(temp_wav), format="wav")
            wav_path = temp_wav
        except Exception as conv_err:
            print(f"[STT] Audio conversion notice: {conv_err}")

    try:
        with sr.AudioFile(str(wav_path)) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language=recog_lang)
            return text
    except sr.UnknownValueError:
        return "Audio was recorded, but speech could not be recognized clearly. Please review or type description."
    except sr.RequestError as e:
        return f"Speech recognition service temporarily unavailable: {e}"
    except Exception as e:
        print(f"[STT] Error during transcription: {e}")
        return "Audio recorded successfully. Manual review/transcription requested."
    finally:
        if temp_wav and temp_wav.exists():
            try:
                temp_wav.unlink()
            except Exception:
                pass
