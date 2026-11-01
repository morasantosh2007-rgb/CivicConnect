import os
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.translation_service import translate_text

# Friendly conversational greetings & small talk patterns
GREETINGS_PATTERNS = [
    r"\b(hi|hello|hey|namaste|namaskar|vanakkam|namaskara|kalyan)\b",
    r"\b(good\s*(morning|afternoon|evening|night|day))\b",
    r"\b(how\s*are\s*you|how\s*do\s*you\s*do|what's\s*up|wassup)\b",
    r"\b(who\s*are\s*you|what\s*are\s*you|introduce\s*yourself)\b",
    r"\b(what\s*can\s*you\s*do|help\s*me|features|capabilities)\b",
    r"\b(thank\s*you|thanks|dhanyavad|shukriya|nandri|dhanyavadagalu)\b",
    r"\b(bye|goodbye|see\s*you|tata)\b"
]

def detect_conversational_intent(prompt: str) -> Optional[str]:
    p = prompt.strip().lower()
    if len(p) <= 20 and any(w in p for w in ["hi", "hello", "hey", "namaste", "vanakkam", "namaskara"]):
        return "greeting"
    if any(phrase in p for phrase in ["how are you", "how r u", "how do you do"]):
        return "how_are_you"
    if any(phrase in p for phrase in ["who are you", "what is your name", "who made you"]):
        return "identity"
    if any(phrase in p for phrase in ["what can you do", "help me", "what is this platform", "what is civicconnect"]):
        return "capabilities"
    if any(phrase in p for phrase in ["thank you", "thanks", "dhanyawad", "nandri"]):
        return "thanks"
    if any(phrase in p for phrase in ["bye", "goodbye", "see you"]):
        return "goodbye"
    return None

