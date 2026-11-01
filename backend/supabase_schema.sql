-- ====================================================================
-- CivicConnect Supabase PostgreSQL Production Schema
-- Complete Multilingual Citizen Governance Platform
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen',
    department TEXT,
    jurisdiction TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Citizen Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender TEXT,
    state TEXT,
    district TEXT,
    annual_income NUMERIC(14, 2),
    education TEXT,
    employment_status TEXT,
    category TEXT,
    disability_status TEXT,
    occupation TEXT,
    digilocker_connected INTEGER NOT NULL DEFAULT 0,
    digilocker_uri TEXT,
    verified_via_digilocker INTEGER NOT NULL DEFAULT 0,
    consent_given INTEGER NOT NULL DEFAULT 0,
    consent_timestamp TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DigiLocker Documents Table
CREATE TABLE IF NOT EXISTS digilocker_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    doc_name TEXT NOT NULL,
    doc_id TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date TEXT,
    verified INTEGER NOT NULL DEFAULT 1,
    extracted_data_json TEXT,
    consent_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Official Policy & Welfare Schemes Table
CREATE TABLE IF NOT EXISTS policy_announcements (
    id BIGSERIAL PRIMARY KEY,
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
    retrieval_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Civic Grievances Table
CREATE TABLE IF NOT EXISTS grievances (
    id BIGSERIAL PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Medium',
    ai_suggested_severity TEXT,
    ai_severity_confidence REAL,
    status TEXT NOT NULL DEFAULT 'Submitted',
    is_official_complaint INTEGER NOT NULL DEFAULT 1,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    landmark TEXT,
    department TEXT NOT NULL,
    assigned_officer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    image_url TEXT,
    audio_url TEXT,
    voice_transcription TEXT,
    cv_analysis_json TEXT,
    duplicate_of_id BIGINT REFERENCES grievances(id) ON DELETE SET NULL,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    resolution_notes TEXT,
    resolution_image_url TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Grievance Votes Table
CREATE TABLE IF NOT EXISTS grievance_votes (
    id BIGSERIAL PRIMARY KEY,
    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL DEFAULT 'up',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_grievance_user_vote UNIQUE (grievance_id, user_id)
);

-- 7. Grievance Comments Table
CREATE TABLE IF NOT EXISTS grievance_comments (
    id BIGSERIAL PRIMARY KEY,
    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES grievance_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Grievance Audit Trail Table
CREATE TABLE IF NOT EXISTS grievance_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    grievance_id BIGINT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Government Service Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    portal_name TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    official_tracking_url TEXT,
    form_data_json TEXT,
    agent_telemetry_json TEXT,
    receipt_url TEXT,
    user_authorized INTEGER NOT NULL DEFAULT 0,
    authorization_timestamp TIMESTAMPTZ,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_action TEXT
);

-- 10. Fact & Deepfake Verifications Table
CREATE TABLE IF NOT EXISTS verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. System Audit Logs Table
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    details_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_dept ON grievances(department);
CREATE INDEX IF NOT EXISTS idx_grievances_ticket ON grievances(ticket_number);
CREATE INDEX IF NOT EXISTS idx_policies_cat ON policy_announcements(category);
CREATE INDEX IF NOT EXISTS idx_verifications_token ON verifications(share_token);
