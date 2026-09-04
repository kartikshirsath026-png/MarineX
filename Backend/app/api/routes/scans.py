import os
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.models import Scan, Detection
import mimetypes
from fastapi.responses import FileResponse
from app.database.connection import get_db


router = APIRouter(
    prefix="/api/scans",
    tags=["Scans"]
)


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_scan(
    scan_name: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    depth: Optional[float] = Form(None),
    file: UploadFile = File(...)
):
    db: Session = SessionLocal()

    try:
        # Check file type
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]

        file_extension = os.path.splitext(file.filename)[1].lower()

        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Upload a sonar image."
            )

        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        safe_filename = f"{timestamp}_{file.filename}"

        file_path = os.path.join(
            UPLOAD_DIR,
            safe_filename
        )

        # Save image
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create database record
        new_scan = Scan(
            scan_name=scan_name,
            image_path=file_path,
            latitude=latitude,
            longitude=longitude,
            depth=depth,
            scan_timestamp=datetime.now(),
            status="uploaded"
        )

        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)

        return {
            "success": True,
            "message": "Sonar scan uploaded successfully",
            "scan_id": new_scan.id,
            "scan_name": new_scan.scan_name,
            "image_path": new_scan.image_path,
            "latitude": new_scan.latitude,
            "longitude": new_scan.longitude,
            "depth": new_scan.depth,
            "status": new_scan.status
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


@router.get("/history")
def get_scan_history():
    db: Session = SessionLocal()

    try:
        scans = (
            db.query(Scan)
            .order_by(Scan.created_at.desc())
            .all()
        )

        result = []

        for scan in scans:
            detection_count = (
                db.query(Detection)
                .filter(Detection.scan_id == scan.id)
                .count()
            )

            high_priority_count = (
                db.query(Detection)
                .filter(
                    Detection.scan_id == scan.id,
                    Detection.priority == "high"
                )
                .count()
            )

            result.append({
                "scan_id": scan.id,
                "scan_name": scan.scan_name,
                "latitude": scan.latitude,
                "longitude": scan.longitude,
                "depth": scan.depth,
                "status": scan.status,
                "created_at": scan.created_at,
                "total_detections": detection_count,
                "high_priority_detections": high_priority_count
            })

        return {
            "success": True,
            "total_scans": len(result),
            "scans": result
        }

    finally:
        db.close()


@router.get("/{scan_id}")
def get_scan_details(scan_id: int):
    db: Session = SessionLocal()

    try:
        # Find scan
        scan = db.query(Scan).filter(Scan.id == scan_id).first()

        if not scan:
            raise HTTPException(
                status_code=404,
                detail="Scan not found"
            )

        # Find detections for this scan
        detections = (
            db.query(Detection)
            .filter(Detection.scan_id == scan_id)
            .all()
        )

        return {
            "success": True,
            "scan": {
                "scan_id": scan.id,
                "scan_name": scan.scan_name,
                "image_path": scan.image_path,
                "latitude": scan.latitude,
                "longitude": scan.longitude,
                "depth": scan.depth,
                "scan_timestamp": scan.scan_timestamp,
                "status": scan.status,
                "created_at": scan.created_at
            },
            "detections": [
                {
                    "detection_id": detection.id,
                    "object_class": detection.object_class,
                    "confidence": detection.confidence,
                    "bounding_box": {
                        "x_min": detection.x_min,
                        "y_min": detection.y_min,
                        "x_max": detection.x_max,
                        "y_max": detection.y_max
                    },
                    "priority": detection.priority
                }
                for detection in detections
            ]
        }

    finally:
        db.close()


@router.get("/{scan_id}/image")
def get_scan_image(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()

    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )

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

    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image not found: {image_path}"
        )

    media_type = mimetypes.guess_type(image_path)[0]

    return FileResponse(
        image_path,
        media_type=media_type or "application/octet-stream"
    )