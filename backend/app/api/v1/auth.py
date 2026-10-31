from datetime import datetime
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.database import get_db_connection, dict_from_row
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut, ProfileUpdate, PasswordReset

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    existing = cursor.execute("SELECT id FROM users WHERE email = ?", (user_in.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )

    now = datetime.utcnow().isoformat()
    hashed_pwd = hash_password(user_in.password)

    cursor.execute("""
        INSERT INTO users (
            email, password_hash, full_name, role, department, jurisdiction, preferred_language, phone, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_in.email,
        hashed_pwd,
        user_in.full_name,
        user_in.role if user_in.role in settings.ROLES else "citizen",
        user_in.department,
        user_in.jurisdiction,
        user_in.preferred_language if user_in.preferred_language in settings.SUPPORTED_LANGUAGES else "en",
        user_in.phone,
        now,
        now
    ))
    user_id = cursor.lastrowid

    # Create associated empty profile
    cursor.execute("""
        INSERT INTO profiles (
            user_id, consent_given, consent_timestamp, updated_at
        ) VALUES (?, 1, ?, ?)
    """, (user_id, now, now))

    conn.commit()

    user_row = cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    user_dict = dict_from_row(user_row)
    del user_dict["password_hash"]

    token = create_access_token({"sub": user_dict["email"], "role": user_dict["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()

    user_row = cursor.execute("SELECT * FROM users WHERE email = ? AND is_active = 1", (login_in.email,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_dict = dict_from_row(user_row)
    if not verify_password(login_in.password, user_dict["password_hash"]):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    conn.close()
    del user_dict["password_hash"]

    token = create_access_token({"sub": user_dict["email"], "role": user_dict["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    profile_row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (current_user["id"],)).fetchone()
    conn.close()

    profile = dict_from_row(profile_row) if profile_row else {}
    user_clean = current_user.copy()
    user_clean.pop("password_hash", None)

    return {
        "user": user_clean,
        "profile": profile
    }

@router.put("/profile")
def update_profile(profile_in: ProfileUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    cursor.execute("""
        UPDATE profiles
        SET age = COALESCE(?, age),
            gender = COALESCE(?, gender),
            state = COALESCE(?, state),
            district = COALESCE(?, district),
            annual_income = COALESCE(?, annual_income),
            education = COALESCE(?, education),
            employment_status = COALESCE(?, employment_status),
            category = COALESCE(?, category),
            disability_status = COALESCE(?, disability_status),
            occupation = COALESCE(?, occupation),
            consent_given = 1,
            consent_timestamp = ?,
            updated_at = ?
        WHERE user_id = ?
    """, (
        profile_in.age,
        profile_in.gender,
        profile_in.state,
        profile_in.district,
        profile_in.annual_income,
        profile_in.education,
        profile_in.employment_status,
        profile_in.category,
        profile_in.disability_status,
        profile_in.occupation,
        now,
        now,
        current_user["id"]
    ))
    conn.commit()

    profile_row = cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (current_user["id"],)).fetchone()
    conn.close()
    return {"status": "success", "profile": dict_from_row(profile_row)}

@router.post("/reset-password")
def reset_password(reset_in: PasswordReset):
    conn = get_db_connection()
    cursor = conn.cursor()

    user_row = cursor.execute("SELECT id FROM users WHERE email = ?", (reset_in.email,)).fetchone()
    if not user_row:
        conn.close()
        # Return generic message to avoid email enumeration
        return {"status": "success", "message": "If an account exists, the password has been successfully reset."}

    new_hashed = hash_password(reset_in.new_password)
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?", (new_hashed, now, reset_in.email))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Password reset successfully. You may now log in with your new credentials."}

@router.put("/language")
def set_language(language: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    if language not in settings.SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Language '{language}' is not supported.")
    
    conn = get_db_connection()
    conn.execute("UPDATE users SET preferred_language = ?, updated_at = ? WHERE id = ?", (
        language, datetime.utcnow().isoformat(), current_user["id"]
    ))
    conn.commit()
    conn.close()
    return {"status": "success", "preferred_language": language}