def get_conversational_reply(intent: str, user_language: str = "en") -> str:
    replies = {
        "greeting": {
            "en": "Namaste! Hello! I am your CivicConnect Citizen Governance Assistant. How can I help you today? You can ask me about government schemes, reporting civic issues, or verifying official news.",
            "hi": "नमस्ते! मैं आपका सिविक कनेक्ट (CivicConnect) सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे सरकारी योजनाओं, नागरिक समस्याओं की रिपोर्टिंग या समाचार सत्यापन के बारे में पूछ सकते हैं।",
            "te": "నమస్కారం! నేను మీ సివిక్ కనెక్ట్ (CivicConnect) పౌర సహాయకుడిని. ఈరోజు నేను మీకు ఎలా సహాయపడగలను? మీరు నన్ను ప్రభుత్వ పథకాలు, ప్రజా సమస్యల నివేదిక లేదా సమాచార ధృవీకరణ గురించి అడగవచ్చు.",
            "ta": "வணக்கம்! நான் உங்கள் சிவிக் கனெக்ட் (CivicConnect) குடிமக்கள் உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? அரசு திட்டங்கள், மக்கள் புகார்கள் அல்லது உண்மை சரிபார்ப்பு பற்றி என்னிடம் கேட்கலாம்.",
            "kn": "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಿವಿಕ್ ಕನೆಕ್ಟ್ (CivicConnect) ನಾಗರಿಕ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ನನ್ನನ್ನು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳ ವರದಿ ಅಥವಾ ಸುದ್ದಿ ಪರಿಶೀಲನೆ ಬಗ್ಗೆ ಕೇಳಬಹುದು."
        },
        "how_are_you": {
            "en": "I am functioning smoothly and ready to assist you! How are you doing today? Let me know if you need assistance with any welfare schemes, civic complaints, or official services.",
            "hi": "मैं बिल्कुल ठीक हूँ और आपकी सहायता के लिए तैयार हूँ! आप कैसे हैं? यदि आपको किसी सरकारी योजना, शिकायत या सेवा में मदद चाहिए, तो कृपया बताएं।",
            "te": "నేను చాలా బాగున్నాను మరియు మీకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాను! మీరు ఎలా ఉన్నారు? ప్రభుత్వ పథకాలు లేదా ప్రజా సమస్యల పరిష్కారంలో ఏదైనా సహాయం కావాలంటే నాకు తెలియజేయండి.",
            "ta": "நான் நன்றாக உள்ளேன், உங்களுக்கு உதவ தயாராக இருக்கிறேன்! நீங்கள் எப்படி இருக்கிறீர்கள்? அரசு திட்டங்கள் அல்லது புகார்கள் தொடர்பாக உங்களுக்கு ஏதேனும் உதவி தேவையா?",
            "kn": "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ ಮತ್ತು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧನಾಗಿದ್ದೇನೆ! ನೀವು ಹೇಗಿದ್ದೀರಿ? ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಅಥವಾ ದೂರುಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಸಹಾಯ ಬೇಕಿದ್ದರೆ ತಿಳಿಸಿ."
        },
        "identity": {
            "en": "I am CivicConnect AI, an intelligent digital governance assistant designed to empower citizens across India. I help you understand your legal rights, discover eligible welfare benefits, report municipal infrastructure issues, and verify factual claims.",
            "hi": "मैं सिविक कनेक्ट AI हूँ — भारत के नागरिकों को सशक्त बनाने के लिए बनाया गया डिजिटल गवर्नेंस सहायक। मैं आपको सरकारी योजनाओं, अधिकारों, नागरिक शिकायतों और सत्यता जांच में मदद करता हूँ।",
            "te": "నేను సివిక్ కనెక్ట్ AI — భారత పౌరులను శక్తివంతం చేయడానికి రూపొందించబడిన డిజిటల్ గవర్నెన్స్ అసిస్టెంట్. నేను మీకు ప్రభుత్వ పథకాలు, మీ హక్కులు, పౌర సమస్యల పరిష్కారం మరియు వార్తల నిజనిర్ధారణలో సహాయం చేస్తాను.",
            "ta": "நான் சிவிக் கனெக்ட் AI — இந்திய குடிமக்களுக்கு அதிகாரமளிக்கும் டிஜிட்டಲ್ ஆட்சி உதவியாளர். அரசு திட்டங்கள், உரிமைகள், புகார்கள் மற்றும் உண்மை சரிபார்ப்பில் உங்களுக்கு உதவுகிறேன்.",
            "kn": "ನಾನು ಸಿವಿಕ್ ಕನೆಕ್ಟ್ AI — ಭಾರತದ ನಾಗರಿಕರಿಗೆ ನೆರವಾಗಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಡಿಜಿಟಲ್ ಆಡಳಿತ ಸಹಾಯಕ. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು, ಹಕ್ಕುಗಳು, ಕುಂದುಕೊರತೆಗಳು ಮತ್ತು ಸತ್ಯಶೋಧನೆಯಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ."
        },
        "capabilities": {
            "en": "Here is what I can do for you:\n1. **Explain Government Schemes**: Ask about PM Surya Ghar, PM-Kisan, Ayushman Bharat, Scholarships, and more.\n2. **Check Scheme Eligibility**: Tell me your age, income, and profession to find matching benefits.\n3. **Report Civic Problems**: Guide you on reporting potholes, water leaks, or streetlights.\n4. **Verify News & Facts**: Cross-check viral claims against official PIB Fact Check records.\n5. **Multilingual Support**: Chat with me in English, Telugu, Hindi, Tamil, or Kannada!",
            "hi": "मैं आपके लिए निम्नलिखित कार्य कर सकता हूँ:\n1. **सरकारी योजनाएं समझाना**: पीएम सूर्य घर, पीएम-किसान, आयुष्मान भारत, छात्रवृत्ति आदि के बारे में पूछें।\n2. **पात्रता जांचना**: अपनी उम्र, आय और पेशा बताएं और उपयुक्त योजनाओं की जानकारी पाएं।\n3. **नागरिक समस्याएं दर्ज करना**: गड्ढे, पानी का रिसाव या स्ट्रीटलाइट की समस्या दर्ज करने में सहायता।\n4. **तथ्य सत्यापन**: पीआईबी फैक्ट चेक के जरिए वायरल खबरों की सत्यता जांचें।\n5. **बहुभाषी संवाद**: हिंदी, तेलुगु, तमिल, कन्नड़ या अंग्रेजी में बातचीत करें!",
            "te": "నేను మీకు ఈ క్రింది విధాలుగా సహాయం చేయగలను:\n1. **ప్రభుత్వ పథకాల వివరణ**: పీఎం సూర్య ఘర్, పీఎం-కిసాన్, ఆయుష్మాన్ భారత్, స్కాలర్‌షిప్‌ల వివరాలు తెలుసుకోండి.\n2. **అర్హత పరిశీలన**: మీ వయస్సు, ఆదాయం తెలపడం ద్వారా మీకు వర్తించే పథకాలను కనుగొనండి.\n3. **సమస్యల నివేదిక**: గుంతలు, నీటి లీకేజీలు, వీధి దీపాల సమస్యలను ఫిర్యాదు చేయడానికి మార్గదర్శకత్వం.\n4. **నిజనిర్ధారణ**: అధికారిక పీఐబీ ఆధారాలతో వైరల్ వార్తల నిజానిజాలు తెలుసుకోండి.\n5. **బహుభాషా మద్దతు**: తెలుగు, హిందీ, తమిళం, కన్నడ లేదా ఆంగ్లంలో నాతో మాట్లాడండి!",
            "ta": "நான் உங்களுக்கு செய்யக்கூடிய உதவிகள்:\n1. **அரசு திட்டங்கள் விளக்கம்**: பிஎம் சூர்ய கர், பிஎம்-கிசான், ஆயுஷ்மான் பாரத் மற்றும் கல்வி உதவித்தொகை பற்றிய தகவல்கள்.\n2. **தகுதி சரிபார்ப்பு**: உங்கள் வயது, வருமானம் கூறி தகுதியான திட்டங்களை அறியலாம்.\n3. **புகார் அளித்தல்**: சாலை பள்ளங்கள், குடிநீர் கசிவு குறித்து புகார் அளிக்க வழிகாட்டல்.\n4. **உண்மை சரிபார்ப்பு**: பிஐபி உண்மை சரிபார்ப்பு மூலம் செய்திகளை சரிபார்க்கலாம்.\n5. **பல்மொழி ஆதரவு**: தமிழ், தெலுங்கு, இந்தி, கன்னடம் அல்லது ஆங்கிலத்தில் உரையாடலாம்!",
            "kn": "ನಾನು ನಿಮಗೆ ಈ ಕೆಳಗಿನ ನೆರವು ನೀಡಬಲ್ಲೆ:\n1. **ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರಣೆ**: ಪಿಎಂ ಸೂರ್ಯ ಘರ್, ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಭಾರತ್, ವಿದ್ಯಾರ್ಥಿವೇತನಗಳ ಮಾಹಿತಿ.\n2. **ಅರ್ಹತೆ ಪರಿಶೀಲನೆ**: ವಯಸ್ಸು, ಆದಾಯ ತಿಳಿಸಿ ನಿಮಗೆ ಅನ್ವಯವಾಗುವ ಯೋಜನೆಗಳನ್ನು ತಿಳಿಯಿರಿ.\n3. **ದೂರು ದಾಖಲಿಸುವುದು**: ರಸ್ತೆ ಗುಂಡಿ, ನೀರು ಸೋರಿಕೆ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು ಮಾರ್ಗದರ್ಶನ.\n4. **ಸತ್ಯ ಪರಿಶೀಲನೆ**: ಪಿಐಬಿ ಮೂಲಕ ವೈರಲ್ ಸುದ್ದಿಗಳ ಸತ್ಯಾಸತ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.\n5. **ಬಹುಭಾಷಾ ಬೆಂಬಲ**: ಕನ್ನಡ, ತೆಲುಗು, ಹಿಂದಿ, ತಮಿಳು ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸಂವಹನ ನಡೆಸಿ!"
        },
        "thanks": {
            "en": "You're very welcome! It is my pleasure to assist you. Let me know if you need anything else.",
            "hi": "आपका बहुत-बहुत स्वागत है! आपकी सहायता करना मेरा कर्तव्य है। यदि आपको और कुछ चाहिए तो अवश्य बताएं।",
            "te": "మీకు స్వాగతం! మీకు సహాయం చేయడం నాకు సంతోషం. ఇంకేమైనా వివరాలు కావాలంటే అడగండి.",
            "ta": "மிக்க மகிழ்ச்சி! உங்களுக்கு உதவுவது எனது கடமை. வேறு ஏதேனும் தகவல் தேவைப்பட்டால் கேளுங்கள்.",
            "kn": "ನಿಮಗೆ ಸುಸ್ವಾಗತ! ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನನಗೆ ಸಂತೋಷವಾಗಿದೆ. ಬೇರೇನಾದರೂ ಮಾಹಿತಿ ಬೇಕಿದ್ದಲ್ಲಿ ತಿಳಿಸಿ."
        },
        "goodbye": {
            "en": "Goodbye! Have a wonderful day. Remember, CivicConnect is always here to help you access your rights and government services.",
            "hi": "अलविदा! आपका दिन शुभ हो। याद रखें, सिविक कनेक्ट आपके अधिकारों और सरकारी सेवाओं के लिए हमेशा उपलब्ध है।",
            "te": "సెలవు! మీ రోజు శుభప్రదం కావాలి. మీ హక్కులు మరియు ప్రభుత్వ సేవల కోసం సివిక్ కనెక్ట్ ఎల్లప్పుడూ మీకు తోడుగా ఉంటుంది.",
            "ta": "வணக்கம்! நல்ல நாளாக அமையட்டும். உங்கள் உரிமைகள் மற்றும் அரசு சேவைகளுக்காக சிவிக் கனெக்ட் எப்போதும் உடன் இருக்கும்.",
            "kn": "ಶುಭ ದಿನ! ನಿಮ್ಮ ಹಕ್ಕುಗಳು ಮತ್ತು ಸರ್ಕಾರಿ ಸೇವೆಗಳಿಗಾಗಿ ಸಿವಿಕ್ ಕನೆಕ್ಟ್ ಸದಾ ನಿಮ್ಮ ಜೊತೆಗಿರುತ್ತದೆ."
        }
    }

    intent_dict = replies.get(intent, replies["greeting"])
    return intent_dict.get(user_language, intent_dict.get("en", "Namaste! How can I assist you today?"))

