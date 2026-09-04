from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.connection import engine, Base
from app.models.models import User, Scan, Detection, Verification
from app.api.routes.scans import router as scans_router
from app.api.routes.detections import router as detections_router
from app.api.routes.verification import router as verification_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.reports import router as reports_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dataset import router as dataset_router



Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="MarineX API",
    description="AI-Powered Underwater Marine Debris and Anomaly Detection System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(scans_router)
app.include_router(detections_router)
app.include_router(verification_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(auth_router)
app.include_router(dataset_router)


@app.get("/")
def root():
    return {
        "message": "MarineX Backend is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }