from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor
from app.services.ai.detector import MarineXDetector


ORIGINAL_IMAGE = r"dataset\images\marine_marine-debris-aris3k-1009.png"
PROCESSED_IMAGE = r"dataset\images\processed\propeller_processed.png"


def print_detections(title, detections):
    print()
    print("=" * 60)
    print(title)
    print("=" * 60)

    if not detections:
        print("No detections found.")
        return

    for i, detection in enumerate(detections, start=1):
        print(
            f"{i}. "
            f"class={detection['object_class']} | "
            f"confidence={detection['confidence']:.4f} | "
            f"bbox=("
            f"{detection['x_min']:.2f}, "
            f"{detection['y_min']:.2f}, "
            f"{detection['x_max']:.2f}, "
            f"{detection['y_max']:.2f}"
            f")"
        )


def main():
    print("=" * 60)
    print("MarineX - Original vs Preprocessed YOLO Test")
    print("=" * 60)

    # --------------------------------------------------
    # 1. Preprocess the original sonar image
    # --------------------------------------------------

    preprocessor = SonarPreprocessor()

    result = preprocessor.preprocess(
        image_path=ORIGINAL_IMAGE,
        output_path=PROCESSED_IMAGE
    )

    print()
    print("Preprocessing completed successfully.")
    print(f"Original image : {result['original_path']}")
    print(f"Processed image: {result['processed_path']}")
    print(f"Operations     : {', '.join(result['operations'])}")

    # --------------------------------------------------
    # 2. Load MarineX YOLO detector
    # --------------------------------------------------

    detector = MarineXDetector()

    # --------------------------------------------------
    # 3. Run YOLO on ORIGINAL image
    # --------------------------------------------------

    original_detections = detector.predict(
        ORIGINAL_IMAGE
    )

    print_detections(
        "YOLO RESULT - ORIGINAL IMAGE",
        original_detections
    )

    # --------------------------------------------------
    # 4. Run YOLO on PREPROCESSED image
    # --------------------------------------------------

    processed_detections = detector.predict(
        PROCESSED_IMAGE
    )

    print_detections(
        "YOLO RESULT - PREPROCESSED IMAGE",
        processed_detections
    )

    # --------------------------------------------------
    # 5. Compare results
    # --------------------------------------------------

    print()
    print("=" * 60)
    print("COMPARISON")
    print("=" * 60)

    print(
        f"Original detections  : {len(original_detections)}"
    )

    print(
        f"Processed detections : {len(processed_detections)}"
    )

    # --------------------------------------------------
    # 6. Compare highest-confidence detections
    # --------------------------------------------------

    if original_detections:
        original_best = max(
            original_detections,
            key=lambda x: x["confidence"]
        )

        print()
        print("Best ORIGINAL detection:")
        print(
            f"  Class      : "
            f"{original_best['object_class']}"
        )
        print(
            f"  Confidence : "
            f"{original_best['confidence']:.4f}"
        )

    if processed_detections:
        processed_best = max(
            processed_detections,
            key=lambda x: x["confidence"]
        )

        print()
        print("Best PREPROCESSED detection:")
        print(
            f"  Class      : "
            f"{processed_best['object_class']}"
        )
        print(
            f"  Confidence : "
            f"{processed_best['confidence']:.4f}"
        )

    print()
    print("=" * 60)
    print("Test completed.")
    print("=" * 60)


if __name__ == "__main__":
    main()