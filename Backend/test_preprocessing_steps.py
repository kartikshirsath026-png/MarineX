import os
import cv2

from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor
from app.services.ai.detector import MarineXDetector


ORIGINAL_IMAGE = r"dataset\images\marine_marine-debris-aris3k-1009.png"
OUTPUT_DIR = r"dataset\images\processed_steps"


def print_result(name, detections):
    print()
    print("=" * 60)
    print(name)
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


def save_image(path, image):
    success = cv2.imwrite(path, image)

    if not success:
        raise IOError(f"Failed to save image: {path}")

    print(f"Saved: {path}")


def main():

    print("=" * 60)
    print("MarineX - Preprocessing Step-by-Step YOLO Test")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # --------------------------------------------------
    # Load original image
    # --------------------------------------------------

    preprocessor = SonarPreprocessor()
    detector = MarineXDetector()

    original = preprocessor.load_image(ORIGINAL_IMAGE)

    print()
    print(f"Original image shape: {original.shape}")
    print(f"Original image type : {original.dtype}")

    # --------------------------------------------------
    # 1. ORIGINAL
    # --------------------------------------------------

    print()
    print("Running YOLO on ORIGINAL image...")

    original_detections = detector.predict(
        ORIGINAL_IMAGE
    )

    print_result(
        "1. ORIGINAL IMAGE",
        original_detections
    )

    # --------------------------------------------------
    # 2. GRAYSCALE ONLY
    # --------------------------------------------------

    grayscale = preprocessor.convert_to_grayscale(
        original
    )

    grayscale_path = os.path.join(
        OUTPUT_DIR,
        "01_grayscale.png"
    )

    save_image(
        grayscale_path,
        grayscale
    )

    grayscale_detections = detector.predict(
        grayscale_path
    )

    print_result(
        "2. GRAYSCALE ONLY",
        grayscale_detections
    )

    # --------------------------------------------------
    # 3. GRAYSCALE + GAUSSIAN BLUR
    # --------------------------------------------------

    blurred = preprocessor.reduce_noise(
        grayscale
    )

    blur_path = os.path.join(
        OUTPUT_DIR,
        "02_grayscale_blur.png"
    )

    save_image(
        blur_path,
        blurred
    )

    blur_detections = detector.predict(
        blur_path
    )

    print_result(
        "3. GRAYSCALE + GAUSSIAN BLUR",
        blur_detections
    )

    # --------------------------------------------------
    # 4. GRAYSCALE + CLAHE
    # --------------------------------------------------

    clahe = preprocessor.enhance_contrast(
        grayscale
    )

    clahe_path = os.path.join(
        OUTPUT_DIR,
        "03_grayscale_clahe.png"
    )

    save_image(
        clahe_path,
        clahe
    )

    clahe_detections = detector.predict(
        clahe_path
    )

    print_result(
        "4. GRAYSCALE + CLAHE",
        clahe_detections
    )

    # --------------------------------------------------
    # 5. GRAYSCALE + NORMALIZATION
    # --------------------------------------------------

    normalized = preprocessor.normalize(
        grayscale
    )

    normalized_path = os.path.join(
        OUTPUT_DIR,
        "04_grayscale_normalized.png"
    )

    save_image(
        normalized_path,
        normalized
    )

    normalized_detections = detector.predict(
        normalized_path
    )

    print_result(
        "5. GRAYSCALE + NORMALIZATION",
        normalized_detections
    )

    # --------------------------------------------------
    # 6. SUMMARY
    # --------------------------------------------------

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    print(
        f"Original               : "
        f"{len(original_detections)} detection(s)"
    )

    print(
        f"Grayscale              : "
        f"{len(grayscale_detections)} detection(s)"
    )

    print(
        f"Grayscale + Blur       : "
        f"{len(blur_detections)} detection(s)"
    )

    print(
        f"Grayscale + CLAHE      : "
        f"{len(clahe_detections)} detection(s)"
    )

    print(
        f"Grayscale + Normalize  : "
        f"{len(normalized_detections)} detection(s)"
    )

    print()
    print("=" * 60)
    print("Test completed.")
    print("=" * 60)


if __name__ == "__main__":
    main()