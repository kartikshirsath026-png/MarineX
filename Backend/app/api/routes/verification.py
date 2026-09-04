from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.models import Detection, Verification


router = APIRouter(
    prefix="/api/verification",
    tags=["Human Verification"]
)


class VerificationRequest(BaseModel):
    status: str
    remarks: str | None = None
    verified_by: int | None = None


@router.post("/{detection_id}")
def verify_detection(
    detection_id: int,
    verification: VerificationRequest
):
    db: Session = SessionLocal()

    try:
        # Validate verification status
        allowed_statuses = ["confirmed", "rejected", "uncertain"]

        if verification.status.lower() not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Status must be confirmed, rejected, or uncertain"
            )

        # Find detection
        detection = (
            db.query(Detection)
            .filter(Detection.id == detection_id)
            .first()
        )

        if not detection:
            raise HTTPException(
                status_code=404,
                detail="Detection not found"
            )

        # Create verification record
        new_verification = Verification(
            detection_id=detection_id,
            status=verification.status.lower(),
            remarks=verification.remarks,
            verified_by=verification.verified_by
        )

        db.add(new_verification)

        # Update detection priority/status logic
        if verification.status.lower() == "confirmed":
            detection.priority = "high"

        elif verification.status.lower() == "rejected":
            detection.priority = "low"

        db.commit()
        db.refresh(new_verification)

        return {
            "success": True,
            "message": "Detection verification saved",
            "verification_id": new_verification.id,
            "detection_id": detection_id,
            "status": new_verification.status,
            "remarks": new_verification.remarks,
            "priority": detection.priority
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()


@router.get("/{detection_id}")
def get_verification(detection_id: int):
    db: Session = SessionLocal()

    try:
        detection = (
            db.query(Detection)
            .filter(Detection.id == detection_id)
            .first()
        )

        if not detection:
            raise HTTPException(
                status_code=404,
                detail="Detection not found"
            )

        verifications = (
            db.query(Verification)
            .filter(Verification.detection_id == detection_id)
            .all()
        )

        return {
            "success": True,
            "detection_id": detection_id,
            "verifications": [
                {
                    "verification_id": v.id,
                    "status": v.status,
                    "remarks": v.remarks,
                    "verified_by": v.verified_by,
                    "created_at": v.created_at
                }
                for v in verifications
            ]
        }

    finally:
        db.close()