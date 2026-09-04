import os
import cv2

from app.database.connection import SessionLocal
from app.models.models import Scan
from app.services.ai.detector import MarineXDetector
from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor


SCAN_ID = 5


db = SessionLocal()

try:
    # ---------------------------------------------------------
    # 1. Get uploaded scan from database
    # ---------------------------------------------------------
    scan = db.query(Scan).filter(Scan.id == SCAN_ID).first()

    if not scan:
        raise Exception(f"Scan with ID {SCAN_ID} was not found.")

    print("=" * 70)
    print("MarineX Uploaded Scan - YOLO Preprocessing Test")
    print("=" * 70)

    print(f"Scan ID   : {scan.id}")
    print(f"Scan name : {scan.scan_name}")
    print(f"DB path   : {scan.image_path}")

    # ---------------------------------------------------------
    # 2. Build actual uploaded image path
    # ---------------------------------------------------------
    backend_dir = os.path.dirname(os.path.abspath(__file__))

    image_path = os.path.join(
        backend_dir,
        scan.image_path
    )

    print()
    print("Original image:")
    print(image_path)

    if not os.path.exists(image_path):
        raise FileNotFoundError(
            f"Uploaded image not found: {image_path}"
        )

    print("Original uploaded image exists: YES")

    # ---------------------------------------------------------
    # 3. Create processed output path
    # ---------------------------------------------------------
    processed_directory = os.path.join(
        backend_dir,
        "uploads",
        "processed"
    )

    os.makedirs(
        processed_directory,
        exist_ok=True
    )

    original_filename = os.path.basename(image_path)

    name_without_extension = os.path.splitext(
        original_filename
    )[0]

    processed_filename = (
        name_without_extension +
        "_processed.png"
    )

    processed_path = os.path.join(
        processed_directory,
        processed_filename
    )

    print()
    print("Processed image:")
    print(processed_path)

    # ---------------------------------------------------------
    # 4. Run preprocessing
    # ---------------------------------------------------------
    preprocessor = SonarPreprocessor(
        denoise=False,
        clahe=True,
        sharpen=False
    )

    result = preprocessor.preprocess(
        image_path,
        processed_path
    )

    print()
    print("-" * 70)
    print("PREPROCESSING")
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

    print(
        f"Processed file exists: "
        f"{os.path.exists(processed_path)}"
    )

    # ---------------------------------------------------------
    # 5. Load YOLO detector
    # ---------------------------------------------------------
    detector = MarineXDetector()

    detector.load_model()

    print()
    print("-" * 70)
    print("YOLO MODEL LOADED")
    print("-" * 70)

    # ---------------------------------------------------------
    # 6. Test ORIGINAL image
    # ---------------------------------------------------------
    print()
    print("-" * 70)
    print("YOLO RESULT - ORIGINAL IMAGE")
    print("-" * 70)

    original_results = detector.predict(
        image_path
    )

    print(
        f"Detection count: "
        f"{len(original_results)}"
    )

    for index, detection in enumerate(
        original_results,
        start=1
    ):
        print(
            f"{index}. "
            f"{detection['object_class']} "
            f"| confidence="
            f"{detection['confidence']:.4f} "
            f"| bbox=("
            f"{detection['x_min']:.2f}, "
            f"{detection['y_min']:.2f}, "
            f"{detection['x_max']:.2f}, "
            f"{detection['y_max']:.2f}"
            f")"
        )

    # ---------------------------------------------------------
    # 7. Test PROCESSED image
    # ---------------------------------------------------------
    print()
    print("-" * 70)
    print("YOLO RESULT - PREPROCESSED IMAGE")
    print("-" * 70)

    processed_results = detector.predict(
        processed_path
    )

    print(
        f"Detection count: "
        f"{len(processed_results)}"
    )

    for index, detection in enumerate(
        processed_results,
        start=1
    ):
        print(
            f"{index}. "
            f"{detection['object_class']} "
            f"| confidence="
            f"{detection['confidence']:.4f} "
            f"| bbox=("
            f"{detection['x_min']:.2f}, "
            f"{detection['y_min']:.2f}, "
            f"{detection['x_max']:.2f}, "
            f"{detection['y_max']:.2f}"
            f")"
        )

    # ---------------------------------------------------------
    # 8. Compare results
    # ---------------------------------------------------------
    print()
    print("=" * 70)
    print("COMPARISON")
    print("=" * 70)

    print(
        f"Original detections    : "
        f"{len(original_results)}"
    )

    print(
        f"Preprocessed detections: "
        f"{len(processed_results)}"
    )

    if (
        len(original_results) > 0
        and len(processed_results) > 0
    ):
        print(
            "RESULT: YOLO detected objects "
            "on both original and preprocessed images."
        )

    elif (
        len(original_results) > 0
        and len(processed_results) == 0
    ):
        print(
            "RESULT: Preprocessing caused "
            "the detection to disappear."
        )

    elif (
        len(original_results) == 0
        and len(processed_results) > 0
    ):
        print(
            "RESULT: Preprocessing produced "
            "a detection that was not present originally."
        )

    else:
        print(
            "RESULT: No detections on either image."
        )

    print("=" * 70)
    print("Uploaded scan YOLO preprocessing test completed.")
    print("=" * 70)

finally:
    db.close()