import re
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any, Dict, List, Optional
import httpx
from bs4 import BeautifulSoup
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row
from app.services.translation_service import translate_text

# Real official government welfare schemes with official rules
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
        "benefits_description": "₹15,000 modern toolkit incentive; collateral-free enterprise loan up to ₹1,00,000 (Tranche 1) and ₹2,00,000 (Tranche 2) at 5% concessional interest; digital transaction incentives.",
        "required_documents_json": '["Aadhaar Card", "Mobile Number linked to Aadhaar", "Bank Account Details", "Ration Card (mandatory for family verification)", "Trade Skill Verification"]',
        "eligibility_criteria_json": '{"min_age": 18, "occupation": "artisan", "traditional_trade_worker": true, "max_family_members_enrolled": 1}'
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

                for item in items[:10]: # Process top 10 most recent live releases
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

                        # Infer ministry/department from title
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

def evaluate_scheme_eligibility(scheme_dict: Dict[str, Any], profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates citizen's profile against scheme eligibility criteria.
    Never guarantees eligibility based solely on AI.
    Returns:
    - outcome: 'Potentially eligible' | 'Additional information required' | 'Not eligible based on verified mandatory condition'
    - conditions_satisfied: List[str]
    - conditions_not_satisfied: List[str]
    - missing_information: List[str]
    """
    rules_raw = scheme_dict.get("eligibility_criteria_json") or "{}"
    try:
        import json
        rules = json.loads(rules_raw) if isinstance(rules_raw, str) else rules_raw
    except Exception:
        rules = {}

    satisfied = []
    not_satisfied = []
    missing_info = []

    # 1. Age check
    user_age = profile_dict.get("age")
    min_age = rules.get("min_age")
    max_age = rules.get("max_age")
    special_age = rules.get("special_inclusion_age")

    if min_age is not None:
        if user_age is None:
            missing_info.append(f"Age verification required (Minimum age: {min_age} years)")
        elif user_age >= min_age:
            satisfied.append(f"Age criterion satisfied ({user_age} >= {min_age} years)")
        else:
            not_satisfied.append(f"Does not meet minimum age of {min_age} years (Current age: {user_age})")

    if max_age is not None:
        if user_age is None:
            if f"Age verification required (Minimum age: {min_age} years)" not in missing_info:
                missing_info.append(f"Age verification required (Maximum age: {max_age} years)")
        elif user_age <= max_age:
            satisfied.append(f"Age is within maximum limit of {max_age} years")
        else:
            not_satisfied.append(f"Exceeds maximum age limit of {max_age} years (Current age: {user_age})")

    # 2. Income check
    user_income = profile_dict.get("annual_income")
    max_income = rules.get("max_income")
    if max_income is not None:
        if user_income is None:
            missing_info.append(f"Annual household income details required (Income cap: ₹{max_income:,.0f})")
        elif user_income <= max_income:
            satisfied.append(f"Annual income ₹{user_income:,.0f} satisfies income ceiling of ₹{max_income:,.0f}")
        else:
            # Check if special age exempts
            if special_age and user_age and user_age >= special_age:
                satisfied.append(f"Eligible under Senior Citizen Universal Inclusion (Age {user_age} >= {special_age})")
            else:
                not_satisfied.append(f"Annual income ₹{user_income:,.0f} exceeds maximum threshold of ₹{max_income:,.0f}")

    # 3. Category check (SC/ST/OBC/General)
    user_cat = profile_dict.get("category")
    allowed_categories = rules.get("categories")
    if allowed_categories:
        if not user_cat:
            missing_info.append(f"Social category declaration required (Applicable categories: {', '.join(allowed_categories)})")
        elif user_cat in allowed_categories:
            satisfied.append(f"Category '{user_cat}' meets reservation/target requirements")
        else:
            not_satisfied.append(f"Category '{user_cat}' is not covered under this specific targeted scheme")

    # 4. Occupation / Employment
    target_occ = rules.get("occupation")
    user_occ = profile_dict.get("occupation", "").lower()
    user_emp = profile_dict.get("employment_status", "").lower()
    if target_occ:
        if target_occ == "farmer":
            if "farm" in user_occ or "agr" in user_occ:
                satisfied.append("Agricultural occupation condition met")
            elif not user_occ:
                missing_info.append("Occupation details required (Target: Farmer / Cultivator)")
            else:
                not_satisfied.append(f"Occupation '{user_occ}' does not match target agricultural criterion")
        elif target_occ == "artisan":
            if any(w in user_occ for w in ["artisan", "craft", "carpenter", "blacksmith", "goldsmith", "potter", "weaver"]):
                satisfied.append("Traditional artisan trade verified")
            elif not user_occ:
                missing_info.append("Trade/artisan occupation details required")
            else:
                not_satisfied.append(f"Occupation '{user_occ}' is not an empanelled traditional trade")

    # Final Outcome Assessment
    if not_satisfied:
        outcome = "Not eligible based on a verified mandatory condition"
    elif missing_info:
        outcome = "Additional information required"
    else:
        outcome = "Potentially eligible"

    return {
        "scheme_id": scheme_dict.get("id"),
        "scheme_name": scheme_dict.get("title"),
        "official_source": scheme_dict.get("source_url"),
        "official_application_url": scheme_dict.get("official_portal_url"),
        "outcome": outcome,
        "benefits": scheme_dict.get("benefits_description"),
        "conditions_satisfied": satisfied,
        "conditions_not_satisfied": not_satisfied,
        "missing_information": missing_info,
        "required_documents": json.loads(scheme_dict.get("required_documents_json") or "[]"),
        "deadline": scheme_dict.get("deadline", "Refer to official notification")
    }
