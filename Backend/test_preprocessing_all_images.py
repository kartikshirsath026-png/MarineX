import os
import cv2

from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor
from app.services.ai.detector import MarineXDetector


IMAGE_NAMES = [
    "marine_marine-debris-aris3k-1009.png",
    "marine_marine-debris-aris3k-1081.png",
    "marine_marine-debris-aris3k-1056.png",
    "marine_marine-debris-aris3k-1176.png",
    "marine_marine-debris-aris3k-12.png",
]

INPUT_DIR = r"dataset\images"
OUTPUT_DIR = r"dataset\images\preprocessing_comparison"


def preprocess_image(preprocessor, input_path, output_path):
    """
    Apply the selected preprocessing combination:

    Grayscale
        ↓
    CLAHE
        ↓
    Normalization
    """

    image = preprocessor.load_image(input_path)

    # 1. Grayscale
    processed = preprocessor.convert_to_grayscale(image)

    # 2. CLAHE
    processed = preprocessor.enhance_contrast(processed)

    # 3. Normalization
    processed = preprocessor.normalize(processed)

    success = cv2.imwrite(
        output_path,
        processed
    )

    if not success:
        raise IOError(
            f"Failed to save processed image: {output_path}"
        )


def get_best_detection(detections):
    if not detections:
        return None

    return max(
        detections,
        key=lambda x: x["confidence"]
    )


def main():

    print("=" * 70)
    print("MarineX - Original vs Preprocessed Test - All 5 Images")
    print("=" * 70)

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    preprocessor = SonarPreprocessor()
    detector = MarineXDetector()

    results = []

    for image_name in IMAGE_NAMES:

        print()
        print("#" * 70)
        print(f"IMAGE: {image_name}")
        print("#" * 70)

        input_path = os.path.join(
            INPUT_DIR,
            image_name
        )

        output_path = os.path.join(
            OUTPUT_DIR,
            image_name
        )

        # --------------------------------------------------
        # Check input
        # --------------------------------------------------

        if not os.path.exists(input_path):
            print(f"ERROR: Image not found: {input_path}")
            continue

        # --------------------------------------------------
        # ORIGINAL
        # --------------------------------------------------

        print()
        print("Running YOLO on ORIGINAL image...")

        original_detections = detector.predict(
            input_path
        )

        print(
            f"Original detections: "
            f"{len(original_detections)}"
        )

        for detection in original_detections:
            print(
                f"  - {detection['object_class']} "
                f"confidence="
                f"{detection['confidence']:.4f}"
            )

        # --------------------------------------------------
        # PREPROCESS
        # --------------------------------------------------

        preprocess_image(
            preprocessor,
            input_path,
            output_path
        )

        print()
        print(
            f"Processed image saved: "
            f"{output_path}"
        )

        # --------------------------------------------------
        # PREPROCESSED
        # --------------------------------------------------

        print()
        print("Running YOLO on PREPROCESSED image...")

        processed_detections = detector.predict(
            output_path
        )

        print(
            f"Processed detections: "
            f"{len(processed_detections)}"
        )

        for detection in processed_detections:
            print(
                f"  - {detection['object_class']} "
                f"confidence="
                f"{detection['confidence']:.4f}"
            )

        # --------------------------------------------------
        # Best detections
        # --------------------------------------------------

        original_best = get_best_detection(
            original_detections
        )

        processed_best = get_best_detection(
            processed_detections
        )

        results.append({
            "image": image_name,
            "original_count": len(original_detections),
            "processed_count": len(processed_detections),
            "original_best": original_best,
            "processed_best": processed_best,
        })

    # ======================================================
    # FINAL SUMMARY
    # ======================================================

    print()
    print()
    print("=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)

    for result in results:

        print()
        print(f"Image: {result['image']}")

        print(
            f"  Original detections : "
            f"{result['original_count']}"
        )

        print(
            f"  Processed detections: "
            f"{result['processed_count']}"
        )

        original_best = result["original_best"]
        processed_best = result["processed_best"]

        if original_best:
            print(
                f"  Original best       : "
                f"{original_best['object_class']} "
                f"({original_best['confidence']:.4f})"
            )
        else:
            print(
                "  Original best       : None"
            )

        if processed_best:
            print(
                f"  Processed best      : "
                f"{processed_best['object_class']} "
                f"({processed_best['confidence']:.4f})"
            )
        else:
            print(
                "  Processed best      : None"
            )

    print()
    print("=" * 70)
    print("All-image preprocessing test completed.")
    print("=" * 70)


if __name__ == "__main__":
    main()