import os

from app.database.connection import SessionLocal
from app.models.models import Scan
from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

SCAN_ID = 5


# ---------------------------------------------------------
# Database
# ---------------------------------------------------------

db = SessionLocal()

try:

    # -----------------------------------------------------
    # Find scan
    # -----------------------------------------------------

    scan = (
        db.query(Scan)
        .filter(Scan.id == SCAN_ID)
        .first()
    )

    if not scan:
        raise Exception(
            f"Scan with ID {SCAN_ID} was not found."
        )

    print()
    print("=" * 70)
    print("MarineX Uploaded Scan Preprocessing Test")
    print("=" * 70)

    print()
    print(f"Scan ID   : {scan.id}")
    print(f"Scan name : {scan.scan_name}")
    print(f"DB path   : {scan.image_path}")

    # -----------------------------------------------------
    # Build absolute path
    # -----------------------------------------------------

    backend_dir = os.path.dirname(
        os.path.abspath(__file__)
    )

    image_path = os.path.join(
        backend_dir,
        scan.image_path
    )

    print()
    print(f"Image path:")
    print(image_path)

    # -----------------------------------------------------
    # Check image
    # -----------------------------------------------------

    if not os.path.exists(image_path):

        raise FileNotFoundError(
            f"Uploaded image not found: {image_path}"
        )

    print()
    print("Original uploaded image exists: YES")

    # -----------------------------------------------------
    # Processed output
    # -----------------------------------------------------

    processed_directory = os.path.join(
        backend_dir,
        "uploads",
        "processed"
    )

    os.makedirs(
        processed_directory,
        exist_ok=True
    )

    original_filename = os.path.basename(
        image_path
    )

    name_without_extension = os.path.splitext(
        original_filename
    )[0]

    processed_filename = (
        name_without_extension
        + "_processed.png"
    )

    processed_path = os.path.join(
        processed_directory,
        processed_filename
    )

    print()
    print("Processed output:")
    print(processed_path)

    # -----------------------------------------------------
    # Preprocessing
    # -----------------------------------------------------

    preprocessor = SonarPreprocessor(
        denoise=False,
        clahe=True,
        sharpen=False
    )

    result = preprocessor.preprocess(
        image_path,
        processed_path
    )

    # -----------------------------------------------------
    # Results
    # -----------------------------------------------------

    print()
    print("-" * 70)
    print("PREPROCESSING RESULT")
    print("-" * 70)

    print(
        f"Original size  : "
        f"{result['original_width']} x "
        f"{result['original_height']}"
    )

    print(
        f"Processed size : "
        f"{result['processed_width']} x "
        f"{result['processed_height']}"
    )

    print(
        f"Operations     : "
        f"{', '.join(result['operations'])}"
    )

    print()
    print(
        "Processed file exists: "
        f"{os.path.exists(processed_path)}"
    )

    print()
    print("=" * 70)
    print("Uploaded scan preprocessing test completed.")
    print("=" * 70)


finally:

    db.close()