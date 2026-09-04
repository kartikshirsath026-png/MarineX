from app.services.ai.detector import MarineXDetector
from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor
import os


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

CONFIDENCE_THRESHOLD = 0.25

image_names = [
    "marine_marine-debris-aris3k-1009.png",
    "marine_marine-debris-aris3k-1081.png",
    "marine_marine-debris-aris3k-1056.png",
    "marine_marine-debris-aris3k-1176.png",
    "marine_marine-debris-aris3k-12.png",
]


# ---------------------------------------------------------
# Helper function
# ---------------------------------------------------------

def run_yolo_with_threshold(detector, image_path, confidence_threshold):

    results = detector.model(
        image_path,
        conf=confidence_threshold,
        verbose=False
    )

    detections = []

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            coordinates = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = detector.model.names[class_id]

            detections.append({
                "object_class": class_name,
                "confidence": confidence,
                "x_min": coordinates[0],
                "y_min": coordinates[1],
                "x_max": coordinates[2],
                "y_max": coordinates[3]
            })

    return detections


# ---------------------------------------------------------
# Setup
# ---------------------------------------------------------

detector = MarineXDetector()
detector.load_model()

preprocessor = SonarPreprocessor(
    denoise=False,
    clahe=True,
    sharpen=False
)


# ---------------------------------------------------------
# Header
# ---------------------------------------------------------

print()
print("=" * 80)
print("MarineX - Controlled Preprocessing Comparison")
print("=" * 80)

print()
print(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")
print("Pipeline: grayscale -> CLAHE -> normalization")
print("Gaussian blur: DISABLED")
print()


# ---------------------------------------------------------
# Process every image
# ---------------------------------------------------------

for image_name in image_names:

    original_path = os.path.join(
        "dataset",
        "images",
        image_name
    )

    processed_name = (
        os.path.splitext(image_name)[0]
        + "_processed_no_blur.png"
    )

    processed_path = os.path.join(
        "dataset",
        "images",
        "processed",
        processed_name
    )

    print()
    print("-" * 80)
    print(f"IMAGE: {image_name}")
    print("-" * 80)

    # Check original image
    if not os.path.exists(original_path):

        print(f"ERROR: Original image not found:")
        print(original_path)
        continue

    # Create processed image
    if not os.path.exists(processed_path):

        print("Creating processed image...")

        preprocessor.preprocess(
            original_path,
            processed_path
        )

        print("Processed image created.")

    # Original prediction
    original_detections = run_yolo_with_threshold(
        detector,
        original_path,
        CONFIDENCE_THRESHOLD
    )

    # Processed prediction
    processed_detections = run_yolo_with_threshold(
        detector,
        processed_path,
        CONFIDENCE_THRESHOLD
    )

    # -----------------------------------------------------
    # Original results
    # -----------------------------------------------------

    print()
    print("Original:")

    if len(original_detections) == 0:

        print("  No detections")

    else:

        for detection in original_detections:

            print(
                f"  {detection['object_class']} "
                f"({detection['confidence']:.4f})"
            )

    # -----------------------------------------------------
    # Processed results
    # -----------------------------------------------------

    print()
    print("Preprocessed:")

    if len(processed_detections) == 0:

        print("  No detections")

    else:

        for detection in processed_detections:

            print(
                f"  {detection['object_class']} "
                f"({detection['confidence']:.4f})"
            )

    # -----------------------------------------------------
    # Count comparison
    # -----------------------------------------------------

    print()
    print(
        f"Detection count: "
        f"{len(original_detections)} -> "
        f"{len(processed_detections)}"
    )


# ---------------------------------------------------------
# Finished
# ---------------------------------------------------------

print()
print("=" * 80)
print("All controlled preprocessing tests completed.")
print("=" * 80)