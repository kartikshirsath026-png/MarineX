from app.services.ai.detector import MarineXDetector
from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor
import os


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

CONFIDENCE_THRESHOLD = 0.25

original_image = os.path.join(
    "dataset",
    "images",
    "marine_marine-debris-aris3k-1009.png"
)

processed_image = os.path.join(
    "dataset",
    "images",
    "processed",
    "propeller_processed_no_blur.png"
)


# ---------------------------------------------------------
# Helper function
# ---------------------------------------------------------

def run_yolo_with_threshold(detector, image_path, confidence_threshold):
    """
    Run the existing YOLO model with an explicit confidence threshold.
    """

    if detector.model is None:
        detector.load_model()

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
# Create preprocessing
# ---------------------------------------------------------

preprocessor = SonarPreprocessor(
    denoise=False,
    clahe=True,
    sharpen=False
)


# ---------------------------------------------------------
# Make sure processed image exists
# ---------------------------------------------------------

if not os.path.exists(original_image):
    raise FileNotFoundError(
        f"Original image not found: {original_image}"
    )


if not os.path.exists(processed_image):

    print("Processed image does not exist.")
    print("Creating it now...")

    preprocessor.preprocess(
        original_image,
        processed_image
    )

    print("Processed image created.")


# ---------------------------------------------------------
# Load YOLO
# ---------------------------------------------------------

detector = MarineXDetector()
detector.load_model()


# ---------------------------------------------------------
# Run YOLO
# ---------------------------------------------------------

print()
print("=" * 70)
print("MarineX Controlled Confidence Threshold Test")
print("=" * 70)

print()
print(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")

print()
print("Original image:")
print(original_image)

print()
print("Processed image:")
print(processed_image)


# Original
original_detections = run_yolo_with_threshold(
    detector,
    original_image,
    CONFIDENCE_THRESHOLD
)


# Processed
processed_detections = run_yolo_with_threshold(
    detector,
    processed_image,
    CONFIDENCE_THRESHOLD
)


# ---------------------------------------------------------
# Display original results
# ---------------------------------------------------------

print()
print("-" * 70)
print("ORIGINAL IMAGE RESULTS")
print("-" * 70)

print(f"Detection count: {len(original_detections)}")

for i, detection in enumerate(original_detections, start=1):

    print(
        f"{i}. "
        f"{detection['object_class']} | "
        f"confidence = {detection['confidence']:.4f}"
    )


# ---------------------------------------------------------
# Display processed results
# ---------------------------------------------------------

print()
print("-" * 70)
print("PREPROCESSED IMAGE RESULTS")
print("-" * 70)

print(f"Detection count: {len(processed_detections)}")

for i, detection in enumerate(processed_detections, start=1):

    print(
        f"{i}. "
        f"{detection['object_class']} | "
        f"confidence = {detection['confidence']:.4f}"
    )


# ---------------------------------------------------------
# Comparison
# ---------------------------------------------------------

print()
print("=" * 70)
print("COMPARISON")
print("=" * 70)

print(
    f"Original detections   : "
    f"{len(original_detections)}"
)

print(
    f"Processed detections  : "
    f"{len(processed_detections)}"
)

print()

if len(processed_detections) > len(original_detections):

    print("Result: processed image produced more detections.")

elif len(processed_detections) < len(original_detections):

    print("Result: processed image produced fewer detections.")

else:

    print("Result: both images produced the same number of detections.")


print()
print("Controlled threshold test completed.")