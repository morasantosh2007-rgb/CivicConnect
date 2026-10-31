import pytest
import asyncio
import secrets
import os
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import init_db, get_db_connection
from app.services.pib_ingestion import seed_benchmark_schemes

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()
    asyncio.run(seed_benchmark_schemes())

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "CivicConnect"
    assert "Your Rights. Your Voice. Your Government." in data["slogan"]

    health_res = client.get(f"{settings.API_V1_STR}/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

def test_auth_workflow():
    test_email = f"citizen.{secrets.token_hex(4)}@civicconnect.in"
    # Register Citizen
    signup_payload = {
        "email": test_email,
        "password": "SecurePassword123!",
        "full_name": "Ramesh Sharma",
        "role": "citizen",
        "preferred_language": "hi",
        "phone": "+91 9876543210"
    }
    reg_res = client.post(f"{settings.API_V1_STR}/auth/register", json=signup_payload)
    assert reg_res.status_code == 200
    token_data = reg_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Login
    login_res = client.post(f"{settings.API_V1_STR}/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200

    # Profile Update
    headers = {"Authorization": f"Bearer {token}"}
    profile_payload = {
        "age": 34,
        "gender": "Male",
        "state": "Telangana",
        "district": "Hyderabad",
        "annual_income": 240000.0,
        "education": "Graduate",
        "employment_status": "Self-employed",
        "category": "OBC",
        "occupation": "Artisan"
    }
    prof_res = client.put(f"{settings.API_V1_STR}/auth/profile", json=profile_payload, headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["profile"]["annual_income"] == 240000.0

def test_policy_and_scheme_matching():
    # List policies
    res = client.get(f"{settings.API_V1_STR}/policies/?language=en")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data

    # Check Scheme Eligibility
    check_payload = {
        "age": 25,
        "annual_income": 180000.0,
        "category": "OBC",
        "employment_status": "student",
        "state": "Telangana"
    }
    elig_res = client.post(f"{settings.API_V1_STR}/policies/check-eligibility", json=check_payload)
    assert elig_res.status_code == 200
    results = elig_res.json()["results"]
    assert len(results) > 0
    for r in results:
        assert "outcome" in r
        assert "official_source" in r
        assert "conditions_satisfied" in r

def test_grievance_submission_and_community_feed():
    # Register Citizen for grievance
    email = f"civicuser.{secrets.token_hex(4)}@civicconnect.in"
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Priya Nair",
        "role": "citizen"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit Grievance
    form_data = {
        "title": "Severe road cavity and water leakage near bus station",
        "description": "Large deep pothole creating hazard for two-wheelers and pedestrians on Main Ring Road.",
        "category": "Potholes",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "address": "MG Road, Ward 14",
        "landmark": "Near Bus Depot",
        "is_official_complaint": "true"
    }
    res = client.post(f"{settings.API_V1_STR}/grievances/", data=form_data, headers=headers)
    assert res.status_code == 200
    g_data = res.json()
    assert g_data["status"] == "success"
    grievance = g_data["grievance"]
    g_id = grievance["id"]
    assert grievance["department"] == "Public Works & Roads Department"
    assert grievance["severity"] in ["Low", "Medium", "High", "Critical"]

    # Upvote grievance
    vote_res = client.post(f"{settings.API_V1_STR}/grievances/{g_id}/vote", headers=headers)
    assert vote_res.status_code == 200
    assert vote_res.json()["upvoted"] is True

    # Comment on grievance
    comment_res = client.post(f"{settings.API_V1_STR}/grievances/{g_id}/comments", json={
        "content": "Confirming this issue. Traffic was backed up today morning."
    }, headers=headers)
    assert comment_res.status_code == 200

    # Fetch community feed
    feed_res = client.get(f"{settings.API_V1_STR}/grievances/")
    assert feed_res.status_code == 200
    assert feed_res.json()["total"] > 0

    # Map locations
    map_res = client.get(f"{settings.API_V1_STR}/grievances/map/locations")
    assert map_res.status_code == 200
    assert len(map_res.json()) > 0

def test_autonomous_bureaucracy_agent_workflow():
    # Service catalog
    cat_res = client.get(f"{settings.API_V1_STR}/services/catalog")
    assert cat_res.status_code == 200
    services = cat_res.json()
    assert len(services) > 0

    # Register Citizen
    email = f"agentuser.{secrets.token_hex(4)}@civicconnect.in"
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Suresh Reddy",
        "role": "citizen"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Initiate draft application
    init_res = client.post(f"{settings.API_V1_STR}/services/initiate", json={
        "service_id": "pm-surya-ghar",
        "service_name": "PM Surya Ghar Rooftop Solar Application",
        "portal_name": "National Portal for Rooftop Solar"
    }, headers=headers)
    assert init_res.status_code == 200
    app_data = init_res.json()
    assert app_data["status"] == "Awaiting User Approval"
    app_id = app_data["application_id"]

    # Step 2: Citizen Explicit Approval Checkpoint
    appr_res = client.post(f"{settings.API_V1_STR}/services/approve", json={
        "application_id": app_id,
        "approved": True
    }, headers=headers)
    assert appr_res.status_code == 200
    sub_data = appr_res.json()
    assert sub_data["status"] == "Submitted"
    assert "reference_number" in sub_data
    assert "receipt_url" in sub_data

    # Step 3: My Applications Tracking
    my_apps = client.get(f"{settings.API_V1_STR}/services/my-applications", headers=headers)
    assert my_apps.status_code == 200
    assert my_apps.json()["total"] >= 1

def test_fact_verification_pipeline():
    v_email = f"factuser.{secrets.token_hex(4)}@civicconnect.in"
    reg_res = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": v_email,
        "password": "Password123!",
        "full_name": "Fact Check User",
        "role": "citizen"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    claim_payload = {
        "claim_text": "Government announced PM Surya Ghar Muft Bijli Yojana giving subsidy for rooftop solar",
        "media_type": "text"
    }
    res = client.post(f"{settings.API_V1_STR}/verification/verify", json=claim_payload, headers=headers)
    assert res.status_code == 200
    verif = res.json()
    assert verif["verdict"] in ["Verified", "Contradicted", "Misleading / Missing Context", "Insufficient Evidence"]
    assert "citations" in verif
    assert "share_token" in verif

def test_digilocker_honest_adapter():
    res = client.get(f"{settings.API_V1_STR}/digilocker/status")
    assert res.status_code == 200
    status_data = res.json()
    assert "status" in status_data
    assert "supported_documents" in status_data

def test_public_accountability_analytics():
    res = client.get(f"{settings.API_V1_STR}/admin/analytics")
    assert res.status_code == 200
    analytics = res.json()
    assert "total_grievances" in analytics
    assert "resolution_rate_percent" in analytics
    assert "department_distribution" in analytics
