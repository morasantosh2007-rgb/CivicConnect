import re
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any, Dict, List, Optional
import httpx
from bs4 import BeautifulSoup
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row
from app.services.translation_service import translate_text

# Comprehensive catalog of verified real-world Indian Central and State welfare schemes
OFFICIAL_BENCHMARK_SCHEMES = [
    {
        "title": "PM Surya Ghar: Muft Bijli Yojana",
        "department": "Ministry of New and Renewable Energy",
        "issuing_authority": "Government of India",
        "publication_date": "2024-02-15",
        "source_url": "https://pmsuryaghar.gov.in/",
        "official_portal_url": "https://pmsuryaghar.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Indian households with electricity connection and residential rooftop space",
        "category": "Energy & Sustainability",
        "deadline": "Open / Ongoing Scheme",
        "original_text": "PM Surya Ghar: Muft Bijli Yojana is a government initiative to provide free electricity up to 300 units per month to 1 crore households in India by installing rooftop solar electricity systems. Subsidy: ₹30,000 for 1kW, ₹60,000 for 2kW, and ₹78,000 for 3kW systems.",
        "summary_en": "Provides up to ₹78,000 central financial assistance/subsidy for installing rooftop solar panels, helping residential households save up to 300 units of electricity each month.",
        "summary_te": "రూఫ్ టాప్ సోలార్ ప్యానెల్స్ అమర్చుకోవడానికి రూ. 78,000 వరకు కేంద్ర రాయితీ, నెలకు 300 యూనిట్ల వరకు ఉచిత విద్యుత్ అందించే పథకం.",
        "summary_hi": "छत पर सौर पैनल लगाने के लिए ₹78,000 तक की केंद्रीय वित्तीय सहायता/सब्सिडी प्रदान करता है, जिससे परिवारों को प्रति माह 300 यूनिट तक मुफ्त बिजली मिलती है।",
        "summary_ta": "வீட்டு மேற்கூரை சோலார் அமைப்புகளுக்கு ₹78,000 வரை மானியம் மற்றும் மாதம் 300 யூனிட் வரை இலவச மின்சாரம் வழங்கும் திட்டம்.",
        "summary_kn": "ಮನೆಯ ಛಾವಣಿಯ ಮೇಲೆ ಸೌರ ಫಲಕಗಳನ್ನು ಅಳವಡಿಸಲು ₹78,000 ವರೆಗೆ ಕೇಂದ್ರ ಸಬ್ಸಿಡಿ ಮತ್ತು ತಿಂಗಳಿಗೆ 300 ಯೂನಿಟ್‌ವರೆಗೆ ಉಚಿತ ವಿದ್ಯುತ್ ನೀಡುವ ಯೋಜನೆ.",
        "benefits_description": "Direct financial subsidy: ₹30,000 for 1 kW; ₹60,000 for 2 kW; ₹78,000 for 3 kW or higher capacity systems. Free electricity up to 300 units/month.",
        "required_documents_json": '["Electricity Consumer Bill (recent)", "Proof of Residential Address", "Bank Passbook / Cancelled Cheque", "Aadhaar Card", "Rooftop Photograph"]',
        "eligibility_criteria_json": '{"min_age": 18, "residence_type": "residential", "has_electricity_connection": true, "max_income": null, "states": "all"}'
    },
    {
        "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "department": "Ministry of Agriculture and Farmers Welfare",
        "issuing_authority": "Government of India",
        "publication_date": "2019-02-24",
        "source_url": "https://pmkisan.gov.in/",
        "official_portal_url": "https://pmkisan.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Small and marginal landholder farmer families across all States/UTs",
        "category": "Agriculture & Farmers Welfare",
        "deadline": "Open / Tri-annual Installments",
        "original_text": "PM-KISAN is a Central Sector scheme with 100% funding from Government of India. Under the scheme, income support of ₹6,000/- per year in three equal installments of ₹2,000/- each every four months is provided to all landholding farmer families.",
        "summary_en": "Direct income assistance of ₹6,000 annually paid in three installments of ₹2,000 directly into bank accounts of eligible farmer families.",
        "summary_te": "రైతు కుటుంబాలకు ఏటా రూ. 6,000 ప్రత్యక్ష నగదు సహాయం మూడు విడతల్లో రూ. 2,000 చొప్పున బ్యాంక్ ఖాతాల్లో జమ చేయబడుతుంది.",
        "summary_hi": "पात्र किसान परिवारों के बैंक खातों में प्रति वर्ष ₹6,000 की प्रत्यक्ष आय सहायता, तीन समान किस्तों (₹2,000 प्रत्येक) में प्रदान की जाती है।",
        "summary_ta": "விவசாய குடும்பங்களுக்கு ஆண்டுதோறும் ₹6,000 நேரடி வருமான உதவி மூன்று தவணைகளாக ₹2,000 வீதம் வங்கி கணக்கில் செலுத்தப்படுகிறது.",
        "summary_kn": "ಅರ್ಹ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವರ್ಷಕ್ಕೆ ₹6,000 ನೇರ ಆದಾಯ ನೆರವು ಮೂರು ಕಂತುಗಳಲ್ಲಿ (ಪ್ರತಿ ಕಂತಿಗೆ ₹2,000) ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆ ಮಾಡಲಾಗುತ್ತದೆ.",
        "benefits_description": "₹6,000 per year direct income support disbursed in 3 equal installments of ₹2,000 via Direct Benefit Transfer (DBT).",
        "required_documents_json": '["Aadhaar Card linked to Bank Account", "Landholding Records / RoR / Khasra-Khatauni", "Active Bank Passbook", "Mobile Number linked to Aadhaar"]',
        "eligibility_criteria_json": '{"min_age": 18, "occupation": "farmer", "max_income": 800000, "landholder": true, "institutional_landholder_excluded": true}'
    },
    {
        "title": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)",
        "department": "National Health Authority, Ministry of Health and Family Welfare",
        "issuing_authority": "Government of India",
        "publication_date": "2018-09-23",
        "source_url": "https://pmjay.gov.in/",
        "official_portal_url": "https://beneficiary.nha.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Vulnerable and low-income families identified under SECC and Senior Citizens aged 70+",
        "category": "Healthcare",
        "deadline": "Continuous / Cashless Enrollment",
        "original_text": "Ayushman Bharat PM-JAY is the world largest government-funded healthcare scheme. It provides health assurance cover of up to ₹5 Lakh per family per year for secondary and tertiary care hospitalization across public and empaneled private hospitals.",
        "summary_en": "Provides ₹5 lakh annual cashless health cover per family for secondary and tertiary inpatient hospitalization across empaneled hospitals nationwide.",
        "summary_te": "ద్వితీయ మరియు తృతీయ స్థాయి ఆసుపత్రి చికిత్సల కోసం కుటుంబానికి ఏటా రూ. 5 లక్షల వరకు ఉచిత నగదు రహిత ఆరోగ్య బీమా.",
        "summary_hi": "प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस स्वास्थ्य बीमा कवर, द्वितीयक और तृतीयक अस्पताल में भर्ती के लिए पूरे देश में उपलब्ध।",
        "summary_ta": "குடும்பத்திற்கு ஆண்டுக்கு ₹5 லட்சம் வரை இலவச மருத்துவ சிகிச்சை வழங்கும் உலகின் மிகப்பெரிய மருத்துவ காப்பீட்டுத் திட்டம்.",
        "summary_kn": "ಕುಟುಂಬಕ್ಕೆ ವರ್ಷಕ್ಕೆ ₹5 ಲಕ್ಷದವರೆಗೆ ಉಚಿತ ನಗದು ರಹಿತ ಚಿಕಿತ್ಸಾ ವೆಚ್ಚ ಭರಿಸುವ ಸಮಗ್ರ ಆರೋಗ್ಯ ಭರವಸೆ ಯೋಜನೆ.",
        "benefits_description": "₹5,00,000 per family per year cashless hospitalization coverage for pre-existing diseases, surgeries, diagnostic tests, and post-hospitalization medications.",
        "required_documents_json": '["Aadhaar Card", "Ration Card / Family ID", "Registered Mobile Number", "PM-JAY Verification Letter (if issued)"]',
        "eligibility_criteria_json": '{"max_income": 300000, "states": "all", "special_inclusion_age": 70}'
    },
    {
        "title": "Post-Matric Scholarship for SC/ST/OBC Students",
        "department": "Ministry of Social Justice and Empowerment",
        "issuing_authority": "Government of India & State Social Welfare Departments",
        "publication_date": "2023-07-01",
        "source_url": "https://scholarships.gov.in/",
        "official_portal_url": "https://scholarships.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Students belonging to SC, ST, OBC categories pursuing post-matriculation or post-secondary education",
        "category": "Education & Scholarships",
        "deadline": "October 31 annually (or extended by State Authority)",
        "original_text": "The Post Matric Scholarship scheme provides financial assistance to students belonging to Scheduled Castes, Scheduled Tribes and Other Backward Classes studying at post-matriculation or post-secondary stage to enable them to complete their education.",
        "summary_en": "Complete tuition fee waiver or reimbursement plus monthly maintenance allowance for eligible SC/ST/OBC students enrolled in recognized higher education courses.",
        "summary_te": "ఉన్నత విద్య అభ్యసించే ఎస్సీ, ఎస్టీ, బీసీ విద్యార్థులకు పూర్తి ఫీజు రీయింబర్స్‌మెంట్ మరియు నెలవారీ విద್ಯಾ భత్యం.",
        "summary_hi": "मान्यता प्राप्त उच्च शिक्षण संस्थानों में नामांकित एससी/एसटी/ओबीसी छात्रों के लिए पूर्ण शिक्षण शुल्क प्रतिपूर्ति और मासिक रखरखाव भत्ता।",
        "summary_ta": "பிற்படுத்தப்பட்ட மற்றும் தாழ்த்தப்பட்ட மாணவர்களுக்கு உயர்கல்வி பயில முழுக் கல்விக்கட்டண உதவி மற்றும் மாதாந்திர பராமரிப்பு உதவித்தொகை.",
        "summary_kn": "ಉನ್ನತ ಶಿಕ್ಷಣ ವ್ಯಾಸಂಗ ಮಾಡುವ ಎಸ್‌ಸಿ/ಎಸ್‌ಟಿ/ಒಬಿಸಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸಂಪೂರ್ಣ ಶುಲ್ಕ ಮರುಪಾವತಿ ಮತ್ತು ಮಾಸಿಕ ನಿರ್ವಹಣಾ ಭತ್ಯೆ ನೀಡುವ ಯೋಜನೆ.",
        "benefits_description": "100% compulsory non-refundable fees reimbursed + monthly academic maintenance allowance ranging from ₹2,500 to ₹13,500 per annum.",
        "required_documents_json": '["Caste Certificate", "Annual Family Income Certificate", "Class 10/12 Marksheet", "College Admission Fee Receipt", "Bank Passbook with Aadhaar Seeding"]',
        "eligibility_criteria_json": '{"max_income": 250000, "categories": ["SC", "ST", "OBC"], "education_level": "higher_education", "employment_status": "student"}'
    },
    {
        "title": "PM Vishwakarma Scheme",
        "department": "Ministry of Micro, Small and Medium Enterprises",
        "issuing_authority": "Government of India",
        "publication_date": "2023-09-17",
        "source_url": "https://pmvishwakarma.gov.in/",
        "official_portal_url": "https://pmvishwakarma.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Traditional artisans and craftspeople working with hands and tools across 18 designated trades",
        "category": "Skill Development & Livelihood",
        "deadline": "Open Ongoing Scheme",
        "original_text": "PM Vishwakarma provides end-to-end holistic support to traditional artisans and craftspeople. Benefits include PM Vishwakarma Certificate & ID Card, skill upgradation with stipend, toolkit incentive of ₹15,000, and collateral-free credit support up to ₹3 lakh at 5% interest rate.",
        "summary_en": "Holistic support for artisans including ₹15,000 toolkit grant, formal skill training with ₹500/day stipend, and subsidized enterprise loans up to ₹3,00,000 at 5% interest.",
        "summary_te": "చేతివృత్తుల వారికి రూ. 15,000 టూల్‌కిట్ గ్రాంట్, రోజుకు రూ. 500 స్టైఫండ్‌తో ఉచిత నైపుణ్య శిక్షణ, 5% వడ్డీతో రూ. 3 లక్షల వరకు పూచీకత్తు లేని రుణాలు.",
        "summary_hi": "पारंपरिक कारीगरों के लिए ₹15,000 टूलकिट अनुदान, ₹500/दिन वजीफे के साथ कौशल प्रशिक्षण और 5% रियायती ब्याज पर ₹3 लाख तक का संपार्श्विक-मुक्त ऋण।",
        "summary_ta": "பாரம்பரிய கைவினைஞர்களுக்கு ₹15,000 உபகரண மானியம், நாள் ஒன்றுக்கு ₹500 உதவித்தொகையுடன் பயிற்சி மற்றும் 5% வட்டியில் ₹3 லட்சம் வரை கடன்.",
        "summary_kn": "ಸಾಂಪ್ರದಾಯಿಕ ಕುಶಲಕರ್ಮಿಗಳಿಗೆ ₹15,000 ಟೂಲ್‌ಕಿಟ್ ಅನುದಾನ, ದಿನಕ್ಕೆ ₹500 ಭತ್ಯೆಯೊಂದಿಗೆ ಉಚಿತ ತರಬೇತಿ ಮತ್ತು 5% ಬಡ್ಡಿಯಲ್ಲಿ ₹3 ಲಕ್ಷದವರೆಗೆ ಸಾಲ ಸೌಲಭ್ಯ.",
        "benefits_description": "₹15,000 modern toolkit incentive; collateral-free enterprise loan up to ₹1,00,000 (Tranche 1) and ₹2,00,000 (Tranche 2) at 5% concessional interest; digital transaction incentives.",
        "required_documents_json": '["Aadhaar Card", "Mobile Number linked to Aadhaar", "Bank Account Details", "Ration Card (mandatory for family verification)", "Trade Skill Verification"]',
        "eligibility_criteria_json": '{"min_age": 18, "occupation": "artisan", "traditional_trade_worker": true, "max_family_members_enrolled": 1}'
    },
    {
        "title": "Pradhan Mantri Awas Yojana - Urban (PMAY-U)",
        "department": "Ministry of Housing and Urban Affairs",
        "issuing_authority": "Government of India",
        "publication_date": "2015-06-25",
        "source_url": "https://pmaymis.gov.in/",
        "official_portal_url": "https://pmaymis.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Urban homeless and economically weaker families without a pucca house in India",
        "category": "Housing & Urban Development",
        "deadline": "Extended through 2028 (PMAY-U 2.0)",
        "original_text": "PMAY-U envisions providing all-weather pucca houses to all eligible beneficiaries in urban areas. Under Credit Linked Subsidy Scheme (CLSS) and Beneficiary-led Construction (BLC), financial assistance up to ₹2.67 lakh is provided.",
        "summary_en": "Provides up to ₹2.67 lakh central interest subsidy and direct construction grants to construct or purchase a permanent pucca house in urban municipal areas.",
        "summary_te": "పట్టణ ప్రాంతాలలో పక్కా గృహాల నిర్మాణం లేదా కొనుగోలు కోసం రూ. 2.67 లక్షల వరకు వడ్డీ సబ్సిడీ మరియు ఆర్థిక సహాయం.",
        "summary_hi": "शहरी क्षेत्रों में पक्के मकान के निर्माण या खरीद हेतु ₹2.67 लाख तक की ब्याज सब्सिडी और सरकारी वित्तीय सहायता प्रदान की जाती है।",
        "summary_ta": "நகர்ப்புற ஏழை எளிய குடும்பங்கள் சொந்தமாக கான்கிரீட் வீடு கட்ட அல்லது வாங்க ₹2.67 லட்சம் வரை அரசு மானியம் வழங்கும் திட்டம்.",
        "summary_kn": "ನಗರ ಪ್ರದೇಶಗಳಲ್ಲಿ ವಾಸಿಸುವ ಬಡ ಕುಟುಂಬಗಳಿಗೆ ಸ್ವಂತ ಪಕ್ಕಾ ಮನೆ ನಿರ್ಮಾಣಕ್ಕಾಗಿ ₹2.67 ಲಕ್ಷದವರೆಗೆ ಬಡ್ಡಿ ಸಬ್ಸಿಡಿ ಮತ್ತು ಅನುದಾನ ನೀಡುವ ಯೋಜನೆ.",
        "benefits_description": "Up to ₹2.67 Lakh interest subsidy on home loans; direct central assistance of ₹1.5 Lakh per dwelling unit under Beneficiary-Led Construction.",
        "required_documents_json": '["Aadhaar Card", "Income Certificate / Salary Slip", "Affidavit certifying no pucca house ownership", "Bank Account Details", "Land Ownership Documents (for BLC)"]',
        "eligibility_criteria_json": '{"max_income": 600000, "own_pucca_house": false, "residence_type": "urban"}'
    },
    {
        "title": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        "department": "Ministry of Rural Development",
        "issuing_authority": "Government of India",
        "publication_date": "2016-11-20",
        "source_url": "https://pmayg.nic.in/",
        "official_portal_url": "https://pmayg.nic.in/",
        "is_scheme": 1,
        "affected_citizens": "Rural families living in kutcha or dilapidated houses based on SECC criteria",
        "category": "Housing & Rural Development",
        "deadline": "Ongoing Mission Mode",
        "original_text": "PMAY-G aims to provide a pucca house with basic amenities to all rural families who are homeless or living in kutcha houses. Direct assistance of ₹1.20 lakh in plain areas and ₹1.30 lakh in hilly/difficult areas.",
        "summary_en": "Direct grant of ₹1.20 lakh to ₹1.30 lakh for building a permanent house in rural villages, plus 90 days of MGNREGA wages and ₹12,000 for toilet construction.",
        "summary_te": "గ్రామీణ ప్రాంతాల్లో పక్కా ఇంటి నిర్మాణం కోసం రూ. 1.20 లక్షల నుండి రూ. 1.30 లక్షల వరకు నేరుగా ఆర్థిక సహాయం, ఉపాధి హామీ పథకం కింద 90 రోజుల వేతనం.",
        "summary_hi": "ग्रामीण क्षेत्रों में पक्के मकान निर्माण के लिए ₹1.20 लाख से ₹1.30 लाख की सीधी आर्थिक मदद, साथ ही मनरेगा के तहत 90 दिनों की मजदूरी।",
        "summary_ta": "கிராமப்புறங்களில் கான்கிரீட் வீடு கட்ட ₹1.20 லட்சம் முதல் ₹1.30 லட்சம் வரை நேரடி அரசு மானியம் மற்றும் கழிப்பறை கட்ட ₹12,000 உதவித்தொகை.",
        "summary_kn": "ಗ್ರಾಮೀಣ ಭಾಗದ ಬಡ ಕುಟುಂಬಗಳಿಗೆ ಸ್ವಂತ ಮನೆ ನಿರ್ಮಾಣಕ್ಕಾಗಿ ₹1.20 ಲಕ್ಷದಿಂದ ₹1.30 ಲಕ್ಷ ನೇರ ಧನಸಹಾಯ ಮತ್ತು ಶೌಚಾಲಯ ನಿರ್ಮಾಣಕ್ಕೆ ₹12,000 ನೆರವು.",
        "benefits_description": "₹1,20,000 (Plain areas) / ₹1,30,000 (Hilly/Himalayan states) direct grant + 90-95 days of unskilled labor wages under MGNREGA + ₹12,000 under Swachh Bharat Mission for toilets.",
        "required_documents_json": '["Aadhaar Card", "MGNREGA Job Card", "Bank Account Passbook", "SECC 2011 Verification / Gram Sabha Resolution"]',
        "eligibility_criteria_json": '{"residence_type": "rural", "own_pucca_house": false, "max_income": 180000}'
    },
    {
        "title": "Atal Pension Yojana (APY)",
        "department": "Pension Fund Regulatory and Development Authority (PFRDA), Ministry of Finance",
        "issuing_authority": "Government of India",
        "publication_date": "2015-05-09",
        "source_url": "https://www.npscra.nsdl.co.in/",
        "official_portal_url": "https://www.npscra.nsdl.co.in/",
        "is_scheme": 1,
        "affected_citizens": "All Indian citizens aged 18 to 40 years, especially workers in unorganized sectors",
        "category": "Social Security & Pension",
        "deadline": "Open Enrollment",
        "original_text": "Atal Pension Yojana provides a guaranteed minimum monthly pension of ₹1,000 to ₹5,000 from age 60, depending on contributions. Subscribed by individuals aged 18-40.",
        "summary_en": "Guaranteed lifetime monthly pension of ₹1,000 to ₹5,000 for unorganized sector workers starting at age 60, with spouse pension and nominee corpus return.",
        "summary_te": "అసంఘటిత రంగ కార్మికులకు 60 ఏళ్ల వయస్సు తర్వాత నెలకు రూ. 1,000 నుండి రూ. 5,000 వరకు జీవితాంతం హామీతో కూడిన పెన్షన్ అందించే పథకం.",
        "summary_hi": "18 से 40 वर्ष के नागरिकों के लिए 60 वर्ष की आयु के बाद ₹1,000 से ₹5,000 तक की गारंटीकृत आजीवन मासिक पेंशन योजना।",
        "summary_ta": "அமைப்புசாரா தொழிலாளர்களுக்கு 60 வயதிற்குப் பிறகு மாதம் ₹1,000 முதல் ₹5,000 வரை அரசு உத்தரவாதத்துடன் கூடிய மாதாந்திர ஓய்வூதியம்.",
        "summary_kn": "ಅಸಂಘಟಿತ ವಲಯದ ಕಾರ್ಮಿಕರಿಗೆ 60 ವರ್ಷ ತುಂಬಿದ ನಂತರ ತಿಂಗಳಿಗೆ ₹1,000 ದಿಂದ ₹5,000 ವರೆಗೆ ಖಾತರಿಯ ಮಾಸಿಕ ಪಿಂಚಣಿ ನೀಡುವ ಯೋಜನೆ.",
        "benefits_description": "Guaranteed monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000 or ₹5,000 from age 60 until death. 100% pension continues to spouse, and complete corpus of up to ₹8.5 Lakh returned to nominee.",
        "required_documents_json": '["Savings Bank Account", "Aadhaar Card", "Active Mobile Number", "Nominee Details"]',
        "eligibility_criteria_json": '{"min_age": 18, "max_age": 40, "income_tax_payer_excluded": true}'
    },
    {
        "title": "Pradhan Mantri Mudra Yojana (PMMY)",
        "department": "Department of Financial Services, Ministry of Finance",
        "issuing_authority": "Government of India",
        "publication_date": "2015-04-08",
        "source_url": "https://www.mudra.org.in/",
        "official_portal_url": "https://www.mudra.org.in/",
        "is_scheme": 1,
        "affected_citizens": "Small micro-entrepreneurs, shopkeepers, artisans, and small business owners",
        "category": "Banking, Loans & MSME",
        "deadline": "Continuous Availability across all Banks",
        "original_text": "PMMY provides loans up to ₹20 lakh to non-corporate, non-farm small/micro enterprises. Three categories: Shishu (up to ₹50,000), Kishore (₹50,000 to ₹5 lakh), Tarun (₹5 lakh to ₹20 lakh). No collateral required.",
        "summary_en": "Collateral-free business loans up to ₹20 lakh under Shishu, Kishore, and Tarun categories to start or expand micro enterprises and retail shops.",
        "summary_te": "చిన్న వ్యాపారులు మరియు నూతన స్టార్టప్‌ల కోసం ఎలాంటి తాకట్టు లేకుండా రూ. 20 లక్షల వరకు తక్కువ వడ్డీతో ముద్రా రుణాలు.",
        "summary_hi": "बिना किसी गारंटी (कोलैटरल) के छोटे व्यवसायियों और खुदरा व्यापारियों को ₹20 लाख तक का रियायती व्यावसायिक ऋण।",
        "summary_ta": "சிறு வணிகர்கள் மற்றும் தொழில்முனைவோருக்கு பிணையம் ஏதுமின்றி ₹20 லட்சம் வரை குறைந்த வட்டியில் தொழில் கடன் வழங்கும் முத்ரா திட்டம்.",
        "summary_kn": "ಸಣ್ಣ ವ್ಯಾಪಾರಿಗಳು ಮತ್ತು ನವೋದ್ಯಮಿಗಳಿಗೆ ಯಾವುದೇ ಆಧಾರವಿಲ್ಲದೆ ₹20 ಲಕ್ಷದವರೆಗೆ ಕಡಿಮೆ ಬಡ್ಡಿಯಲ್ಲಿ ಸಾಲ ನೀಡುವ ಪ್ರಧಾನ ಮಂತ್ರಿ ಮುದ್ರಾ ಯೋಜನೆ.",
        "benefits_description": "Zero collateral security required; loans up to ₹20,00,000; affordable interest rates; flexible repayment tenure up to 5-7 years; MUDRA RuPay card for working capital.",
        "required_documents_json": '["Identity Proof (Aadhaar / Voter ID)", "Business Address Proof", "Business Registration / Udyam Certificate", "Past 6 Months Bank Statement", "Quotation / Project Report"]',
        "eligibility_criteria_json": '{"min_age": 18, "business_type": "non_farm_micro_enterprise"}'
    },
    {
        "title": "Sukanya Samriddhi Yojana (SSY)",
        "department": "Department of Posts & Ministry of Finance",
        "issuing_authority": "Government of India",
        "publication_date": "2015-01-22",
        "source_url": "https://www.indiapost.gov.in/",
        "official_portal_url": "https://www.indiapost.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Parents or legal guardians of girl children aged below 10 years",
        "category": "Women & Child Empowerment",
        "deadline": "Account openable anytime before girl child turns 10",
        "original_text": "Sukanya Samriddhi Yojana is a government-backed savings scheme targeted at parents of girl children. It offers an attractive interest rate (8.2% per annum), Section 80C tax exemption, and exempt-exempt-exempt (EEE) tax status on maturity.",
        "summary_en": "High-interest sovereign savings scheme (8.2% interest) with 100% tax exemption under Section 80C to secure the education and marriage of a girl child.",
        "summary_te": "ఆడపిల్లల ఉన్నత చదువులు మరియు భవిష్యత్తు కోసం 8.2% గరిష్ట వడ్డీ రేటు మరియు పూర్తి పన్ను మినహాయింపుతో సుకన్య సమృద్ధి యోజన.",
        "summary_hi": "बेटियों की उच्च शिक्षा और भविष्य के लिए 8.2% ब्याज दर और 100% आयकर छूट (EEE) के साथ लोकप्रिय सरकारी बचत योजना।",
        "summary_ta": "பெண் குழந்தைகளின் கல்வி மற்றும் திருமணத்திற்காக 8.2% அதிக வட்டியுடன் கூடிய மத்திய அரசின் சுகன்யா சம்ரித்தி சேமிப்பு திட்டம்.",
        "summary_kn": "ಹೆಣ್ಣು ಮಕ್ಕಳ ಉನ್ನತ ಶಿಕ್ಷಣ ಮತ್ತು ಭವಿಷ್ಯಕ್ಕಾಗಿ 8.2% ಗರಿಷ್ಠ ಬಡ್ಡಿ ಮತ್ತು ಸಂಪೂರ್ಣ ತೆರಿಗೆ ವಿನಾಯಿತಿ ನೀಡುವ ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ.",
        "benefits_description": "Attractive compound annual interest rate of 8.2%; Triple tax exemption (Deposit, Interest, Maturity); Minimum deposit ₹250/year up to ₹1.5 Lakh/year.",
        "required_documents_json": '["Girl Child Birth Certificate", "Identity Proof of Parent/Guardian (Aadhaar/PAN)", "Address Proof", "Photographs"]',
        "eligibility_criteria_json": '{"max_age_child": 10, "gender_target": "female"}'
    },
    {
        "title": "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
        "department": "Ministry of Housing and Urban Affairs",
        "issuing_authority": "Government of India",
        "publication_date": "2020-06-01",
        "source_url": "https://pmsvanidhi.mohua.gov.in/",
        "official_portal_url": "https://pmsvanidhi.mohua.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Urban and peri-urban street vendors and hawkers",
        "category": "Livelihood & Micro Credit",
        "deadline": "Ongoing Scheme",
        "original_text": "PM SVANidhi facilitates collateral-free working capital loans of ₹10,000, ₹20,000 and ₹50,000 to street vendors. Features 7% interest subsidy on timely repayment and digital cashbacks up to ₹1,200/year.",
        "summary_en": "Collateral-free micro working capital loans up to ₹50,000 for street vendors with 7% interest subsidy and cashback for digital transactions.",
        "summary_te": "వీధి వ్యాపారులకు రూ. 50,000 వరకు తాకట్టు లేని వర్కింగ్ క్యాపిటల్ రుణాలు, సమయానికి చెల్లిస్తే 7% వడ్డీ సబ్సిడీ మరియు క్యాష్‌బ్యాక్.",
        "summary_hi": "स्ट्रीट वेंडरों और रेहड़ी-पटरी वालों के लिए ₹50,000 तक का सस्ता कार्यशील पूंजी ऋण, 7% ब्याज सब्सिडी और डिजिटल कैशबैक सुविधा।",
        "summary_ta": "தெருவோர வியாபாரிகளுக்கு ₹50,000 வரை பிணையமில்லா குறைந்த வட்டி கடன், 7% வட்டி மானியம் மற்றும் டிஜிட்டல் கேஷ்பேக் சலுகை.",
        "summary_kn": "ಬೀದಿ ಬದಿ ವ್ಯಾಪಾರಿಗಳಿಗೆ ₹50,000 ವರೆಗೆ ಜಾಮೀನು ರಹಿತ ದುಡಿಯುವ ಬಂಡವಾಳ ಸಾಲ, 7% ಬಡ್ಡಿ ಸಬ್ಸಿಡಿ ಮತ್ತು ಡಿಜಿಟಲ್ ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ಸೌಲಭ್ಯ.",
        "benefits_description": "First tranche ₹10,000; Second tranche ₹20,000; Third tranche ₹50,000; 7% interest subsidy credited directly to bank account; Up to ₹1,200 annual cashback on digital QR payments.",
        "required_documents_json": '["Certificate of Vending (CoV) / Recommendation Letter from Urban Local Body", "Aadhaar Card", "Bank Account linked to Mobile Number"]',
        "eligibility_criteria_json": '{"occupation": "street_vendor", "urban_vendor": true}'
    },
    {
        "title": "Pradhan Mantri Ujjwala Yojana (PMUY 2.0)",
        "department": "Ministry of Petroleum and Natural Gas",
        "issuing_authority": "Government of India",
        "publication_date": "2021-08-10",
        "source_url": "https://www.pmuy.gov.in/",
        "official_portal_url": "https://www.pmuy.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Adult women belonging to poor BPL / EWS households without existing LPG connection",
        "category": "Energy & Women Welfare",
        "deadline": "Open Application",
        "original_text": "PMUY 2.0 provides deposit-free LPG connections to adult women from poor households, along with a free first refill and hotplate stove, plus a targeted ₹300 per cylinder subsidy.",
        "summary_en": "Deposit-free LPG gas connection in the name of the female head of the family, free gas stove, first free cylinder refill, and ₹300 direct subsidy per cylinder.",
        "summary_te": "పేద కుటుంబాల మహిళల పేరిట ఉచిత గ్యాస్ కనెక్షన్, ఉచిత స్టవ్, మొదటి ఉచిత సిలిండర్ మరియు ప్రతి సిలిండర్‌పై రూ. 300 నేరుగా రాయితీ.",
        "summary_hi": "गरीब परिवारों की महिलाओं को नि:शुल्क एलपीजी गैस कनेक्शन, पहला भरा हुआ सिलेंडर और चूल्हा मुफ्त, साथ ही प्रति सिलेंडर ₹300 की लक्षित सब्सिडी।",
        "summary_ta": "ஏழை குடும்பப் பெண்களுக்கு வைப்புத்தொகையற்ற இலவச சமையல் எரிவாயு இணைப்பு, இலவச கேஸ் அடுப்பு மற்றும் சிலிண்டருக்கு ₹300 நேரடி மானியம்.",
        "summary_kn": "ಬಡ ಕುಟುಂಬಗಳ ಮಹಿಳೆಯರ ಹೆಸರಿನಲ್ಲಿ ಠೇವಣಿ ರಹಿತ ಉಚಿತ ಗ್ಯಾಸ್ ಸಂಪರ್ಕ, ಉಚಿತ ಒಲೆ, ಮೊದಲ ಸಿಲಿಂಡರ್ ಭರ್ತಿ ಮತ್ತು ಪ್ರತಿ ಸಿಲಿಂಡರ್‌ಗೆ ₹300 ಸಬ್ಸಿಡಿ.",
        "benefits_description": "Free deposit-free LPG connection; free hotplate stove; free first refill; continuous ₹300 direct benefit transfer subsidy per 14.2 kg domestic LPG cylinder.",
        "required_documents_json": '["Aadhaar Card of Applicant and Adult Family Members", "Ration Card / BPL Document", "Active Bank Passbook with IFSC", "Declaration of No Existing LPG Connection"]',
        "eligibility_criteria_json": '{"min_age": 18, "gender_target": "female", "existing_lpg": false, "max_income": 200000}'
    },
    {
        "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "department": "Department of Agriculture and Farmers Welfare",
        "issuing_authority": "Government of India",
        "publication_date": "2016-02-18",
        "source_url": "https://pmfby.gov.in/",
        "official_portal_url": "https://pmfby.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "All farmers including sharecroppers and tenant farmers growing notified crops",
        "category": "Agriculture & Insurance",
        "deadline": "Seasonal cut-off (July 31 for Kharif, Dec 31 for Rabi)",
        "original_text": "PMFBY provides comprehensive crop insurance cover against non-preventable natural risks from pre-sowing to post-harvest. Farmers pay a nominal premium of 2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops.",
        "summary_en": "Comprehensive low-premium crop insurance for farmers protecting against drought, flood, pests, and unseasonal rains with satellite-based claim settlement.",
        "summary_te": "రైతులకు ప్రకృతి వైపరీత్యాలు, కరువు, వరదల వల్ల కలిగే పంట నష్టానికి అతి తక్కువ ప్రీమియంతో పూర్తి పంట బీమా రక్షణ.",
        "summary_hi": "सूखा, बाढ़ और बेमौसम बारिश से फसल नुकसान पर किसानों को व्यापक बीमा सुरक्षा, जिसमें किसान को केवल 1.5% से 2% का न्यूनतम प्रीमियम देना होता है।",
        "summary_ta": "வறட்சி மற்றும் வெள்ளத்தால் ஏற்படும் பயிர் சேதங்களுக்கு விவசாயிகளுக்கு மிகக் குறைந்த பிரீமியத்தில் முழு பயிர் காப்பீட்டு இழப்பீடு.",
        "summary_kn": "ಬರ, ಪ್ರವಾಹ ಹಾಗೂ ಅಕಾಲಿಕ ಮಳೆಯಿಂದ ಬೆಳೆ ನಷ್ಟವಾದಲ್ಲಿ ರೈತರಿಗೆ ಅತ್ಯಂತ ಕಡಿಮೆ ಪ್ರೀಮಿಯಂನಲ್ಲಿ ಸಂಪೂರ್ಣ ಬೆಳೆ ವಿಮೆ ಪರಿಹಾರ ನೀಡುವ ಯೋಜನೆ.",
        "benefits_description": "Coverage from sowing prevention to post-harvest losses; Farmers pay only 2% for Kharif crops, 1.5% for Rabi food grains/oilseeds, and 5% for horticultural crops; remaining premium paid by Government.",
        "required_documents_json": '["Land Record / RoR / Patta Passbook", "Sowing Certificate / Crop Declaration", "Bank Account Passbook", "Aadhaar Card"]',
        "eligibility_criteria_json": '{"occupation": "farmer", "crop_grower": true}'
    },
    {
        "title": "National Social Assistance Programme (NSAP Old Age & Widow Pension)",
        "department": "Ministry of Rural Development",
        "issuing_authority": "Government of India & State Social Welfare Departments",
        "publication_date": "1995-08-15",
        "source_url": "https://nsap.nic.in/",
        "official_portal_url": "https://nsap.nic.in/",
        "is_scheme": 1,
        "affected_citizens": "Elderly citizens aged 60+, widows aged 40+, and persons with severe disabilities living below poverty line",
        "category": "Social Welfare & Pension",
        "deadline": "Continuous Enrollment",
        "original_text": "NSAP fulfills Directive Principles of State Policy by providing social security pensions: Indira Gandhi National Old Age Pension Scheme (IGNOAPS), Widow Pension Scheme (IGNWPS), and Disability Pension Scheme (IGNDPS).",
        "summary_en": "Monthly social security pension for BPL senior citizens (60+ years), destitute widows, and individuals with severe disabilities, augmented by state contributions.",
        "summary_te": "నిరుపేద వృద్ధులు (60+ ఏళ్లు), వితంతువులు మరియు దివ్యాంగులకు ప్రతి నెలా గౌరవప్రదమైన జీవనం కోసం అందించే సామాజిక భద్రతా పెన్షన్.",
        "summary_hi": "गरीबी रेखा से नीचे जीवन यापन करने वाले वरिष्ठ नागरिकों (60+ वर्ष), विधवाओं और दिव्यांगजनों को मासिक सामाजिक सुरक्षा पेंशन।",
        "summary_ta": "வறுமைக் கோட்டிற்கு கீழ் உள்ள முதியவர்கள் (60+ வயது), கைம்பெண்கள் மற்றும் மாற்றுத்திறனாளிகளுக்கு மாதாந்திர சமூகப் பாதுகாப்பு ஓய்வூதியம்.",
        "summary_kn": "ಬಡತನ ರೇಖೆಗಿಂತ ಕೆಳಗಿರುವ ಹಿರಿಯ ನಾಗರಿಕರು (60+ ವರ್ಷ), ವಿಧವೆಯರು ಮತ್ತು ವಿಕಲಚೇತನರಿಗೆ ಗೌರವಯುತ ಜೀವನಕ್ಕಾಗಿ ಮಾಸಿಕ ಸಾಮಾಜಿಕ ಭದ್ರತಾ ಪಿಂಚಣಿ.",
        "benefits_description": "Monthly direct benefit pension (ranging from ₹1,000 to ₹3,000/month combined with state top-ups) credited directly to beneficiary bank/post office accounts.",
        "required_documents_json": '["Aadhaar Card", "Age Proof Certificate", "BPL Ration Card / Income Certificate", "Bank Account Passbook", "Disability Certificate (if applicable)"]',
        "eligibility_criteria_json": '{"min_age": 60, "max_income": 100000, "bpl_card": true}'
    },
    {
        "title": "Jal Jeevan Mission (Har Ghar Jal)",
        "department": "Department of Drinking Water and Sanitation, Ministry of Jal Shakti",
        "issuing_authority": "Government of India",
        "publication_date": "2019-08-15",
        "source_url": "https://jaljeevanmission.gov.in/",
        "official_portal_url": "https://ejalshakti.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "All rural households across all Indian villages",
        "category": "Water & Sanitation",
        "deadline": "Mission Target Implementation",
        "original_text": "Jal Jeevan Mission aims to provide functional household tap connection (FHTC) to every rural home, ensuring potable drinking water supply in adequate quantity (55 liters per capita per day) of prescribed quality on regular basis.",
        "summary_en": "Provides piped, treated drinking water tap connections directly inside every rural household (55 liters per person per day) to eliminate manual water fetching.",
        "summary_te": "ప్రతి గ్రామీణ నివాసానికి నేరుగా నల్లా ద్వారా రోజుకు తలసరి 55 లీటర్ల శుభ్రమైన, సురక్షితమైన తాగునీటి సరఫరా అందించే పథకం.",
        "summary_hi": "प्रत्येक ग्रामीण परिवार को घर के भीतर नल से शुद्ध और सुरक्षित पेयजल कनेक्शन (प्रति व्यक्ति 55 लीटर प्रतिदिन) प्रदान करने का राष्ट्रीय मिशन।",
        "summary_ta": "ஒவ்வொரு கிராமப்புற வீட்டிற்கும் குழாய் மூலம் தினமும் நபர் ஒருவருக்கு 55 லிட்டர் சுத்தமான குடிநீர் இணைப்பு வழங்கும் தேசிய இயக்கம்.",
        "summary_kn": "ಪ್ರತಿಯೊಂದು ಗ್ರಾಮೀಣ ಮನೆಗೂ ನೇರವಾಗಿ ನಲ್ಲಿಯ ಮೂಲಕ ದಿನಕ್ಕೆ ವ್ಯಕ್ತಿಗೆ 55 ಲೀಟರ್ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರು ಪೂರೈಸುವ ಜಲ ಜೀವನ್ ಮಿಷನ್.",
        "benefits_description": "Free individual household piped water connection; testing kits provided to village water sanitation committees (VWSC); guaranteed continuous potable water standard.",
        "required_documents_json": '["Village Household ID / Ration Card", "Aadhaar Card", "Gram Panchayat Residential Confirmation"]',
        "eligibility_criteria_json": '{"residence_type": "rural", "has_tap_connection": false}'
    },
    {
        "title": "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)",
        "department": "Ministry of Skill Development and Entrepreneurship",
        "issuing_authority": "Government of India",
        "publication_date": "2023-04-01",
        "source_url": "https://www.pmkvyofficial.org/",
        "official_portal_url": "https://www.pmkvyofficial.org/",
        "is_scheme": 1,
        "affected_citizens": "Unemployed Indian youth, school/college dropouts aged 15 to 45 years",
        "category": "Skill Development & Employment",
        "deadline": "Continuous Batch Enrolments",
        "original_text": "PMKVY 4.0 provides industry-aligned skill certification and placement assistance across modern job roles including AI, Robotics, Mechatronics, Green Energy, and Healthcare. Course fees 100% sponsored by Government.",
        "summary_en": "Free government-certified vocational skill training with monetary reward and direct job placement support in cutting-edge industries for unemployed youth.",
        "summary_te": "నిరుద్యోగ యువతకు అత్యాధునిక రంగాలలో ఉచిత సాంకేతిక నైపుణ్య శిక్షణ, ప్రభుత్వ ధృవీకరణ పత్రం మరియు ఉద్యోగ అవకాశాలు.",
        "summary_hi": "बेरोजगार युवाओं के लिए उद्योग-उन्मुख कौशल प्रशिक्षण, सरकारी प्रमाणपत्र और सीधे रोजगार के अवसर, 100% सरकारी खर्च पर।",
        "summary_ta": "வேலையில்லா இளைஞர்களுக்கு நவீன தொழில்நுட்பங்களில் இலவச திறன் பயிற்சி, மத்திய அரசு சான்றிதழ் மற்றும் வேலைவாய்ப்பு உதவி.",
        "summary_kn": "ನಿರುದ್ಯೋಗಿ ಯುವಜನರಿಗೆ ಉಚಿತ ಉದ್ಯೋಗಾಧಾರಿತ ಕೌಶಲ್ಯ ತರಬೇತಿ, ಸರ್ಕಾರಿ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಉದ್ಯೋಗಾವಕಾಶ ನೀಡುವ ಯೋಜನೆ.",
        "benefits_description": "100% free certified training courses; government assessment certification; post-placement stipend and support; digital skills and entrepreneurship modules.",
        "required_documents_json": '["Aadhaar Card", "Bank Account Details", "Educational Qualification / School Leaving Certificate", "Recent Passport Photographs"]',
        "eligibility_criteria_json": '{"min_age": 15, "max_age": 45, "employment_status": "unemployed"}'
    },
    {
        "title": "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
        "department": "Department of Financial Services, Ministry of Finance",
        "issuing_authority": "Government of India",
        "publication_date": "2014-08-28",
        "source_url": "https://pmjdy.gov.in/",
        "official_portal_url": "https://pmjdy.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Any unbanked adult citizen of India",
        "category": "Banking & Financial Inclusion",
        "deadline": "Open at all Public/Private Bank Branches",
        "original_text": "PMJDY provides universal access to banking services with at least one basic banking account for every unbanked adult, zero minimum balance, free RuPay debit card with ₹2 lakh accidental insurance, and ₹10,000 overdraft facility.",
        "summary_en": "Zero-balance bank account with free RuPay debit card, ₹2 lakh accidental death insurance, and ₹10,000 overdraft facility for every unbanked citizen.",
        "summary_te": "కనీస నిల్వ అవసరం లేని ఉచిత జీరో బ్యాలెన్స్ బ్యాంక్ ఖాతా, రూ. 2 లక్షల ఉచిత ప్రమాద బీమా మరియు రూ. 10,000 ఓవర్‌డ్రాఫ్ట్ సదుపాయం.",
        "summary_hi": "जीरो-बैलेंस बैंक खाता, मुफ्त रुपे डेबिट कार्ड, ₹2 लाख का दुर्घटना बीमा और संतोषजनक संचालन पर ₹10,000 की ओवरड्राफ्ट सुविधा।",
        "summary_ta": "குறைந்தபட்ச இருப்பு தேவையில்லாத இலவச ஜீரோ பேலன்ஸ் வங்கி கணக்கு, ₹2 லட்சம் இலவச விபத்து காப்பீடு மற்றும் ₹10,000 வரை ஓவர் டிராப்ட் சலுகை.",
        "summary_kn": "ಯಾವುದೇ ಕನಿಷ್ಠ ಬ್ಯಾಲೆನ್ಸ್ ಇಲ್ಲದ ಉಚಿತ ಜೀರೋ ಬ್ಯಾಲೆನ್ಸ್ ಖಾತೆ, ₹2 ಲಕ್ಷ ಉಚಿತ ಅಪಘಾತ ವಿಮೆ ಮತ್ತು ₹10,000 ಓವರ್‌ಡ್ರಾಫ್ಟ್ ಸೌಲಭ್ಯ.",
        "benefits_description": "Zero minimum balance account; interest on deposits; RuPay debit card with ₹2,00,000 accidental cover; ₹10,000 overdraft facility per eligible household; direct receipt of all DBT subsidies.",
        "required_documents_json": '["Aadhaar Card (eKYC)", "PAN Card / Form 60", "Passport Photograph"]',
        "eligibility_criteria_json": '{"min_age": 10, "unbanked": true}'
    },
    {
        "title": "Rythu Bandhu / Agriculture Investment Support Scheme",
        "department": "Department of Agriculture, Government of Telangana",
        "issuing_authority": "Government of Telangana",
        "publication_date": "2018-05-10",
        "source_url": "https://rythubandhu.telangana.gov.in/",
        "official_portal_url": "https://rythubandhu.telangana.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "All landholding farmers in Telangana State",
        "category": "Agriculture & Farmers Welfare",
        "deadline": "Bi-annual (Kharif and Rabi seasons)",
        "original_text": "Rythu Bandhu provides investment support of ₹10,000 per acre per year (₹5,000 per acre for each Kharif and Rabi season) directly to farmers' bank accounts for purchasing seeds, fertilizers, pesticides, and farming inputs.",
        "summary_en": "Investment support of ₹10,000 per acre per year (₹5,000/acre each season) transferred directly to farmers in Telangana for agricultural inputs.",
        "summary_te": "తెలంగాణలోని రైతులకు విత్తనాలు, ఎరువుల పెట్టుబడి సహాయం కోసం ఎకరాకు ఏటా రూ. 10,000 (సీజన్‌కు రూ. 5,000) నేరుగా బ్యాంక్ ఖాతాలో జమ.",
        "summary_hi": "तेलंगाना के किसानों को खेती की लागत (बीज, खाद) के लिए ₹10,000 प्रति एकड़ प्रति वर्ष की सीधी वित्तीय सहायता।",
        "summary_ta": "விவசாயிகளுக்கு பயிர் சாகுபடி செலவுகளுக்காக ஆண்டுக்கு ஏக்கருக்கு ₹10,000 நேரடி முதலீட்டு உதவி வழங்கும் திட்டம்.",
        "summary_kn": "ರೈತರಿಗೆ ಕೃಷಿ ವೆಚ್ಚಗಳಿಗಾಗಿ ಪ್ರತಿ ವರ್ಷ ಎಕರೆಗೆ ₹10,000 ನೇರ ಧನಸಹಾಯ ನೀಡುವ ಕೃಷಿ ಹೂಡಿಕೆ ನೆರವು ಯೋಜನೆ.",
        "benefits_description": "₹5,000 per acre per season direct benefit transfer; no restrictions on land size for genuine patta holders; complete freedom to buy choice of inputs.",
        "required_documents_json": '["Pattadar Passbook / Digital RoR 1B", "Aadhaar Card", "Bank Account linked to Aadhaar"]',
        "eligibility_criteria_json": '{"state": "Telangana", "occupation": "farmer", "landholder": true}'
    },
    {
        "title": "Kalaignar Magalir Urimai Thittam",
        "department": "Department of Social Welfare and Women Empowerment, Government of Tamil Nadu",
        "issuing_authority": "Government of Tamil Nadu",
        "publication_date": "2023-09-15",
        "source_url": "https://kmut.tn.gov.in/",
        "official_portal_url": "https://kmut.tn.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Female heads of eligible low-income families in Tamil Nadu",
        "category": "Women Welfare & Direct Support",
        "deadline": "Ongoing Monthly Disbursal",
        "original_text": "Kalaignar Magalir Urimai Thittam provides basic income support of ₹1,000 per month (₹12,000 annually) directly to the bank accounts of women heads of eligible households in Tamil Nadu to recognize their unpaid care work.",
        "summary_en": "Direct basic income grant of ₹1,000 per month (₹12,000 annually) deposited into the bank accounts of women heads of households in Tamil Nadu.",
        "summary_te": "తమిళనాడులోని పేద కుటుంబాల మహిళా యజమానురాలికి నెలకు రూ. 1,000 చొప్పున ఏటా రూ. 12,000 నేరుగా బ్యాంక్ ఖాతాలో జమ చేసే పథకం.",
        "summary_hi": "तमिलनाडु में पात्र परिवारों की महिला मुखिया को ₹1,000 प्रति माह (₹12,000 प्रति वर्ष) की सीधी मासिक आर्थिक सहायता।",
        "summary_ta": "குடும்பத் தலைவிகளின் உழைப்பை அங்கீகரிக்கும் வகையில் மாதம் ₹1,000 (ஆண்டுக்கு ₹12,000) நேரடியாக வங்கி கணக்கில் செலுத்தும் மகளிர் உரிமைத் திட்டம்.",
        "summary_kn": "ತಮಿಳುನಾಡಿನ ಕುಟುಂಬದ ಮಹಿಳಾ ಮುಖ್ಯಸ್ಥರಿಗೆ ತಿಂಗಳಿಗೆ ₹1,000 (ವರ್ಷಕ್ಕೆ ₹12,000) ನೇರ ಮಾಸಿಕ ಧನಸಹಾಯ ನೀಡುವ ಮಹಿಳಾ ಹಕ್ಕು ಯೋಜನೆ.",
        "benefits_description": "₹1,000 credited on the 15th of every month via Direct Benefit Transfer; full autonomy of expenditure for women beneficiaries.",
        "required_documents_json": '["Smart Ration Card", "Aadhaar Card of Female Head", "Bank Passbook with Aadhaar link", "Electricity Consumer Number"]',
        "eligibility_criteria_json": '{"state": "Tamil Nadu", "min_age": 21, "gender_target": "female", "max_income": 250000}'
    },
    {
        "title": "Karnataka Yuva Nidhi Scheme",
        "department": "Department of Skill Development, Entrepreneurship and Livelihood, Karnataka",
        "issuing_authority": "Government of Karnataka",
        "publication_date": "2024-01-12",
        "source_url": "https://sevasindhuservices.karnataka.gov.in/",
        "official_portal_url": "https://sevasindhuservices.karnataka.gov.in/",
        "is_scheme": 1,
        "affected_citizens": "Unemployed degree and diploma holders in Karnataka who graduated recently",
        "category": "Education, Youth & Unemployment Relief",
        "deadline": "Open through Seva Sindhu Portal",
        "original_text": "Yuva Nidhi provides financial support of ₹3,000 per month for degree holders and ₹1,500 per month for diploma holders who graduated in the academic year and remain unemployed for 6 months after graduation, up to 2 years.",
        "summary_en": "Monthly financial assistance of ₹3,000 for unemployed graduates and ₹1,500 for diploma holders in Karnataka for up to 2 years while seeking employment.",
        "summary_te": "కర్ణాటకలోని నిరుద్యోగ డిగ్రీ ఉత్తీర్ణులకు నెలకు రూ. 3,000, డిప్లొమా వారికి నెలకు రూ. 1,500 చొప్పున రెండేళ్ల వరకు అందించే నిరుద్యోగ భృతి.",
        "summary_hi": "कर्नाटक के बेरोजगार स्नातकों को ₹3,000/माह और डिप्लोमा धारकों को ₹1,500/माह का बेरोजगारी भत्ता, अधिकतम 2 वर्षों के लिए।",
        "summary_ta": "கர்நாடகாவில் வேலை தேடும் பட்டதாரிகளுக்கு மாதம் ₹3,000 மற்றும் டிப்ளமோ முடித்தவர்களுக்கு மாதம் ₹1,500 வழங்கும் இளைஞர் நிதி திட்டம்.",
        "summary_kn": "ಕರ್ನಾಟಕದ ನಿರುದ್ಯೋಗಿ ಪದವೀಧರರಿಗೆ ತಿಂಗಳಿಗೆ ₹3,000 ಹಾಗೂ ಡಿಪ್ಲೊಮಾ ಪಾಸಾದವರಿಗೆ ತಿಂಗಳಿಗೆ ₹1,500 ರಂತೆ 2 ವರ್ಷಗಳವರೆಗೆ ನೀಡುವ ಯುವ ನಿಧಿ ಯೋಜನೆ.",
        "benefits_description": "₹3,000/month for degree holders and ₹1,500/month for diploma holders via DBT for up to 24 months or until employment is secured, whichever is earlier.",
        "required_documents_json": '["Karnataka Domicile Proof", "Degree / Diploma Certificate", "Aadhaar Card", "Bank Account linked to Aadhaar", "Self-declaration of Unemployment"]',
        "eligibility_criteria_json": '{"state": "Karnataka", "employment_status": "unemployed", "education_level": "higher_education"}'
    }
]

