import os
import cv2


def preprocess_sonar_image(
    image_path: str,
    output_dir: str | None = None
):
    """
    Create an enhanced version of a sonar image.

    IMPORTANT:
    The enhanced image is for visual evidence and
    human verification. YOLO continues to use the
    original image.
    """

    if not os.path.exists(image_path):
        raise FileNotFoundError(
            f"Sonar image not found: {image_path}"
        )

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Unable to read sonar image: {image_path}"
        )

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Local contrast enhancement using CLAHE
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)

    # Normalize intensity
    normalized = cv2.normalize(
        enhanced,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    # Convert back to 3-channel image
    processed = cv2.cvtColor(
        normalized,
        cv2.COLOR_GRAY2BGR
    )

    # Create output directory
    if output_dir is None:
        output_dir = os.path.join(
            os.path.dirname(image_path),
            "processed"
        )

    os.makedirs(output_dir, exist_ok=True)

    # Create output filename
    filename = os.path.basename(image_path)

    name, extension = os.path.splitext(filename)

    output_filename = (
        f"{name}_processed{extension}"
    )

    output_path = os.path.join(
        output_dir,
        output_filename
    )

    # Save enhanced image
    success = cv2.imwrite(
        output_path,
        processed
    )

    if not success:
        raise RuntimeError(
            "Failed to save processed sonar image"
        )

    return {
        "original_path": image_path,
        "processed_path": output_path,
        "operations": [
            "grayscale",
            "clahe",
            "normalization"
        ]
    }