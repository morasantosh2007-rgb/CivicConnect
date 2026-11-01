import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
UPLOAD_DIR = BASE_DIR.parent / "uploads"

# Load the project-root environment file regardless of the current directory.
load_dotenv(BASE_DIR.parent / ".env")

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "CivicConnect"
    PROJECT_DESCRIPTION: str = "Multilingual Citizen Governance Platform"
    PROJECT_SLOGAN: str = "Your Rights. Your Voice. Your Government."
    PROJECT_SUPPORTING: str = "Understand government. Access your benefits. Make your community better."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    BASE_DIR: Path = BASE_DIR
    DATABASE_PATH: Path = DATA_DIR / "civicconnect.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    UPLOAD_DIR: Path = UPLOAD_DIR

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "civicconnect-secret-key-prod-2026-secure-token-salt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AI & Services
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # DigiLocker Partner Credentials (MeitY Partner Program)
    DIGILOCKER_CLIENT_ID: str = os.getenv("DIGILOCKER_CLIENT_ID", "")
    DIGILOCKER_CLIENT_SECRET: str = os.getenv("DIGILOCKER_CLIENT_SECRET", "")
    DIGILOCKER_REDIRECT_URI: str = os.getenv("DIGILOCKER_REDIRECT_URI", "http://localhost:5173/profile?digilocker_callback=true")
    DIGILOCKER_AUTH_URL: str = "https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize"
    DIGILOCKER_TOKEN_URL: str = "https://digilocker.meripehchaan.gov.in/public/oauth2/1/token"
    DIGILOCKER_DOC_URL: str = "https://digilocker.meripehchaan.gov.in/public/oauth2/1/xml"

    # Official PIB & Government RSS Feeds
    PIB_RSS_PRESS_RELEASES: str = "https://pib.gov.in/RssMain.aspx?ModId=6"
    PIB_RSS_FACT_CHECK: str = "https://pib.gov.in/RssFactCheck.aspx"
    MYSCHEME_PORTAL_URL: str = "https://www.myscheme.gov.in/"
    DATA_GOV_IN_URL: str = "https://data.gov.in/"

    # Supported Languages
    SUPPORTED_LANGUAGES: List[str] = ["en", "te", "hi", "ta", "kn"]
    DEFAULT_LANGUAGE: str = "en"

    # Roles
    ROLES: List[str] = [
        "citizen",
        "municipal_officer",
        "department_admin",
        "platform_admin"
    ]

    # Grievance Categories
    GRIEVANCE_CATEGORIES: List[str] = [
        "Potholes",
        "Road cracks",
        "Damaged roads",
        "Water leakage",
        "Waterlogging",
        "Drainage problems",
        "Garbage accumulation",
        "Overflowing dustbins",
        "Broken streetlights",
        "Damaged bridges",
        "Open manholes",
        "Fallen trees",
        "Electrical hazards",
        "Other infrastructure"
    ]

    # Department Mappings
    DEPARTMENT_MAPPINGS = {
        "Potholes": "Public Works & Roads Department",
        "Road cracks": "Public Works & Roads Department",
        "Damaged roads": "Public Works & Roads Department",
        "Damaged bridges": "Public Works & Roads Department",
        "Water leakage": "Municipal Water Supply & Sewerage Board",
        "Waterlogging": "Stormwater Drainage & Flood Control",
        "Drainage problems": "Stormwater Drainage & Flood Control",
        "Open manholes": "Stormwater Drainage & Flood Control",
        "Garbage accumulation": "Sanitation & Solid Waste Management",
        "Overflowing dustbins": "Sanitation & Solid Waste Management",
        "Broken streetlights": "Electrical & Public Lighting Authority",
        "Electrical hazards": "Electrical & Public Lighting Authority",
        "Fallen trees": "Urban Forestry & Parks Division",
        "Other infrastructure": "General Municipal Administration"
    }

settings = Settings()
