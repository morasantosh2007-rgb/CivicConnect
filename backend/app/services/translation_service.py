from functools import lru_cache
from typing import Dict
from deep_translator import GoogleTranslator

# Language mapping
LANG_MAP = {
    "en": "en",
    "te": "te",
    "hi": "hi",
    "ta": "ta",
    "kn": "kn"
}

@lru_cache(maxsize=1024)
def translate_text(text: str, target_lang: str = "en", source_lang: str = "auto") -> str:
    if not text or not text.strip():
        return text
    target = LANG_MAP.get(target_lang, "en")
    if target == "en" and source_lang == "en":
        return text
    
    try:
        # Keep length within reasonable single-request chunk
        if len(text) > 4500:
            chunks = [text[i:i+4000] for i in range(0, len(text), 4000)]
            translated_chunks = []
            for chunk in chunks:
                tr = GoogleTranslator(source=source_lang, target=target).translate(chunk)
                translated_chunks.append(tr)
            return " ".join(translated_chunks)
        
        translator = GoogleTranslator(source=source_lang, target=target)
        result = translator.translate(text)
        return result or text
    except Exception as e:
        print(f"[Translation] Error translating to {target_lang}: {e}")
        return text

def translate_dict(data: Dict[str, str], target_lang: str) -> Dict[str, str]:
    if target_lang == "en":
        return data
    translated = {}
    for k, v in data.items():
        if isinstance(v, str):
            translated[k] = translate_text(v, target_lang)
        else:
            translated[k] = v
    return translated
