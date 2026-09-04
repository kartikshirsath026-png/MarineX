from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os

from app.database.connection import SessionLocal
from app.models.models import Scan, Detection
from app.services.ai.detector import detector
from app.services.preprocessing.sonar_preprocessor import (
    preprocess_sonar_image
)


router = APIRouter(
    prefix="/api/detections",
    tags=["AI Detections"]
)


class DetectionRequest(BaseModel):
    object_class: str
    confidence: float

    x_min: float | None = None
    y_min: float | None = None
    x_max: float | None = None
    y_max: float | None = None

    priority: str | None = None


def calculate_priority(confidence: float) -> str:
    """
    Prototype priority calculation based on
    detection confidence.
    """

    if confidence >= 0.85:
        return "high"

    elif confidence >= 0.60:
        return "medium"

    return "low"


@router.post("/{scan_id}")
def create_detection(
    scan_id: int,
    detection: DetectionRequest
):
    db: Session = SessionLocal()

    try:

        scan = (
            db.query(Scan)
            .filter(Scan.id == scan_id)
            .first()
        )

        if not scan:
            raise HTTPException(
                status_code=404,
                detail="Scan not found"
            )

        if detection.priority:
            priority = detection.priority
        else:
            priority = calculate_priority(
                detection.confidence
            )

        new_detection = Detection(
            scan_id=scan_id,
            object_class=detection.object_class,
            confidence=detection.confidence,
            x_min=detection.x_min,
            y_min=detection.y_min,
            x_max=detection.x_max,
            y_max=detection.y_max,
            priority=priority
        )

        db.add(new_detection)
        db.commit()
        db.refresh(new_detection)

        return {
            "success": True,
            "message": "AI detection stored successfully",
            "detection_id": new_detection.id,
            "scan_id": scan_id,
            "object_class": new_detection.object_class,
            "confidence": new_detection.confidence,
            "priority": new_detection.priority
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


@router.post("/analyze/{scan_id}")
def analyze_scan_with_ai(scan_id: int):
    """
    MarineX AI pipeline:

    Original Sonar Image
            |
            +----> YOLO Detection
            |
            +----> Sonar Preprocessing
                         |
                         +----> Enhanced Image

    YOLO intentionally runs on the ORIGINAL image.
    The enhanced image is used as visual evidence
    for analysis and human verification.
    """

    db: Session = SessionLocal()

    try:

        # --------------------------------------------------
        # 1. FIND SCAN
        # --------------------------------------------------

        scan = (
            db.query(Scan)
            .filter(Scan.id == scan_id)
            .first()
        )

        if not scan:
            raise HTTPException(
                status_code=404,
                detail="Scan not found"
            )

        # --------------------------------------------------
        # 2. BUILD ABSOLUTE IMAGE PATH
        # --------------------------------------------------

        backend_dir = os.path.dirname(
            os.path.dirname(
                os.path.dirname(
                    os.path.dirname(
                        os.path.abspath(__file__)
                    )
                )
            )
        )

        image_path = os.path.join(
            backend_dir,
            scan.image_path
        )

        # --------------------------------------------------
        # 3. CHECK ORIGINAL IMAGE
        # --------------------------------------------------

        if not os.path.exists(image_path):
            raise HTTPException(
                status_code=404,
                detail=f"Sonar image not found: {image_path}"
            )

        # --------------------------------------------------
        # 4. CREATE ENHANCED SONAR IMAGE
        # --------------------------------------------------

        preprocessing_result = (
            preprocess_sonar_image(image_path)
        )

        processed_path = (
            preprocessing_result["processed_path"]
        )

        # --------------------------------------------------
        # 5. REMOVE OLD AI DETECTIONS
        # --------------------------------------------------
        # Prevent duplicate detections if the user
        # clicks Analyze more than once.

        db.query(Detection).filter(
            Detection.scan_id == scan_id
        ).delete(
            synchronize_session=False
        )

        db.flush()

        # --------------------------------------------------
        # 6. RUN YOLO ON ORIGINAL IMAGE
        # --------------------------------------------------

        ai_results = detector.predict(
            image_path
        )

        saved_detections = []

        # --------------------------------------------------
        # 7. STORE YOLO DETECTIONS
        # --------------------------------------------------

        for result in ai_results:

            confidence = result["confidence"]

            priority = calculate_priority(
                confidence
            )

            new_detection = Detection(
                scan_id=scan_id,
                object_class=result["object_class"],
                confidence=confidence,
                x_min=result["x_min"],
                y_min=result["y_min"],
                x_max=result["x_max"],
                y_max=result["y_max"],
                priority=priority
            )

            db.add(new_detection)
            db.flush()

            saved_detections.append({
                "detection_id": new_detection.id,
                "object_class": result["object_class"],
                "confidence": confidence,
                "priority": priority,
                "bounding_box": {
                    "x_min": result["x_min"],
                    "y_min": result["y_min"],
                    "x_max": result["x_max"],
                    "y_max": result["y_max"]
                }
            })

        # --------------------------------------------------
        # 8. UPDATE SCAN STATUS
        # --------------------------------------------------

        scan.status = "ai_analyzed"

        db.commit()

        # --------------------------------------------------
        # 9. RETURN RESULTS
        # --------------------------------------------------

        return {
            "success": True,
            "message": "AI analysis completed",

            "scan_id": scan_id,

            "total_detections": len(
                saved_detections
            ),

            "detections": saved_detections,

            "preprocessing": {
                "applied": True,
                "operations": (
                    preprocessing_result["operations"]
                ),
                "enhanced_image_available": True,
                "processed_image": processed_path
            },

            "ai_pipeline": [
                "Original sonar image",
                "Sonar preprocessing",
                "YOLO detection on original image",
                "Confidence-based priority",
                "PostgreSQL storage",
                "Human verification"
            ]
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


@router.get("/{scan_id}")
def get_detections(scan_id: int):

    db: Session = SessionLocal()

    try:

        scan = (
            db.query(Scan)
            .filter(Scan.id == scan_id)
            .first()
        )

        if not scan:
            raise HTTPException(
                status_code=404,
                detail="Scan not found"
            )

        detections = (
            db.query(Detection)
            .filter(
                Detection.scan_id == scan_id
            )
            .all()
        )

        return {
            "success": True,
            "scan_id": scan_id,
            "total_detections": len(
                detections
            ),

            "detections": [
                {
                    "detection_id": d.id,
                    "object_class": d.object_class,
                    "confidence": d.confidence,

                    "bounding_box": {
                        "x_min": d.x_min,
                        "y_min": d.y_min,
                        "x_max": d.x_max,
                        "y_max": d.y_max
                    },

                    "priority": d.priority
                }

                for d in detections
            ]
        }

    finally:
        db.close()