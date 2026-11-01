import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import get_db_connection, init_db
from app.services.pib_ingestion import seed_benchmark_schemes, fetch_live_pib_releases

# API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.policies import router as policies_router
from app.api.v1.grievances import router as grievances_router
from app.api.v1.admin import router as admin_router
from app.api.v1.services_agent import router as services_router
from app.api.v1.verification import router as verification_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.digilocker import router as digilocker_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed Official Data
    print("[CivicConnect Backend] Initializing database...")
    init_db()
    print("[CivicConnect Backend] Seeding benchmark official government schemes...")
    await seed_benchmark_schemes()
    # Asynchronously fetch live PIB releases in background
    asyncio.create_task(fetch_live_pib_releases())
    yield
    print("[CivicConnect Backend] Shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.PROJECT_DESCRIPTION} - {settings.PROJECT_SLOGAN}",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware for Frontend Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads (Evidence Images, Audio, Receipts, Forensics)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(policies_router, prefix=settings.API_V1_STR)
app.include_router(grievances_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(services_router, prefix=settings.API_V1_STR)
app.include_router(verification_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)
app.include_router(digilocker_router, prefix=settings.API_V1_STR)

@app.get("/")
def root_status():
    return {
        "platform": settings.PROJECT_NAME,
        "slogan": settings.PROJECT_SLOGAN,
        "supporting": settings.PROJECT_SUPPORTING,
        "version": settings.VERSION,
        "status": "operational",
        "api_documentation": "/docs"
    }

@app.get(f"{settings.API_V1_STR}/health")
def healthcheck():
    conn = get_db_connection()
    try:
        conn.execute("SELECT 1")
    finally:
        conn.close()

    database = (
        "supabase_postgresql"
        if settings.DATABASE_URL.startswith(("postgres://", "postgresql://"))
        else "sqlite_wal_active"
    )
    return {
        "status": "healthy",
        "database": database,
        "supported_languages": settings.SUPPORTED_LANGUAGES,
        "pib_ingestion": "active",
        "computer_vision": "active",
        "browser_agent": "ready",
        "fact_audit": "active"
    }
