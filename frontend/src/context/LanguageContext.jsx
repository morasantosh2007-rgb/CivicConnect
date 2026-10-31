import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const TRANSLATIONS = {
  en: {
    app_name: 'CivicConnect',
    slogan: 'Your Rights. Your Voice. Your Government.',
    supporting_slogan: 'Understand government. Access your benefits. Make your community better.',
    nav_home: 'Home Dashboard',
    nav_policies: 'Policies & Schemes',
    nav_services: 'Government Services',
    nav_grievances: 'Civic Grievances',
    nav_map: 'Civic Map',
    nav_verify: 'Trust & Verify',
    nav_assistant: 'AI Citizen Assistant',
    nav_applications: 'My Applications',
    nav_profile: 'My Profile',
    nav_admin: 'Officer & Admin Portal',
    nav_settings: 'Settings',
    login: 'Sign In',
    register: 'Sign Up',
    logout: 'Sign Out',
    welcome: 'Welcome to CivicConnect',
    search_placeholder: 'Search policies, schemes, or civic issues...',
    listen_audio: 'Listen to Explanation',
    check_eligibility: 'Check My Eligibility',
    submit_grievance: 'Report an Issue',
    upvote: 'Support',
    comments: 'Comments',
    status: 'Status',
    severity: 'Severity',
    department: 'Department',
    official_portal: 'Official Government Portal',
    verified: 'Officially Verified',
    high_contrast: 'High Contrast Mode',
    text_size: 'Font Size',
  },
  te: {
    app_name: 'సివిక్ కనెక్ట్ (CivicConnect)',
    slogan: 'మీ హక్కులు. మీ గొంతు. మీ ప్రభుత్వం.',
    supporting_slogan: 'ప్రభుత్వాన్ని అర్థం చేసుకోండి. మీ ప్రయోజనాలను పొందండి. సమాజాన్ని మెరుగుపరచండి.',
    nav_home: 'హోమ్ డ్యాష్‌బోర్డ్',
    nav_policies: 'పథకాలు & విధానాలు',
    nav_services: 'ప్రభుత్వ సేవలు',
    nav_grievances: 'ప్రజా సమస్యలు & ఫిర్యాదులు',
    nav_map: 'సివిక్ మ్యాప్',
    nav_verify: 'నిజనిర్ధారణ & ఆడిట్',
    nav_assistant: 'AI సిటిజన్ అసిస్టెంట్',
    nav_applications: 'నా దరఖాస్తులు',
    nav_profile: 'నా ప్రొఫైల్',
    nav_admin: 'అధికారుల పోర్టల్',
    nav_settings: 'సెట్టింగ్‌లు',
    login: 'లాగిన్',
    register: 'రిజిస్టర్',
    logout: 'లాగౌట్',
    welcome: 'సివిక్ కనెక్ట్‌కు స్వాగతం',
    search_placeholder: 'పథకాలు, విధానాలు లేదా సమస్యలను వెతకండి...',
    listen_audio: 'వివరణ వినండి',
    check_eligibility: 'నా అర్హతను పరిశీలించండి',
    submit_grievance: 'సమస్యను నివేదించండి',
    upvote: 'మద్దతు ఇవ్వండి',
    comments: 'వ్యాఖ్యలు',
    status: 'స్థితి',
    severity: 'తీవ్రత',
    department: 'శాఖ / విభాగం',
    official_portal: 'అధికారిక ప్రభుత్వ పోర్టల్',
    verified: 'ధృవీకరించబడింది',
    high_contrast: 'హై కాంట్రాస్ట్ మోడ్',
    text_size: 'అక్షరాల పరిమాణం',
  },
  hi: {
    app_name: 'सिविक कनेक्ट (CivicConnect)',
    slogan: 'आपके अधिकार। आपकी आवाज़। आपकी सरकार।',
    supporting_slogan: 'सरकार को समझें। अपने लाभ प्राप्त करें। अपने समुदाय को बेहतर बनाएं।',
    nav_home: 'होम डैशबोर्ड',
    nav_policies: 'नीतियां एवं योजनाएं',
    nav_services: 'सरकारी सेवाएं',
    nav_grievances: 'नागरिक शिकायतें',
    nav_map: 'सिविक मैप',
    nav_verify: 'सत्यता जांच (Trust & Verify)',
    nav_assistant: 'AI नागरिक सहायक',
    nav_applications: 'मेरे आवेदन',
    nav_profile: 'मेरी प्रोफ़ाइल',
    nav_admin: 'अधिकारी पोर्टल',
    nav_settings: 'सेटिंग्स',
    login: 'साइन इन',
    register: 'साइन अप',
    logout: 'साइन आउट',
    welcome: 'सिविक कनेक्ट में आपका स्वागत है',
    search_placeholder: 'योजनाएं, नीतियां या शिकायतें खोजें...',
    listen_audio: 'विवरण सुनें',
    check_eligibility: 'मेरी पात्रता जांचें',
    submit_grievance: 'समस्या की रिपोर्ट करें',
    upvote: 'समर्थन करें',
    comments: 'टिप्पणियां',
    status: 'स्थिति',
    severity: 'गंभीरता',
    department: 'विभाग',
    official_portal: 'आधिकारिक सरकारी पोर्टल',
    verified: 'सत्यापित',
    high_contrast: 'हाई कंट्रास्ट मोड',
    text_size: 'फ़ॉन्ट आकार',
  },
  ta: {
    app_name: 'சிவிக் கனெக்ட் (CivicConnect)',
    slogan: 'உங்கள் உரிமைகள். உங்கள் குரல். உங்கள் அரசு.',
    supporting_slogan: 'அரசைப் புரிந்து கொள்ளுங்கள். பலன்களைப் பெறுங்கள். உங்கள் சமூகத்தை மேம்படுத்துங்கள்.',
    nav_home: 'முகப்பு பலகை',
    nav_policies: 'திட்டங்கள் & கொள்கைகள்',
    nav_services: 'அரசு சேவைகள்',
    nav_grievances: 'மக்கள் புகார்கள்',
    nav_map: 'சிவிக் வரைபடம்',
    nav_verify: 'உண்மை சரிபார்ப்பு',
    nav_assistant: 'AI குடிமக்கள் உதவியாளர்',
    nav_applications: 'எனது விண்ணப்பங்கள்',
    nav_profile: 'எனது சுயவிவரம்',
    nav_admin: 'அதிகாரிகள் தளம்',
    nav_settings: 'அமைப்புகள்',
    login: 'உள்நுழைக',
    register: 'பதிவு செய்க',
    logout: 'வெளியேறுக',
    welcome: 'சிவிக் கனெக்டிற்கு நல்வரவு',
    search_placeholder: 'திட்டங்கள் அல்லது புகார்களைத் தேடுங்கள்...',
    listen_audio: 'விளக்கத்தைக் கேளுங்கள்',
    check_eligibility: 'எனது தகுதியைச் சரிபார்க்கவும்',
    submit_grievance: 'சிக்கலைப் புகாரளிக்கவும்',
    upvote: 'ஆதரவு',
    comments: 'கருத்துகள்',
    status: 'நிலை',
    severity: 'தீவிரம்',
    department: 'துறை',
    official_portal: 'அதிகாரப்பூர்வ அரசு தளம்',
    verified: 'சரிபார்க்கப்பட்டது',
    high_contrast: 'உயர் மாறுபட்ட முறை',
    text_size: 'எழுத்துரு அளவு',
  },
  kn: {
    app_name: 'ಸಿವಿಕ್ ಕನೆಕ್ಟ್ (CivicConnect)',
    slogan: 'ನಿಮ್ಮ ಹಕ್ಕುಗಳು. ನಿಮ್ಮ ಧ್ವನಿ. ನಿಮ್ಮ ಸರ್ಕಾರ.',
    supporting_slogan: 'ಸರ್ಕಾರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ. ಸೌಲಭ್ಯಗಳನ್ನು ಪಡೆಯಿರಿ. ಸಮುದಾಯವನ್ನು ಉತ್ತಮಗೊಳಿಸಿ.',
    nav_home: 'ಮುಖಪುಟ',
    nav_policies: 'ಯೋಜನೆಗಳು & ನೀತಿಗಳು',
    nav_services: 'ಸರ್ಕಾರಿ ಸೇವೆಗಳು',
    nav_grievances: 'ನಾಗರಿಕ ಕುಂದುಕೊರತೆಗಳು',
    nav_map: 'ಸಿವಿಕ್ ನಕ್ಷೆ',
    nav_verify: 'ಸತ್ಯಶೋಧನೆ ಮತ್ತು ಲೆಕ್ಕಪರಿಶೋಧನೆ',
    nav_assistant: 'AI ನಾಗರಿಕ ಸಹಾಯಕ',
    nav_applications: 'ನನ್ನ ಅರ್ಜಿಗಳು',
    nav_profile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    nav_admin: 'ಅಧಿಕಾರಿಗಳ ಪೋರ್ಟಲ್',
    nav_settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    login: 'ಲಾಗಿನ್',
    register: 'ನೋಂದಣಿ',
    logout: 'ಲಾಗ್‌ಔಟ್',
    welcome: 'ಸಿವಿಕ್ ಕನೆಕ್ಟ್‌ಗೆ ಸುಸ್ವಾಗತ',
    search_placeholder: 'ಯೋಜನೆಗಳು ಅಥವಾ ಸಮಸ್ಯೆಗಳನ್ನು ಹುಡುಕಿ...',
    listen_audio: 'ವಿವರಣೆ ಆಲಿಸಿ',
    check_eligibility: 'ನನ್ನ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ',
    submit_grievance: 'ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    upvote: 'ಬೆಂಬಲಿಸಿ',
    comments: 'ಕಾಮೆಂಟ್‌ಗಳು',
    status: 'ಸ್ಥಿತಿ',
    severity: 'ತೀವ್ರತೆ',
    department: 'ಇಲಾಖೆ',
    official_portal: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್',
    verified: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    high_contrast: 'ಹೈ ಕಾಂಟ್ರಾಸ್ಟ್ ಮೋಡ್',
    text_size: 'ಫಾಂಟ್ ಗಾತ್ರ',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('civicconnect_language') || 'en';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('civicconnect_high_contrast') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('civicconnect_language', language);
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [language, highContrast]);

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const next = !prev;
      localStorage.setItem('civicconnect_high_contrast', String(next));
      return next;
    });
  };

  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      highContrast,
      toggleHighContrast,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
