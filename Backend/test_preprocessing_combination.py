import os
import cv2

from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor
from app.services.ai.detector import MarineXDetector


ORIGINAL_IMAGE = r"dataset\images\marine_marine-debris-aris3k-1009.png"
OUTPUT_IMAGE = r"dataset\images\processed_steps\05_grayscale_clahe_normalized.png"


def main():

    print("=" * 60)
    print("MarineX - Preprocessing Combination Test")
    print("=" * 60)

    preprocessor = SonarPreprocessor()
    detector = MarineXDetector()

    # Load original image
    image = preprocessor.load_image(
        ORIGINAL_IMAGE
    )

    # Grayscale
    processed = preprocessor.convert_to_grayscale(
        image
    )

    # CLAHE
    processed = preprocessor.enhance_contrast(
        processed
    )

    # Normalization
    processed = preprocessor.normalize(
        processed
    )

    # Save
    os.makedirs(
        os.path.dirname(OUTPUT_IMAGE),
        exist_ok=True
    )

    success = cv2.imwrite(
        OUTPUT_IMAGE,
        processed
    )

    if not success:
        raise IOError(
            f"Failed to save: {OUTPUT_IMAGE}"
        )

    print()
    print(f"Saved processed image: {OUTPUT_IMAGE}")

    # YOLO detection
    detections = detector.predict(
        OUTPUT_IMAGE
    )

    print()
    print("=" * 60)
    print("YOLO RESULT")
    print("=" * 60)

    if not detections:
        print("No detections found.")

    else:
        for i, detection in enumerate(
            detections,
            start=1
        ):
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

    print()
    print("=" * 60)
    print("Test completed.")
    print("=" * 60)


if __name__ == "__main__":
    main()