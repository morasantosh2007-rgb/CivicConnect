from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = "citizen"
    department: Optional[str] = None
    jurisdiction: Optional[str] = None
    preferred_language: str = "en"
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department: Optional[str]
    jurisdiction: Optional[str]
    preferred_language: str
    phone: Optional[str]
    created_at: str

class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    annual_income: Optional[float] = None
    education: Optional[str] = None
    employment_status: Optional[str] = None
    category: Optional[str] = None
    disability_status: Optional[str] = None
    occupation: Optional[str] = None
    consent_given: bool = True

class PasswordReset(BaseModel):
    email: str
    new_password: str = Field(..., min_length=6)

# --- Grievance Schemas ---
class GrievanceCreate(BaseModel):
    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=10)
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    landmark: Optional[str] = None
    is_official_complaint: bool = True
    voice_transcription: Optional[str] = None

class GrievanceStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    assigned_officer_id: Optional[int] = None
    department: Optional[str] = None
    severity: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_image_url: Optional[str] = None

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    parent_comment_id: Optional[int] = None

# --- Policy & Scheme Schemas ---
class SchemeEligibilityCheck(BaseModel):
    age: Optional[int] = None
    annual_income: Optional[float] = None
    state: Optional[str] = None
    district: Optional[str] = None
    education: Optional[str] = None
    category: Optional[str] = None
    disability_status: Optional[str] = None
    employment_status: Optional[str] = None

class TextToSpeechRequest(BaseModel):
    text: str
    language: str = "en"

# --- Fact Verification Schemas ---
class VerificationRequest(BaseModel):
    claim_text: str = Field(..., min_length=5)
    source_url: Optional[str] = None
    media_url: Optional[str] = None
    media_type: str = "text"

# --- Assistant Chat Schema ---
class AssistantMessage(BaseModel):
    message: str
    language: str = "en"
    context: Optional[str] = None

# --- Browser Agent Application Schemas ---
class ServiceApplicationRequest(BaseModel):
    service_id: str
    service_name: str
    portal_name: str
    custom_inputs: Optional[Dict[str, Any]] = None

class ServiceApprovalRequest(BaseModel):
    application_id: int
    approved: bool
    user_signature: Optional[str] = None
