import sqlite3
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.core.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def dict_from_row(row: sqlite3.Row) -> Dict[str, Any]:
    return {k: row[k] for k in row.keys()}

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'citizen',
        department TEXT,
        jurisdiction TEXT,
        preferred_language TEXT NOT NULL DEFAULT 'en',
        phone TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Citizen Profiles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        age INTEGER,
        gender TEXT,
        state TEXT,
        district TEXT,
        annual_income REAL,
        education TEXT,
        employment_status TEXT,
        category TEXT,
        disability_status TEXT,
        occupation TEXT,
        digilocker_connected INTEGER NOT NULL DEFAULT 0,
        digilocker_uri TEXT,
        verified_via_digilocker INTEGER NOT NULL DEFAULT 0,
        consent_given INTEGER NOT NULL DEFAULT 0,
        consent_timestamp TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # DigiLocker Documents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS digilocker_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        doc_type TEXT NOT NULL,
        doc_name TEXT NOT NULL,
        doc_id TEXT NOT NULL,
        issuer TEXT NOT NULL,
        issue_date TEXT,
        verified INTEGER NOT NULL DEFAULT 1,
        extracted_data_json TEXT,
        consent_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # Official Policy & Announcements Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS policy_announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        publication_date TEXT NOT NULL,
        source_url TEXT NOT NULL,
        issuing_authority TEXT NOT NULL,
        original_text TEXT NOT NULL,
        summary_en TEXT NOT NULL,
        summary_te TEXT,
        summary_hi TEXT,
        summary_ta TEXT,
        summary_kn TEXT,
        affected_citizens TEXT,
        category TEXT,
        deadline TEXT,
        official_portal_url TEXT,
        is_scheme INTEGER NOT NULL DEFAULT 0,
        eligibility_criteria_json TEXT,
        benefits_description TEXT,
        required_documents_json TEXT,
        retrieval_timestamp TEXT NOT NULL
    );
    """)

    # Grievances Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS grievances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'Medium',
        ai_suggested_severity TEXT,
        ai_severity_confidence REAL,
        status TEXT NOT NULL DEFAULT 'Submitted',
        is_official_complaint INTEGER NOT NULL DEFAULT 1,
        latitude REAL,
        longitude REAL,
        address TEXT,
        landmark TEXT,
        department TEXT NOT NULL,
        assigned_officer_id INTEGER,
        image_url TEXT,
        audio_url TEXT,
        voice_transcription TEXT,
        cv_analysis_json TEXT,
        duplicate_of_id INTEGER,
        upvotes_count INTEGER NOT NULL DEFAULT 0,
        resolution_notes TEXT,
        resolution_image_url TEXT,
        resolved_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_officer_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (duplicate_of_id) REFERENCES grievances (id) ON DELETE SET NULL
    );
    """)

    # Grievance Votes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS grievance_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grievance_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        vote_type TEXT NOT NULL DEFAULT 'up',
        created_at TEXT NOT NULL,
        UNIQUE (grievance_id, user_id),
        FOREIGN KEY (grievance_id) REFERENCES grievances (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # Grievance Comments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS grievance_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grievance_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        parent_comment_id INTEGER,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (grievance_id) REFERENCES grievances (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_comment_id) REFERENCES grievance_comments (id) ON DELETE CASCADE
    );
    """)

    # Grievance Audit Trail Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS grievance_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grievance_id INTEGER NOT NULL,
        actor_id INTEGER,
        action TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT,
        notes TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (grievance_id) REFERENCES grievances (id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
    );
    """)

    # Government Service Applications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service_name TEXT NOT NULL,
        portal_name TEXT NOT NULL,
        reference_number TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Draft',
        official_tracking_url TEXT,
        form_data_json TEXT,
        agent_telemetry_json TEXT,
        receipt_url TEXT,
        user_authorized INTEGER NOT NULL DEFAULT 0,
        authorization_timestamp TEXT,
        applied_at TEXT NOT NULL,
        last_checked_at TEXT NOT NULL,
        next_action TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # Fact & Deepfake Verifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        claim_text TEXT NOT NULL,
        source_url TEXT,
        media_url TEXT,
        media_type TEXT NOT NULL DEFAULT 'text',
        verdict TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        extracted_claims_json TEXT NOT NULL,
        explanation TEXT NOT NULL,
        citations_json TEXT NOT NULL,
        forensic_report_json TEXT,
        share_token TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # System Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        ip_address TEXT,
        details_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database schema successfully initialized.")