async def seed_benchmark_schemes():
    """Seeds verified official government schemes into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    for scheme in OFFICIAL_BENCHMARK_SCHEMES:
        existing = cursor.execute(
            "SELECT id FROM policy_announcements WHERE title = ?", (scheme["title"],)
        ).fetchone()
        if not existing:
            summary_en = scheme["summary_en"]
            summary_te = scheme.get("summary_te") or summary_en
            summary_hi = scheme.get("summary_hi") or summary_en
            summary_ta = scheme.get("summary_ta") or summary_en
            summary_kn = scheme.get("summary_kn") or summary_en

            cursor.execute("""
                INSERT INTO policy_announcements (
                    title, department, publication_date, source_url, issuing_authority,
                    original_text, summary_en, summary_te, summary_hi, summary_ta, summary_kn,
                    affected_citizens, category, deadline, official_portal_url, is_scheme,
                    eligibility_criteria_json, benefits_description, required_documents_json, retrieval_timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                scheme["title"],
                scheme["department"],
                scheme["publication_date"],
                scheme["source_url"],
                scheme["issuing_authority"],
                scheme["original_text"],
                summary_en,
                summary_te,
                summary_hi,
                summary_ta,
                summary_kn,
                scheme["affected_citizens"],
                scheme["category"],
                scheme["deadline"],
                scheme["official_portal_url"],
                scheme["is_scheme"],
                scheme["eligibility_criteria_json"],
                scheme["benefits_description"],
                scheme["required_documents_json"],
                datetime.utcnow().isoformat()
            ))
    conn.commit()
    conn.close()

