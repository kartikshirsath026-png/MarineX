import os

from app.services.ai.detector import MarineXDetector
from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

IMAGE_DIRECTORY = os.path.join(
    BACKEND_DIR,
    "dataset",
    "images"
)

PROCESSED_DIRECTORY = os.path.join(
    BACKEND_DIR,
    "dataset",
    "images",
    "processed"
)

os.makedirs(
    PROCESSED_DIRECTORY,
    exist_ok=True
)


# ---------------------------------------------------------
# Test images
# ---------------------------------------------------------

IMAGE_NAMES = [
    "marine_marine-debris-aris3k-1009.png",
    "marine_marine-debris-aris3k-1081.png",
    "marine_marine-debris-aris3k-1056.png",
    "marine_marine-debris-aris3k-1176.png",
    "marine_marine-debris-aris3k-12.png",
]


# ---------------------------------------------------------
# Initialize preprocessing
# ---------------------------------------------------------

preprocessor = SonarPreprocessor(
    denoise=False,
    clahe=True,
    sharpen=False
)


# ---------------------------------------------------------
# Initialize YOLO
# ---------------------------------------------------------

detector = MarineXDetector()

print("=" * 80)
print("MarineX - Batch Preprocessing + YOLO Comparison")
print("=" * 80)

print()
print("Loading YOLO model...")

detector.load_model()

print("YOLO model loaded successfully.")

print()


# ---------------------------------------------------------
# Results
# ---------------------------------------------------------

all_results = []


# ---------------------------------------------------------
# Process every image
# ---------------------------------------------------------

for image_name in IMAGE_NAMES:

    print("-" * 80)
    print(f"IMAGE: {image_name}")
    print("-" * 80)

    original_path = os.path.join(
        IMAGE_DIRECTORY,
        image_name
    )

    processed_name = (
        os.path.splitext(image_name)[0]
        + "_processed.png"
    )

    processed_path = os.path.join(
        PROCESSED_DIRECTORY,
        processed_name
    )

    # -----------------------------------------------------
    # Check original image
    # -----------------------------------------------------

    if not os.path.exists(original_path):

        print("ERROR: Original image not found.")
        print(original_path)

        continue

    print(f"Original: {original_path}")

    # -----------------------------------------------------
    # Preprocess
    # -----------------------------------------------------

    try:

        preprocessing_result = preprocessor.preprocess(
            original_path,
            processed_path
        )

    except Exception as e:

        print(f"ERROR during preprocessing: {e}")

        continue

    print(
        "Operations:",
        ", ".join(
            preprocessing_result["operations"]
        )
    )

    print(
        f"Processed file exists: "
        f"{os.path.exists(processed_path)}"
    )

    # -----------------------------------------------------
    # YOLO - Original
    # -----------------------------------------------------

    try:

        original_detections = detector.predict(
            original_path
        )

    except Exception as e:

        print(
            f"ERROR during original YOLO prediction: {e}"
        )

        continue

    # -----------------------------------------------------
    # YOLO - Processed
    # -----------------------------------------------------

    try:

        processed_detections = detector.predict(
            processed_path
        )

    except Exception as e:

        print(
            f"ERROR during processed YOLO prediction: {e}"
        )

        continue

    # -----------------------------------------------------
    # Print original detections
    # -----------------------------------------------------

    print()
    print("ORIGINAL IMAGE")

    print(
        f"Detection count: "
        f"{len(original_detections)}"
    )

    for detection in original_detections:

        print(
            f"  {detection['object_class']} "
            f"| confidence="
            f"{detection['confidence']:.4f}"
        )

    # -----------------------------------------------------
    # Print processed detections
    # -----------------------------------------------------

    print()
    print("PREPROCESSED IMAGE")

    print(
        f"Detection count: "
        f"{len(processed_detections)}"
    )

    for detection in processed_detections:

        print(
            f"  {detection['object_class']} "
            f"| confidence="
            f"{detection['confidence']:.4f}"
        )

    # -----------------------------------------------------
    # Compare
    # -----------------------------------------------------

    original_classes = [
        d["object_class"]
        for d in original_detections
    ]

    processed_classes = [
        d["object_class"]
        for d in processed_detections
    ]

    original_confidences = [
        d["confidence"]
        for d in original_detections
    ]

    processed_confidences = [
        d["confidence"]
        for d in processed_detections
    ]

    original_avg = (
        sum(original_confidences)
        / len(original_confidences)
        if original_confidences
        else 0
    )

    processed_avg = (
        sum(processed_confidences)
        / len(processed_confidences)
        if processed_confidences
        else 0
    )

    class_match = (
        sorted(original_classes)
        == sorted(processed_classes)
    )

    print()
    print("COMPARISON")

    print(
        f"Original count     : "
        f"{len(original_detections)}"
    )

    print(
        f"Processed count    : "
        f"{len(processed_detections)}"
    )

    print(
        f"Original avg conf  : "
        f"{original_avg:.4f}"
    )

    print(
        f"Processed avg conf : "
        f"{processed_avg:.4f}"
    )

    print(
        f"Class results same  : "
        f"{class_match}"
    )

    if (
        len(original_detections) > 0
        and len(processed_detections) > 0
    ):

        print(
            "STATUS: Detection preserved"
        )

    elif (
        len(original_detections) > 0
        and len(processed_detections) == 0
    ):

        print(
            "STATUS: WARNING - detection lost"
        )

    elif (
        len(original_detections) == 0
        and len(processed_detections) > 0
    ):

        print(
            "STATUS: New detection appeared"
        )

    else:

        print(
            "STATUS: No detections"
        )

    # -----------------------------------------------------
    # Save result
    # -----------------------------------------------------

    all_results.append(
        {
            "image": image_name,
            "original_count": len(original_detections),
            "processed_count": len(processed_detections),
            "original_avg_conf": original_avg,
            "processed_avg_conf": processed_avg,
            "class_match": class_match,
        }
    )

    print()


# ---------------------------------------------------------
# Final summary
# ---------------------------------------------------------

print()
print("=" * 80)
print("FINAL SUMMARY")
print("=" * 80)

print()

print(
    f"{'IMAGE':45} "
    f"{'ORIG':>6} "
    f"{'PROC':>6} "
    f"{'ORIG CONF':>12} "
    f"{'PROC CONF':>12} "
    f"{'MATCH':>8}"
)

print("-" * 100)

for result in all_results:

    print(
        f"{result['image'][:45]:45} "
        f"{result['original_count']:>6} "
        f"{result['processed_count']:>6} "
        f"{result['original_avg_conf']:>12.4f} "
        f"{result['processed_avg_conf']:>12.4f} "
        f"{str(result['class_match']):>8}"
    )

print()

print("=" * 80)
print("Batch preprocessing test completed.")
print("=" * 80)