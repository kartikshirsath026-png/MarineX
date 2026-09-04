from fastapi import APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import SessionLocal
from app.models.models import Scan, Detection, Verification

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats():

    db: Session = SessionLocal()

    try:
        # Total scans
        total_scans = db.query(Scan).count()

        # Total detections
        total_detections = db.query(Detection).count()

        # Marine debris
        marine_debris = db.query(Detection).filter(
            Detection.object_class.in_([
                "ghost_net",
                "fishing_gear",
                "large_man_made_debris",
                "marine_debris"
            ])
        ).count()

        # Marine life
        marine_life = db.query(Detection).filter(
            Detection.object_class.in_([
                "fish",
                "shark",
                "marine_life"
            ])
        ).count()

        # Unknown anomalies
        unknown_anomalies = db.query(Detection).filter(
            Detection.object_class.in_([
                "unknown",
                "unknown_anomaly"
            ])
        ).count()

        # High priority detections
        high_priority = db.query(Detection).filter(
            Detection.priority == "high"
        ).count()

        # Recent scans
        recent_scans = (
            db.query(Scan)
            .order_by(Scan.created_at.desc())
            .limit(5)
            .all()
        )

        return {
            "success": True,
            "statistics": {
                "total_scans": total_scans,
                "total_detections": total_detections,
                "marine_debris": marine_debris,
                "marine_life": marine_life,
                "unknown_anomalies": unknown_anomalies,
                "high_priority": high_priority
            },
            "recent_scans": [
                {
                    "scan_id": scan.id,
                    "scan_name": scan.scan_name,
                    "latitude": scan.latitude,
                    "longitude": scan.longitude,
                    "depth": scan.depth,
                    "status": scan.status,
                    "created_at": scan.created_at
                }
                for scan in recent_scans
            ]
        }

    finally:
        db.close()