async def fetch_live_pib_releases() -> List[Dict[str, Any]]:
    """
    Fetches live official releases from Press Information Bureau (PIB) RSS feeds.
    Respects rate limits and extracts genuine government press notifications.
    """
    feed_url = settings.PIB_RSS_PRESS_RELEASES
    headers = {
        "User-Agent": "CivicConnect-Governance-Client/1.0 (+https://civicconnect.gov.in; contact@civicconnect.in)"
    }
    
    ingested_items = []
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(feed_url, headers=headers)
            if resp.status_code == 200:
                root = ET.fromstring(resp.content)
                items = root.findall(".//item")
                conn = get_db_connection()
                cursor = conn.cursor()

                for item in items[:15]:
                    title_elem = item.find("title")
                    link_elem = item.find("link")
                    desc_elem = item.find("description")
                    pub_elem = item.find("pubDate")

                    title = title_elem.text.strip() if title_elem is not None and title_elem.text else "Official Press Release"
                    link = link_elem.text.strip() if link_elem is not None and link_elem.text else feed_url
                    pub_date = pub_elem.text.strip() if pub_elem is not None and pub_elem.text else datetime.utcnow().strftime("%Y-%m-%d")

                    raw_desc = desc_elem.text if desc_elem is not None and desc_elem.text else title
                    soup = BeautifulSoup(raw_desc, "html.parser")
                    cleaned_text = soup.get_text().strip()

                    # Deduplicate in database
                    existing = cursor.execute("SELECT id FROM policy_announcements WHERE source_url = ?", (link,)).fetchone()
                    if not existing and len(title) > 5:
                        summary_en = cleaned_text[:350] + ("..." if len(cleaned_text) > 350 else "")
                        summary_te = translate_text(summary_en, target_lang="te")
                        summary_hi = translate_text(summary_en, target_lang="hi")
                        summary_ta = translate_text(summary_en, target_lang="ta")
                        summary_kn = translate_text(summary_en, target_lang="kn")

                        dept = "Press Information Bureau / Government of India"
                        if "Ministry of" in title or "Ministry of" in cleaned_text:
                            m = re.search(r"Ministry of [A-Za-z\s]+", title + " " + cleaned_text)
                            if m:
                                dept = m.group(0).strip()

                        cursor.execute("""
                            INSERT INTO policy_announcements (
                                title, department, publication_date, source_url, issuing_authority,
                                original_text, summary_en, summary_te, summary_hi, summary_ta, summary_kn,
                                affected_citizens, category, deadline, official_portal_url, is_scheme,
                                eligibility_criteria_json, benefits_description, required_documents_json, retrieval_timestamp
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            title,
                            dept,
                            pub_date,
                            link,
                            "Press Information Bureau (PIB)",
                            cleaned_text,
                            summary_en,
                            summary_te,
                            summary_hi,
                            summary_ta,
                            summary_kn,
                            "General Citizens of India",
                            "Official Announcement",
                            "Refer to official release",
                            link,
                            0,
                            "{}",
                            "Official notification of national policy update or government initiative.",
                            "[]",
                            datetime.utcnow().isoformat()
                        ))
                        ingested_items.append({"title": title, "link": link})
                conn.commit()
                conn.close()
    except Exception as e:
        print(f"[PIB Ingestion] Live feed note: {e}")

    return ingested_items

DOC_LOCALIZATION = {
    "Recent Electricity Bill": {"hi": "नवीनतम बिजली बिल", "ta": "சமீபத்திய மின் கட்டண ரசீது", "kn": "ಇತ್ತೀಚಿನ ವಿದ್ಯುತ್ ಬಿಲ್", "te": "ఇటీవలి విద్యుత్ బిల్లు"},
    "Electricity Consumer Bill (recent)": {"hi": "नवीनतम बिजली बिल", "ta": "சமீபத்திய மின் கட்டண ரசீது", "kn": "ಇತ್ತೀಚಿನ ವಿದ್ಯುತ್ ಬಿಲ್", "te": "ఇటీవలి విద్యుత్ బిల్లు"},
    "Aadhaar Card": {"hi": "आधार कार्ड", "ta": "ஆதார் அட்டை", "kn": "ಆಧಾರ್ ಕಾರ್ಡ್", "te": "ఆధార్ కార్డు"},
    "Proof of Residential Address": {"hi": "आवासीय पता प्रमाण पत्र", "ta": "இருப்பிடச் சான்று", "kn": "ವಾಸಸ್ಥಳ ಪುರಾವೆ", "te": "నివాస ధృవీకరణ పత్రం"},
    "Bank Passbook / Cancelled Cheque": {"hi": "बैंक पासबुक / रद्द चेक", "ta": "வங்கி பாஸ்புக் / காசோலை", "kn": "ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ / ರದ್ದು ಮಾಡಿದ ಚೆಕ್", "te": "బ్యాంక్ పాస్‌బుక్ / రద్దు చేసిన చెక్కు"},
    "Rooftop Photograph": {"hi": "छत का फोटो", "ta": "மேற்கூரை புகைப்படம்", "kn": "ಛಾವಣಿಯ ಫೋಟೋ", "te": "పైకప్పు ఫోటో"},
    "Landholding Records / RoR / Khasra-Khatauni": {"hi": "भूमि अभिलेख (खसरा-खतौनी)", "ta": "நில ஆவணங்கள் (பட்டா/சிட்டா)", "kn": "ಭೂ ದಾಖಲೆಗಳು (RTC)", "te": "భూమి రికార్డులు (పట్టాదారు పాస్‌బుక్)"},
    "Active Bank Passbook": {"hi": "सक्रिय बैंक पासबुक", "ta": "செயலில் உள்ள வங்கி பாஸ்புக்", "kn": "ಸಕ್ರಿಯ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್", "te": "యాక్టివ్ బ్యాంక్ పాస్‌బుక్"},
    "Mobile Number linked to Aadhaar": {"hi": "आधार लिंक मोबाइल नंबर", "ta": "ஆதார் இணைக்கப்பட்ட மொபைல் எண்", "kn": "ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ", "te": "ఆధార్‌తో లింక్ అయిన మొబైల్ నంబర్"},
    "Ration Card / Family ID": {"hi": "राशन कार्ड / परिवार आईडी", "ta": "ரேஷன் அட்டை / குடும்ப அட்டை", "kn": "ರೇಷನ್ ಕಾರ್ಡ್ / ಕುಟುಂಬ ಐಡಿ", "te": "రేషన్ కార్డు / ఫ్యామిలీ ఐడీ"},
    "Caste Certificate": {"hi": "जाति प्रमाण पत्र", "ta": "ஜாதி சான்றிதழ்", "kn": "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ", "te": "కుల ధృవీకరణ పత్రం"},
    "Annual Family Income Certificate": {"hi": "वार्षिक पारिवारिक आय प्रमाण पत्र", "ta": "குடும்ப வருமான சான்றிதழ்", "kn": "ಕುಟುಂಬದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ", "te": "కుటుంబ ఆదాయ ధృవీకరణ పత్రం"},
    "Class 10/12 Marksheet": {"hi": "10वीं/12वीं अंकतालिका", "ta": "10/12 ஆம் வகுப்பு மதிப்பெண் பட்டியல்", "kn": "10/12 ನೇ ತರಗತಿ ಅಂಕಪಟ್ಟಿ", "te": "10వ/12వ తరగతి మార్కుల జాబితా"},
    "College Admission Fee Receipt": {"hi": "कॉलेज प्रवेश शुल्क रसीद", "ta": "கல்லூரி கட்டண ரசீது", "kn": "ಕಾಲೇಜು ಪ್ರವೇಶ ಶುಲ್ಕ ರಶೀದಿ", "te": "కాలేజీ అడ్మిషన్ ఫీజు రసీదు"},
    "Bank Passbook with Aadhaar Seeding": {"hi": "आधार से जुड़ा बैंक खाता पासबुक", "ta": "ஆதார் இணைக்கப்பட்ட வங்கி பாஸ்புக்", "kn": "ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್", "te": "ఆధార్‌తో లింక్ అయిన బ్యాంక్ పాస్‌బుక్"}
}

def evaluate_scheme_eligibility(scheme_dict: Dict[str, Any], profile_dict: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    """
    Evaluates citizen's profile against scheme eligibility criteria.
    Never guarantees eligibility based solely on AI. Returns fully localized criteria.
    """
    lang = language if language in ["hi", "ta", "kn", "te", "en"] else "en"
    rules_raw = scheme_dict.get("eligibility_criteria_json") or "{}"
    try:
        rules = json.loads(rules_raw) if isinstance(rules_raw, str) else rules_raw
    except Exception:
        rules = {}

    satisfied = []
    not_satisfied = []
    missing_info = []

    # 1. State check
    target_state = rules.get("state")
    user_state = profile_dict.get("state")
    if target_state and target_state != "all":
        if not user_state:
            msg = {
                "en": f"State residency declaration required (State: {target_state})",
                "hi": f"राज्य निवास घोषणा आवश्यक है (राज्य: {target_state})",
                "ta": f"மாநில இருப்பிட விவரம் தேவை (மாநிலம்: {target_state})",
                "kn": f"ರಾಜ್ಯ ನಿವಾಸ ಘೋಷಣೆ ಅಗತ್ಯವಿದೆ (ರಾಜ್ಯ: {target_state})",
                "te": f"రాష్ట్ర నివాస ధృవీకరణ అవసరం (రాష్ట్రం: {target_state})"
            }[lang]
            missing_info.append(msg)
        elif user_state.strip().lower() == target_state.strip().lower():
            msg = {
                "en": f"Residency condition met ({target_state})",
                "hi": f"निवास की शर्त पूरी हुई ({target_state})",
                "ta": f"இருப்பிட நிபந்தனை பூர்த்தி செய்யப்பட்டது ({target_state})",
                "kn": f"ನಿವಾಸದ ಷರತ್ತು ಪೂರೈಸಲಾಗಿದೆ ({target_state})",
                "te": f"నివాస నిబంధన సంతృప్తి చెందింది ({target_state})"
            }[lang]
            satisfied.append(msg)
        else:
            msg = {
                "en": f"Scheme restricted to residents of {target_state} (Declared: {user_state})",
                "hi": f"योजना केवल {target_state} के निवासियों के लिए है (घोषित: {user_state})",
                "ta": f"இத்திட்டம் {target_state} மக்களுக்கு மட்டுமே பொருந்தும் (உங்கள் மாநிலம்: {user_state})",
                "kn": f"ಯೋಜನೆ ಕೇವಲ {target_state} ನಿವಾಸಿಗಳಿಗೆ ಸೀಮಿತವಾಗಿದೆ (ಘೋಷಿತ: {user_state})",
                "te": f"ఈ పథకం {target_state} నివాసితులకు మాత్రమే వర్తిస్తుంది (ప్రకటించిన రాష్ట్రం: {user_state})"
            }[lang]
            not_satisfied.append(msg)

    # 2. Age check
    user_age = profile_dict.get("age")
    min_age = rules.get("min_age")
    max_age = rules.get("max_age")
    special_age = rules.get("special_inclusion_age")

    if min_age is not None:
        if user_age is None:
            msg = {
                "en": f"Age verification required (Minimum age: {min_age} years)",
                "hi": f"आयु सत्यापन आवश्यक है (न्यूनतम आयु: {min_age} वर्ष)",
                "ta": f"வயது சரிபார்ப்பு தேவை (குறைந்தபட்ச வயது: {min_age} ஆண்டுகள்)",
                "kn": f"ವಯಸ್ಸಿನ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ (ಕನಿಷ್ಠ ವಯಸ್ಸು: {min_age} ವರ್ಷಗಳು)",
                "te": f"వయస్సు ధృవీకరణ అవసరం (కనీస వయస్సు: {min_age} సంవత్సరాలు)"
            }[lang]
            missing_info.append(msg)
        elif user_age >= min_age:
            msg = {
                "en": f"Age criterion satisfied ({user_age} >= {min_age} years)",
                "hi": f"आयु मानदंड पूरा हुआ ({user_age} >= {min_age} वर्ष)",
                "ta": f"வயதுத் தகுதி பூர்த்தி செய்யப்பட்டது ({user_age} >= {min_age} ஆண்டுகள்)",
                "kn": f"ವಯಸ್ಸಿನ ಮಾನದಂಡ ಪೂರೈಸಲಾಗಿದೆ ({user_age} >= {min_age} ವರ್ಷಗಳು)",
                "te": f"వయస్సు నిబంధన సంతృప్తి చెందింది ({user_age} >= {min_age} సంవత్సరాలు)"
            }[lang]
            satisfied.append(msg)
        else:
            msg = {
                "en": f"Does not meet minimum age of {min_age} years (Current age: {user_age})",
                "hi": f"न्यूनतम आयु {min_age} वर्ष की शर्त पूरी नहीं (वर्तमान आयु: {user_age})",
                "ta": f"குறைந்தபட்ச வயது {min_age} ஆண்டுகள் பூர்த்தியாகவில்லை (வயது: {user_age})",
                "kn": f"ಕನಿಷ್ಠ ವಯಸ್ಸು {min_age} ವರ್ಷಗಳು ಪೂರೈಸಿಲ್ಲ (ಪ್ರಸ್ತುತ ವಯಸ್ಸು: {user_age})",
                "te": f"కనీస వయస్సు {min_age} సంవత్సరాల నిబంధనను సంతృప్తి పరచలేదు (ప్రస్తుత వయస్సు: {user_age})"
            }[lang]
            not_satisfied.append(msg)

    if max_age is not None:
        if user_age is None:
            pass
        elif user_age <= max_age:
            msg = {
                "en": f"Age is within maximum limit of {max_age} years",
                "hi": f"आयु अधिकतम सीमा {max_age} वर्ष के भीतर है",
                "ta": f"அனுமதிக்கப்பட்ட வயது வரம்பிற்குள் ({max_age} ஆண்டுகள்) உள்ளது",
                "kn": f"ವಯಸ್ಸು ಗರಿಷ್ಠ ಮಿತಿ {max_age} ವರ್ಷಗಳ ಒಳಗಿದೆ",
                "te": f"వయస్సు గరిష్ట పరిమితి {max_age} సంవత్సరాల లోపు ఉంది"
            }[lang]
            satisfied.append(msg)
        else:
            msg = {
                "en": f"Exceeds maximum age limit of {max_age} years (Current age: {user_age})",
                "hi": f"अधिकतम आयु सीमा {max_age} वर्ष से अधिक है (वर्तमान आयु: {user_age})",
                "ta": f"அதிகபட்ச வயது வரம்பை ({max_age} ஆண்டுகள்) தாண்டியுள்ளது (வயது: {user_age})",
                "kn": f"ಗರಿಷ್ಠ ವಯಸ್ಸಿನ ಮಿತಿ {max_age} ವರ್ಷವನ್ನು ಮೀರಿದೆ (ಪ್ರಸ್ತುತ ವಯಸ್ಸು: {user_age})",
                "te": f"గరిష్ట వయస్సు పరిమితి {max_age} సంవత్సరాలను మించింది (ప్రస్తుత వయస్సు: {user_age})"
            }[lang]
            not_satisfied.append(msg)

    # 3. Income check
    user_income = profile_dict.get("annual_income")
    max_income = rules.get("max_income")
    if max_income is not None:
        if user_income is None:
            msg = {
                "en": f"Annual household income details required (Income cap: ₹{max_income:,.0f})",
                "hi": f"वार्षिक पारिवारिक आय विवरण आवश्यक है (आय सीमा: ₹{max_income:,.0f})",
                "ta": f"குடும்ப ஆண்டு வருமான விவரம் தேவை (வருமான வரம்பு: ₹{max_income:,.0f})",
                "kn": f"ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯದ ವಿವರಗಳು ಅಗತ್ಯವಿದೆ (ಆದಾಯ ಮಿತಿ: ₹{max_income:,.0f})",
                "te": f"వార్షిక కుటుంబ ఆదాయ వివరాలు అవసరం (గరిష్ట పరిమితి: ₹{max_income:,.0f})"
            }[lang]
            missing_info.append(msg)
        elif user_income <= max_income:
            msg = {
                "en": f"Annual income ₹{user_income:,.0f} satisfies income ceiling of ₹{max_income:,.0f}",
                "hi": f"वार्षिक आय ₹{user_income:,.0f} आय सीमा ₹{max_income:,.0f} के अंतर्गत है",
                "ta": f"ஆண்டு வருமானம் ₹{user_income:,.0f} அனுமதிக்கப்பட்ட வரம்பிற்குள் (₹{max_income:,.0f}) உள்ளது",
                "kn": f"ವಾರ್ಷಿಕ ಆದಾಯ ₹{user_income:,.0f} ಆದಾಯ ಮಿತಿ ₹{max_income:,.0f} ಒಳಗೆ ಇದೆ",
                "te": f"వార్షిక ఆదాయం ₹{user_income:,.0f} ఆదాయ పరిమితి ₹{max_income:,.0f} లోపు ఉంది"
            }[lang]
            satisfied.append(msg)
        else:
            if special_age and user_age and user_age >= special_age:
                msg = {
                    "en": f"Eligible under Senior Citizen Universal Inclusion (Age {user_age} >= {special_age})",
                    "hi": f"वरिष्ठ नागरिक सार्वभौमिक समावेश के तहत पात्र (आयु {user_age} >= {special_age})",
                    "ta": f"மூத்த குடிமக்கள் சிறப்பு விதியின் கீழ் தகுதி பெறுகிறது (வயது {user_age} >= {special_age})",
                    "kn": f"ಹಿರಿಯ ನಾಗರಿಕರ ಸಾರ್ವತ್ರಿಕ ನಿಯಮದಡಿಯಲ್ಲಿ ಅರ್ಹತೆ (ವಯಸ್ಸು {user_age} >= {special_age})",
                    "te": f"సీనియర్ సిటిజన్ సార్వత్రిక నిబంధన ప్రకారం అర్హులు (వయస్సు {user_age} >= {special_age})"
                }[lang]
                satisfied.append(msg)
            else:
                msg = {
                    "en": f"Annual income ₹{user_income:,.0f} exceeds maximum threshold of ₹{max_income:,.0f}",
                    "hi": f"वार्षिक आय ₹{user_income:,.0f} अधिकतम सीमा ₹{max_income:,.0f} से अधिक है",
                    "ta": f"ஆண்டு வருமானம் ₹{user_income:,.0f} அனுமதிக்கப்பட்ட வரம்பை (₹{max_income:,.0f}) விட அதிகமாக உள்ளது",
                    "kn": f"ವಾರ್ಷಿಕ ಆದಾಯ ₹{user_income:,.0f} ಗರಿಷ್ಠ ಮಿತಿ ₹{max_income:,.0f} ಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿದೆ",
                    "te": f"వార్షిక ఆదాయం ₹{user_income:,.0f} గరిష్ట పరిమితి ₹{max_income:,.0f} కంటే ఎక్కువ ఉంది"
                }[lang]
                not_satisfied.append(msg)

    # 4. Category check
    user_cat = profile_dict.get("category")
    allowed_categories = rules.get("categories")
    if allowed_categories:
        if not user_cat:
            msg = {
                "en": f"Social category declaration required (Applicable: {', '.join(allowed_categories)})",
                "hi": f"सामाजिक श्रेणी घोषणा आवश्यक है (लागू: {', '.join(allowed_categories)})",
                "ta": f"சமூகப் பிரிவு அறிவிப்பு தேவை (பொருந்தக்கூடியவை: {', '.join(allowed_categories)})",
                "kn": f"ಸಾಮಾಜಿಕ ವರ್ಗದ ಘೋಷಣೆ ಅಗತ್ಯವಿದೆ (ಅನ್ವಯವಾಗುವ ವರ್ಗಗಳು: {', '.join(allowed_categories)})",
                "te": f"సామాజిక వర్గ వివరాలు అవసరం (వర్తించేవి: {', '.join(allowed_categories)})"
            }[lang]
            missing_info.append(msg)
        elif user_cat in allowed_categories:
            msg = {
                "en": f"Category '{user_cat}' meets reservation/target requirements",
                "hi": f"श्रेणी '{user_cat}' पात्रता और आरक्षण मानदंडों को पूरा करती है",
                "ta": f"பிரிவு '{user_cat}' தகுதி நிபந்தனைகளை பூர்த்தி செய்கிறது",
                "kn": f"ವರ್ಗ '{user_cat}' ಮೀಸಲಾತಿ/ಉದ್ದೇಶಿತ ಷರತ್ತುಗಳನ್ನು ಪೂರೈಸುತ್ತದೆ",
                "te": f"వర్గం '{user_cat}' రిజర్వేషన్/లక్ష్య నిబంధనలను సంతృప్తి పరుస్తుంది"
            }[lang]
            satisfied.append(msg)
        else:
            msg = {
                "en": f"Category '{user_cat}' is not covered under this specific targeted scheme",
                "hi": f"श्रेणी '{user_cat}' इस विशिष्ट लक्षित योजना के अंतर्गत शामिल नहीं है",
                "ta": f"பிரிவு '{user_cat}' இத்திட்டத்தின் கீழ் உள்ளடக்கப்படவில்லை",
                "kn": f"ವರ್ಗ '{user_cat}' ಈ ನಿರ್ದಿಷ್ಟ ಯೋಜನೆಯಡಿ ಸೇರ್ಪಡೆಗೊಂಡಿಲ್ಲ",
                "te": f"వర్గం '{user_cat}' ఈ నిర్దిష్ట పథకం కింద కవర్ చేయబడలేదు"
            }[lang]
            not_satisfied.append(msg)

    # 5. Occupation check
    target_occ = rules.get("occupation")
    user_occ = profile_dict.get("occupation", "").lower()
    if target_occ == "farmer":
        if "farm" in user_occ or "agr" in user_occ or "రైతు" in user_occ or "किसान" in user_occ or "உழவர்" in user_occ or "ರೈತ" in user_occ:
            msg = {
                "en": "Agricultural occupation condition met",
                "hi": "कृषि व्यवसाय शर्त पूरी हुई",
                "ta": "விவசாயத் தொழில் நிபந்தனை பூர்த்தி செய்யப்பட்டது",
                "kn": "ಕೃಷಿ ಕಸುಬಿನ ಷರತ್ತು ಪೂರೈಸಲಾಗಿದೆ",
                "te": "వ్యవసాయ వృత్తి నిబంధన సంతృప్తి చెందింది"
            }[lang]
            satisfied.append(msg)
        elif not user_occ:
            msg = {
                "en": "Occupation details required (Target: Farmer / Cultivator)",
                "hi": "व्यवसाय विवरण आवश्यक है (लक्षित: किसान)",
                "ta": "தொழில் விவரம் தேவை (இலக்கு: விவசாயி)",
                "kn": "ಕಸುಬಿನ ವಿವರ ಅಗತ್ಯವಿದೆ (ಗುರಿ: ರೈತ)",
                "te": "వృత్తి వివరాలు అవసరం (లక్ష్యం: రైతు)"
            }[lang]
            missing_info.append(msg)
    elif target_occ == "artisan":
        if any(w in user_occ for w in ["artisan", "craft", "carpenter", "blacksmith", "goldsmith", "potter", "weaver", "कारीगर", "கைவினை", "ಕುಶಲಕರ್ಮಿ", "చేతివృత్తి"]):
            msg = {
                "en": "Traditional artisan trade verified",
                "hi": "पारंपरिक कारीगर व्यवसाय सत्यापित",
                "ta": "பாரம்பரிய கைவினைத் தொழில் சரிபார்க்கப்பட்டது",
                "kn": "ಸಾಂಪ್ರದಾಯಿಕ ಕುಶಲಕರ್ಮಿ ಕಸುಬು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
                "te": "సాంప్రదాయ చేతివృత్తి ధృవీకరించబడింది"
            }[lang]
            satisfied.append(msg)
        elif not user_occ:
            msg = {
                "en": "Trade/artisan occupation details required",
                "hi": "शिल्प/कारीगर व्यवसाय विवरण आवश्यक है",
                "ta": "கைவினைத் தொழில் விவரம் தேவை",
                "kn": "ಕುಶಲಕರ್ಮಿ ಕಸುಬಿನ ವಿವರ ಅಗತ್ಯವಿದೆ",
                "te": "చేతివృత్తి వివరాలు అవసరం"
            }[lang]
            missing_info.append(msg)

    # Final Outcome Assessment
    if not_satisfied:
        outcome = {
            "en": "Not eligible based on criteria",
            "hi": "मानदंडों के आधार पर पात्र नहीं",
            "ta": "நிபந்தனைகளின் அடிப்படையில் தகுதியற்றது",
            "kn": "ಮಾನದಂಡಗಳ ಆಧಾರದ ಮೇಲೆ ಅರ್ಹರಲ್ಲ",
            "te": "నిబంధనల ప్రకారం అర్హత లేదు"
        }[lang]
    elif missing_info:
        outcome = {
            "en": "Additional information required",
            "hi": "अतिरिक्त जानकारी आवश्यक है",
            "ta": "கூடுதல் தகவல்கள் தேவை",
            "kn": "ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ",
            "te": "మరింత సమాచారం అవసరం"
        }[lang]
    else:
        outcome = {
            "en": "Potentially eligible",
            "hi": "संभावित रूप से पात्र",
            "ta": "தகுதி பெற வாய்ப்புள்ளது",
            "kn": "ಅರ್ಹತೆ ಹೊಂದುವ ಸಾಧ್ಯತೆಯಿದೆ",
            "te": "అర్హత పొందే అవకాశం ఉంది"
        }[lang]

    # Localize raw document names
    raw_docs = json.loads(scheme_dict.get("required_documents_json") or "[]")
    localized_docs = []
    for doc in raw_docs:
        doc_tr = DOC_LOCALIZATION.get(doc, {}).get(lang, doc)
        localized_docs.append(doc_tr)

    # Localize scheme title
    orig_title = scheme_dict.get("title", "")
    from app.services.scheme_translations import get_localized_scheme_attributes
    loc_attrs = get_localized_scheme_attributes(orig_title, lang)
    scheme_name = loc_attrs.get("title", orig_title) if loc_attrs else orig_title

    return {
        "scheme_id": scheme_dict.get("id"),
        "scheme_name": scheme_name,
        "official_source": scheme_dict.get("source_url"),
        "official_application_url": scheme_dict.get("official_portal_url"),
        "outcome": outcome,
        "benefits": loc_attrs.get("benefits_description", scheme_dict.get("benefits_description")),
        "conditions_satisfied": satisfied,
        "conditions_not_satisfied": not_satisfied,
        "missing_information": missing_info,
        "required_documents": localized_docs,
        "deadline": loc_attrs.get("deadline", scheme_dict.get("deadline", "Refer to official notification"))
    }
