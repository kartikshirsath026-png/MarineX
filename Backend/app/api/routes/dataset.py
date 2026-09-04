import csv
import os

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
import mimetypes
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.models import Scan


router = APIRouter(
    prefix="/api/dataset",
    tags=["Dataset"]
)


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.abspath(__file__)
            )
        )
    )
)

METADATA_FILE = os.path.join(
    BASE_DIR,
    "dataset",
    "metadata.csv"
)


def optional_float(value):
    """
    Convert metadata value to float.
    Return None if the value is empty.
    """
    if value is None or str(value).strip() == "":
        return None

    try:
        return float(value)
    except ValueError:
        return None


@router.get("/scans")
def get_dataset_scans():

    if not os.path.exists(METADATA_FILE):
        raise HTTPException(
            status_code=404,
            detail="metadata.csv not found"
        )

    scans = []

    try:

        with open(
            METADATA_FILE,
            mode="r",
            encoding="utf-8"
        ) as file:

            reader = csv.DictReader(file)

            for index, row in enumerate(reader, start=1):

                image_name = row["image_name"]

                image_path = os.path.join(
                    BASE_DIR,
                    "dataset",
                    "images",
                    image_name
                )

                scans.append({
                    "dataset_id": index,
                    "image_name": image_name,
                    "scan_name": row["scan_name"],

                    "latitude": optional_float(
                        row.get("latitude")
                    ),

                    "longitude": optional_float(
                        row.get("longitude")
                    ),

                    "depth": optional_float(
                        row.get("depth")
                    ),

                    "timestamp": row.get("timestamp") or None,

                    "image_available": os.path.exists(
                        image_path
                    )
                })

        return {
            "success": True,
            "total_scans": len(scans),
            "scans": scans
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not read dataset: {str(e)}"
        )


@router.post("/analyze/{dataset_id}")
def analyze_dataset_scan(
    dataset_id: int,
    db: Session = Depends(get_db)
):

    if not os.path.exists(METADATA_FILE):
        raise HTTPException(
            status_code=404,
            detail="metadata.csv not found"
        )

    selected_scan = None

    try:

        with open(
            METADATA_FILE,
            mode="r",
            encoding="utf-8"
        ) as file:

            reader = csv.DictReader(file)

            for index, row in enumerate(
                reader,
                start=1
            ):

                if index == dataset_id:
                    selected_scan = row
                    break

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not read dataset: {str(e)}"
        )

    if selected_scan is None:

        raise HTTPException(
            status_code=404,
            detail="Dataset scan not found"
        )

    image_name = selected_scan["image_name"]

    image_path = os.path.join(
        BASE_DIR,
        "dataset",
        "images",
        image_name
    )

    # Make sure the actual image exists
    if not os.path.exists(image_path):

        raise HTTPException(
            status_code=404,
            detail=f"Dataset image not found: {image_name}"
        )

    existing_scan = (
        db.query(Scan)
        .filter(
            Scan.scan_name ==
            selected_scan["scan_name"]
        )
        .first()
    )

    if existing_scan:

        return {
            "success": True,
            "message": "Dataset scan already loaded",
            "scan_id": existing_scan.id,
            "scan_name": existing_scan.scan_name
        }

    new_scan = Scan(

        scan_name=selected_scan["scan_name"],

        image_path=os.path.join(
            "dataset",
            "images",
            image_name
        ),

        latitude=optional_float(
            selected_scan.get("latitude")
        ),

        longitude=optional_float(
            selected_scan.get("longitude")
        ),

        depth=optional_float(
            selected_scan.get("depth")
        ),

        status="dataset_loaded"
    )

    db.add(new_scan)

    db.commit()

    db.refresh(new_scan)

    return {

        "success": True,

        "message":
            "Dataset scan loaded successfully",

        "scan_id":
            new_scan.id,

        "scan_name":
            new_scan.scan_name,

        "image_name":
            image_name,

        "latitude":
            new_scan.latitude,

        "longitude":
            new_scan.longitude,

        "depth":
            new_scan.depth
    }


@router.get("/image/{dataset_id}")
def get_dataset_image(dataset_id: int):
    if not os.path.exists(METADATA_FILE):
        raise HTTPException(
            status_code=404,
            detail="metadata.csv not found"
        )

    selected_scan = None

    try:
        with open(
            METADATA_FILE,
            mode="r",
            encoding="utf-8"
        ) as file:

            reader = csv.DictReader(file)

            for index, row in enumerate(reader, start=1):
                if index == dataset_id:
                    selected_scan = row
                    break

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read dataset: {str(e)}"
        )

    if selected_scan is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset scan not found"
        )

    image_path = os.path.join(
        BASE_DIR,
        "dataset",
        "images",
        selected_scan["image_name"]
    )

    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=404,
            detail="Dataset image not found"
        )

    media_type = mimetypes.guess_type(image_path)[0]

    return FileResponse(
        image_path,
        media_type=media_type or "application/octet-stream"
    )