async def ask_gemini_or_grounded_rag(
    prompt: str,
    context_documents: List[Dict[str, Any]],
    user_language: str = "en"
) -> Dict[str, Any]:
    """
    Conversational & Grounded AI Citizen Assistant.
    - Handles greetings and casual conversation smoothly and naturally in the user's language.
    - For policy/rights queries, uses Google Gemini if API key is provided,
      or grounded local intelligence over real official gazettes and documents.
    """
    clean_p = prompt.strip()

    # 1. Fast conversational intent handling for common greetings and general questions
    detected_intent = detect_conversational_intent(clean_p)
    if detected_intent:
        return {
            "answer": get_conversational_reply(detected_intent, user_language),
            "citations": [],
            "provider": "CivicConnect Conversational Engine",
            "grounded": True
        }

    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    # Compile context documents with clear source attribution
    context_str = "\n\n".join([
        f"[Source {i+1}]: {doc.get('title', 'Official Policy')}\n"
        f"Authority: {doc.get('issuing_authority', 'Government of India')}\n"
        f"Official URL: {doc.get('source_url', 'https://india.gov.in')}\n"
        f"Content: {doc.get('original_text', '')[:1200]}"
        for i, doc in enumerate(context_documents[:5])
    ])

    citations = [
        {
            "title": doc.get("title", "Official Government Source"),
            "url": doc.get("source_url") or doc.get("official_portal_url", "https://india.gov.in"),
            "department": doc.get("department", "Government of India"),
            "excerpt": (doc.get("original_text") or doc.get("summary_en", ""))[:200]
        }
        for doc in context_documents[:5]
    ]

    # 2. If Gemini API Key is configured, use Gemini 2.5 Flash with rich conversational instructions
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            system_instruction = (
                "You are CivicConnect, an official multilingual citizen governance assistant for India. "
                "Be polite, warm, conversational, and helpful. "
                "If the user asks conversational, general, or everyday questions (unrelated to policies), "
                "reply warmly, intelligently, and naturally in their chosen language. "
                "When the user asks about government schemes, legal rights, municipal grievances, or factual verification, "
                "base all factual policy claims strictly on official government information, avoid fabricating legal entitlements, "
                "and cite official portals where applicable."
            )
            full_prompt = (
                f"{system_instruction}\n\n"
                f"OFFICIAL CONTEXT (if relevant to the query):\n{context_str}\n\n"
                f"USER MESSAGE:\n{prompt}\n\n"
                f"IMPORTANT: Respond naturally and conversationally in the user's requested language ({user_language})."
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=full_prompt
            )
            answer_text = response.text if response and response.text else "Information retrieved from official government records."
            return {
                "answer": answer_text,
                "citations": citations if context_documents else [],
                "provider": "google-gemini-2.5-flash",
                "grounded": True
            }
        except Exception as e:
            print(f"[Gemini API Notice] {e}, falling back to conversational RAG engine")

    # 3. Conversational Local Fallback (When API key is pending)
    # Check if this is a general question or policy question
    policy_keywords = [
        "scheme", "policy", "subsidy", "yojana", "pension", "scholarship", "loan", "farmer",
        "kisan", "solar", "hospital", "ayushman", "pothole", "water", "leak", "grievance",
        "complaint", "verify", "fake", "fact", "aadhaar", "digilocker", "portal", "eligib"
    ]
    is_policy_query = any(k in clean_p.lower() for k in policy_keywords)

    if not is_policy_query or not context_documents:
        # User asked a general question unrelated to policies (e.g. "what is today's weather", "tell me something interesting", "what is digital governance?")
        conversational_answer = (
            f"Hello! I am your CivicConnect assistant. You asked: \"{clean_p}\".\n\n"
            "While my primary expertise is helping you with Indian government welfare schemes, civic complaints, and official fact-checking, "
            "I'm here to assist you with anything you need! "
            "Feel free to ask me how to apply for schemes like PM Surya Ghar, report civic issues in your neighborhood, or verify news."
        )
        if user_language != "en":
            conversational_answer = translate_text(conversational_answer, target_lang=user_language)

        return {
            "answer": conversational_answer,
            "citations": [],
            "provider": "CivicConnect Conversational Assistant",
            "grounded": True
        }

    # If it is a policy query and we have matching documents:
    top_doc = context_documents[0]
    title = top_doc.get("title", "Official Policy")
    dept = top_doc.get("department", "Government Department")
    benefits = top_doc.get("benefits_description") or top_doc.get("summary_en", "")
    portal = top_doc.get("official_portal_url") or top_doc.get("source_url", "")

    synthesized_answer = (
        f"Here is the official information regarding **{title}** from the {dept}:\n\n"
        f"**Overview & Benefits:** {benefits}\n\n"
        f"**Official Portal:** {portal}\n\n"
        f"You can check your detailed eligibility on our Policies & Schemes page or file a service request through the portal."
    )

    if user_language != "en":
        synthesized_answer = translate_text(synthesized_answer, target_lang=user_language)

    return {
        "answer": synthesized_answer,
        "citations": citations,
        "provider": "CivicConnect Policy Intelligence",
        "grounded": True
    }
