"""
Multilingual Translations for Supported Government Services & Autonomous Bureaucracy Agent.
Covers Hindi, Tamil, Kannada, Telugu, and English.
"""

from typing import Dict, Any, List

SERVICES_LOCALIZATION: Dict[str, Dict[str, Any]] = {
    "pm-surya-ghar": {
        "service_name": {
            "en": "PM Surya Ghar Rooftop Solar Application",
            "hi": "पीएम सूर्य घर रूफटॉप सोलर आवेदन",
            "ta": "பிஎம் சூர்ய கர் மேற்கூரை சோலார் விண்ணப்பம்",
            "kn": "ಪಿಎಂ ಸೂರ್ಯ ಘರ್ ಛಾವಣಿ ಸೌರಶಕ್ತಿ ಅರ್ಜಿ",
            "te": "పీఎం సూర్య ఘర్ రూఫ్‌టాప్ సోలార్ దరఖాస్తు"
        },
        "portal_name": {
            "en": "National Portal for Rooftop Solar",
            "hi": "रूफटॉप सोलर हेतु राष्ट्रीय पोर्टल",
            "ta": "மேற்கூரை சோலார் தேசிய தளம்",
            "kn": "ಛಾವಣಿ ಸೌರಶಕ್ತಿ ರಾಷ್ಟ್ರೀಯ ಪೋರ್ಟಲ್",
            "te": "రూఫ్‌టాప్ సోలార్ జాతీయ పోర్టల్"
        },
        "description": {
            "en": "Apply for up to ₹78,000 direct central subsidy for residential rooftop solar installation.",
            "hi": "आवासीय छत पर सौर ऊर्जा पैनल लगाने के लिए ₹78,000 तक की केंद्रीय सब्सिडी हेतु आवेदन करें।",
            "ta": "வீட்டு மேற்கூரை சோலார் அமைப்புகளுக்கு ₹78,000 வரை மத்திய அரசு மானியம் பெற விண்ணப்பிக்கவும்.",
            "kn": "ಮನೆ ಛಾವಣಿ ಸೌರ ಫಲಕ ಅಳವಡಿಕೆಗೆ ₹78,000 ವರೆಗೆ ನೇರ ಕೇಂದ್ರ ಸಬ್ಸಿಡಿ ಪಡೆಯಲು ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            "te": "నివాస పైకప్పుపై సోలార్ ప్యానెల్స్ ఏర్పాటు కోసం రూ. 78,000 వరకు కేంద్ర రాయితీ కొరకు దరఖాస్తు చేసుకోండి."
        },
        "mandatory_documents": {
            "en": ["Recent Electricity Bill", "Aadhaar Card", "Bank Account Details", "Rooftop Photo"],
            "hi": ["नवीनतम बिजली बिल", "आधार कार्ड", "बैंक खाता विवरण", "छत का फोटो"],
            "ta": ["சமீபத்திய மின் கட்டண ரசீது", "ஆதார் அட்டை", "வங்கி கணக்கு விவரங்கள்", "மேற்கூரை புகைப்படம்"],
            "kn": ["ಇತ್ತೀಚಿನ ವಿದ್ಯುತ್ ಬಿಲ್", "ಆಧಾರ್ ಕಾರ್ಡ್", "ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ", "ಛಾವಣಿಯ ಫೋಟೋ"],
            "te": ["ఇటీవలి విద్యుత్ బిల్లు", "ఆధార్ కార్డు", "బ్యాంక్ ఖాతా వివరాలు", "పైకప్పు ఫోటో"]
        }
    },
    "national-scholarship": {
        "service_name": {
            "en": "National Scholarship Portal (NSP) Application",
            "hi": "राष्ट्रीय छात्रवृत्ति पोर्टल (एनएसपी) आवेदन",
            "ta": "தேசிய கல்வி உதவித்தொகை தளம் (NSP) விண்ணப்பம்",
            "kn": "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (NSP) ಅರ್ಜಿ",
            "te": "జాతీయ స్కాలర్‌షిప్ పోర్టల్ (NSP) దరఖాస్తు"
        },
        "portal_name": {
            "en": "National Scholarship Portal",
            "hi": "राष्ट्रीय छात्रवृत्ति पोर्टल",
            "ta": "தேசிய கல்வி உதவித்தொகை தளம்",
            "kn": "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್",
            "te": "జాతీయ స్కాలర్‌షిప్ పోర్టల్"
        },
        "description": {
            "en": "Pre-matric and Post-matric scholarship schemes for SC/ST/OBC and Minority students.",
            "hi": "एससी/एसटी/ओबीसी और अल्पसंख्यक छात्रों के लिए प्री-मैट्रिक और पोस्ट-मैट्रिक छात्रवृत्ति योजनाएं।",
            "ta": "எஸ்சி/எஸ்டி/ஓபிசி மற்றும் சிறுபான்மையின மாணவர்களுக்கான மெட்ரிக் முந்தைய மற்றும் பிந்தைய உதவித்தொகை.",
            "kn": "ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ/ಒಬಿಸಿ ಮತ್ತು ಅಲ್ಪಸಂಖ್ಯಾತ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮೆಟ್ರಿಕ್ ಪೂರ್ವ ಮತ್ತು ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ.",
            "te": "ఎస్సీ/ఎస్టీ/బీసీ మరియు మైనారిటీ విద్యార్థులకు ప్రీ-మెట్రిక్ మరియు పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్ పథకాలు."
        },
        "mandatory_documents": {
            "en": ["Caste Certificate", "Income Certificate", "Previous Year Marksheet", "College Fee Receipt"],
            "hi": ["जाति प्रमाण पत्र", "आय प्रमाण पत्र", "पिछले वर्ष की अंकतालिका", "कॉलेज शुल्क रसीद"],
            "ta": ["ஜாதி சான்றிதழ்", "வருமான சான்றிதழ்", "முந்தைய ஆண்டு மதிப்பெண் பட்டியல்", "கல்லூரி கட்டண ரசீது"],
            "kn": ["ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ", "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ", "ಹಿಂದಿನ ವರ್ಷದ ಅಂಕಪಟ್ಟಿ", "ಕಾಲೇಜು ಶುಲ್ಕ ರಶೀದಿ"],
            "te": ["కుల ధృవీకరణ పత్రం", "ఆదాయ ధృవీకరణ పత్రం", "మునుపటి సంవత్సరం మార్కుల జాబితా", "కాలేజీ ఫీజు రసీదు"]
        }
    },
    "digilocker-certificate": {
        "service_name": {
            "en": "Official Caste & Domicile Certificate Pull",
            "hi": "आधिकारिक जाति एवं निवास प्रमाण पत्र प्राप्ति",
            "ta": "அதிகாரப்பூர்வ ஜாதி மற்றும் இருப்பிடச் சான்றிதழ் பெறுதல்",
            "kn": "ಅಧಿಕೃತ ಜಾತಿ ಮತ್ತು ವಾಸಸ್ಥಳ ಪ್ರಮಾಣಪತ್ರ ಪಡೆಯುವಿಕೆ",
            "te": "అధికారిక కుల మరియు నివాస ధృవీకరణ పత్రాల స్వీకరణ"
        },
        "portal_name": {
            "en": "State Citizen e-District Portal",
            "hi": "राज्य नागरिक ई-डिस्ट्रिक्ट पोर्टल",
            "ta": "மாநில குடிமக்கள் இ-டிஸ்ட்ரிக்ட் தளம்",
            "kn": "ರಾಜ್ಯ ನಾಗರಿಕ ಇ-ಡಿಸ್ಟ್ರಿಕ್ಟ್ ಪೋರ್ಟಲ್",
            "te": "రాష్ట్ర పౌర ఈ-డిస్ట్రిక్ట్ పోర్టల్"
        },
        "description": {
            "en": "Request or verify official domicile, caste, and income certificates directly from state issuers.",
            "hi": "राज्य जारीकर्ताओं से सीधे आधिकारिक निवास, जाति और आय प्रमाण पत्र प्राप्त या सत्यापित करें।",
            "ta": "மாநில அரசு வழங்கும் அதிகாரப்பூர்வ இருப்பிடம், ஜாதி மற்றும் வருமானச் சான்றிதழ்களைப் பெறலாம்.",
            "kn": "ರಾಜ್ಯ ಸರ್ಕಾರದಿಂದ ನೇರವಾಗಿ ಅಧಿಕೃತ ವಾಸಸ್ಥಳ, ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಪಡೆಯಿರಿ.",
            "te": "రాష్ట్ర ప్రభుత్వ అధికారుల నుండి నేరుగా అధికారిక నివాస, కుల మరియు ఆదాయ ధృవీకరణ పత్రాలను పొందండి."
        },
        "mandatory_documents": {
            "en": ["Aadhaar Number", "Ration Card / Voter ID", "Current Address Proof"],
            "hi": ["आधार संख्या", "राशन कार्ड / मतदाता पहचान पत्र", "वर्तमान पते का प्रमाण"],
            "ta": ["ஆதார் எண்", "ரேஷன் அட்டை / வாக்காளர் அடையாள அட்டை", "முகவரிச் சான்று"],
            "kn": ["ಆಧಾರ್ ಸಂಖ್ಯೆ", "ರೇಷನ್ ಕಾರ್ಡ್ / ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ", "ಪ್ರಸ್ತುತ ವಿಳಾಸ ಪುರಾವೆ"],
            "te": ["ఆధార్ సంఖ్య", "రేషన్ కార్డు / ఓటరు గుర్తింపు కార్డు", "ప్రస్తుత చిరునామా రుజువు"]
        }
    },
    "pm-kisan-ekyc": {
        "service_name": {
            "en": "PM-Kisan Farmer e-KYC Verification",
            "hi": "पीएम-किसान कृषक ई-केवाईसी सत्यापन",
            "ta": "பிஎம்-கிசான் விவசாயி இ-கேஒய்சி சரிபார்ப்பு",
            "kn": "ಪಿಎಂ-ಕಿಸಾನ್ ರೈತರ ಇ-ಕೆವೈಸಿ ಪರಿಶೀಲನೆ",
            "te": "పీఎం-కిసాన్ రైతు ఈ-కేవైసీ ధృవీకరణ"
        },
        "portal_name": {
            "en": "PM Kisan Samman Nidhi Portal",
            "hi": "पीएम किसान सम्मान निधि पोर्टल",
            "ta": "பிஎம் கிசான் சம்மான் நிதி தளம்",
            "kn": "ಪಿಎಂ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ ಪೋರ್ಟಲ್",
            "te": "పీఎం కిసాన్ సమ్మాన్ నిధి పోర్టల్"
        },
        "description": {
            "en": "Complete mandatory bi-annual Aadhaar OTP eKYC for continuous PM-Kisan DBT disbursements.",
            "hi": "निरंतर पीएम-किसान डीबीटी भुगतान हेतु अनिवार्य आधार ओटीपी ई-केवाईसी पूर्ण करें।",
            "ta": "பிஎம்-கிசான் நிதி உதவி தொடர்ந்து கிடைக்க கட்டாய ஆதார் ஓடிபி இ-கேஒய்சி முடிக்கவும்.",
            "kn": "ಪಿಎಂ-ಕಿಸಾನ್ ಹಣ ನಿರಂತರವಾಗಿ ಜಮೆಯಾಗಲು ಕಡ್ಡಾಯ ಆಧಾರ್ ಒಟಿಪಿ ಇ-ಕೆವೈಸಿ ಪೂರ್ಣಗೊಳಿಸಿ.",
            "te": "పీఎం-కిసాన్ పథకం నగదు నిరంతరాయంగా అందడానికి తప్పనిసరి ఆధార్ ఓటీపీ ఈ-కేవైసీ పూర్తి చేయండి."
        },
        "mandatory_documents": {
            "en": ["Aadhaar Number linked to Mobile", "Land Record ID"],
            "hi": ["मोबाइल से लिंक आधार संख्या", "भूमि अभिलेख पहचान (ಖಾಸರಾ/ಖತೌನಿ)"],
            "ta": ["மொபைலுடன் இணைக்கப்பட்ட ஆதார் எண்", "நில ஆவண எண் (பட்டா/சிட்டா)"],
            "kn": ["ಮೊಬೈಲ್‌ಗೆ ಲಿಂಕ್ ಆದ ಆಧಾರ್ ಸಂಖ್ಯೆ", "ಭೂ ದಾಖಲೆ ಐಡಿ (ಪಹಣಿ/RTC)"],
            "te": ["మొబైల్‌తో లింక్ అయిన ఆధార్ సంఖ్య", "భూమి రికార్డు ఐడీ (పట్టాదారు పాస్‌బుక్)"]
        }
    }
}

def get_localized_service(service: Dict[str, Any], language: str) -> Dict[str, Any]:
    """Returns localized service object for the specified language."""
    lang = language if language in ["hi", "ta", "kn", "te", "en"] else "en"
    sid = service.get("id")
    loc = SERVICES_LOCALIZATION.get(sid)
    if not loc:
        return service
    
    return {
        **service,
        "service_name": loc["service_name"].get(lang, loc["service_name"]["en"]),
        "portal_name": loc["portal_name"].get(lang, loc["portal_name"]["en"]),
        "description": loc["description"].get(lang, loc["description"]["en"]),
        "mandatory_documents": loc["mandatory_documents"].get(lang, loc["mandatory_documents"]["en"])
    }
