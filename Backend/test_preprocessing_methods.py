import os
import cv2

from app.services.ai.detector import MarineXDetector


# =========================================================
# CONFIGURATION
# =========================================================

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

IMAGE_DIRECTORY = os.path.join(
    BACKEND_DIR,
    "dataset",
    "images"
)

OUTPUT_DIRECTORY = os.path.join(
    BACKEND_DIR,
    "dataset",
    "images",
    "preprocessing_methods"
)

os.makedirs(
    OUTPUT_DIRECTORY,
    exist_ok=True
)


IMAGE_NAMES = [
    "marine_marine-debris-aris3k-1009.png",
    "marine_marine-debris-aris3k-1081.png",
    "marine_marine-debris-aris3k-1056.png",
    "marine_marine-debris-aris3k-1176.png",
    "marine_marine-debris-aris3k-12.png",
]


# =========================================================
# PREPROCESSING FUNCTIONS
# =========================================================

def grayscale(image):
    """
    Convert image to grayscale and save it as 3-channel image.
    """
    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    return cv2.cvtColor(
        gray,
        cv2.COLOR_GRAY2BGR
    )


def clahe(image):
    """
    Apply CLAHE to the luminance channel.
    """
    lab = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2LAB
    )

    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe_operator = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced_l = clahe_operator.apply(
        l_channel
    )

    enhanced_lab = cv2.merge(
        (
            enhanced_l,
            a_channel,
            b_channel
        )
    )

    return cv2.cvtColor(
        enhanced_lab,
        cv2.COLOR_LAB2BGR
    )


def normalization(image):
    """
    Normalize image intensity to 0-255.
    """
    normalized = cv2.normalize(
        image,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    return normalized


def grayscale_clahe(image):
    """
    Grayscale + CLAHE.
    """
    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    clahe_operator = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe_operator.apply(
        gray
    )

    return cv2.cvtColor(
        enhanced,
        cv2.COLOR_GRAY2BGR
    )


def grayscale_clahe_normalization(image):
    """
    Grayscale + CLAHE + Normalization.
    """
    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    clahe_operator = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe_operator.apply(
        gray
    )

    normalized = cv2.normalize(
        enhanced,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    return cv2.cvtColor(
        normalized,
        cv2.COLOR_GRAY2BGR
    )


# =========================================================
# PREPROCESSING METHODS
# =========================================================

METHODS = {
    "original": lambda image: image,

    "grayscale": grayscale,

    "clahe": clahe,

    "normalization": normalization,

    "grayscale_clahe": grayscale_clahe,

    "grayscale_clahe_normalization":
        grayscale_clahe_normalization,
}


# =========================================================
# LOAD YOLO
# =========================================================

print("=" * 90)
print("MarineX - Individual Preprocessing Method Comparison")
print("=" * 90)

print()
print("Loading YOLO model...")

detector = MarineXDetector()

detector.load_model()

print("YOLO model loaded successfully.")
print()


# =========================================================
# STORE RESULTS
# =========================================================

results_summary = []


# =========================================================
# PROCESS EACH IMAGE
# =========================================================

for image_name in IMAGE_NAMES:

    print()
    print("=" * 90)
    print(f"IMAGE: {image_name}")
    print("=" * 90)

    original_path = os.path.join(
        IMAGE_DIRECTORY,
        image_name
    )

    if not os.path.exists(original_path):

        print(
            f"ERROR: Image not found: "
            f"{original_path}"
        )

        continue

    original_image = cv2.imread(
        original_path
    )

    if original_image is None:

        print(
            "ERROR: OpenCV could not read image."
        )

        continue

    image_result = {
        "image": image_name
    }

    # -----------------------------------------------------
    # Test every method
    # -----------------------------------------------------

    for method_name, method_function in METHODS.items():

        print()
        print("-" * 70)
        print(f"METHOD: {method_name}")
        print("-" * 70)

        try:

            processed_image = method_function(
                original_image.copy()
            )

            # Original image does not need to be saved.
            if method_name == "original":

                test_path = original_path

            else:

                output_filename = (
                    os.path.splitext(image_name)[0]
                    + "_"
                    + method_name
                    + ".png"
                )

                test_path = os.path.join(
                    OUTPUT_DIRECTORY,
                    output_filename
                )

                cv2.imwrite(
                    test_path,
                    processed_image
                )

            # -------------------------------------------------
            # YOLO prediction
            # -------------------------------------------------

            detections = detector.predict(
                test_path
            )

            count = len(detections)

            classes = [
                detection["object_class"]
                for detection in detections
            ]

            confidences = [
                detection["confidence"]
                for detection in detections
            ]

            average_confidence = (
                sum(confidences) / len(confidences)
                if confidences
                else 0
            )

            print(
                f"Detection count : {count}"
            )

            for detection in detections:

                print(
                    f"  {detection['object_class']} "
                    f"| confidence="
                    f"{detection['confidence']:.4f}"
                )

            print(
                f"Average confidence: "
                f"{average_confidence:.4f}"
            )

            image_result[method_name] = {
                "count": count,
                "classes": classes,
                "average_confidence":
                    average_confidence
            }

        except Exception as e:

            print(
                f"ERROR: {e}"
            )

            image_result[method_name] = {
                "count": 0,
                "classes": [],
                "average_confidence": 0
            }

    results_summary.append(
        image_result
    )


# =========================================================
# FINAL COMPARISON TABLE
# =========================================================

print()
print()
print("=" * 110)
print("FINAL METHOD COMPARISON")
print("=" * 110)

method_names = list(METHODS.keys())

header = (
    f"{'IMAGE':42}"
)

for method in method_names:

    header += (
        f"{method[:12]:>15}"
    )

print(header)

print("-" * 110)

for result in results_summary:

    row = f"{result['image'][:42]:42}"

    for method in method_names:

        if method in result:

            count = result[method]["count"]
            confidence = result[method]["average_confidence"]

            value = f"{count}/{confidence:.2f}"

        else:

            value = "N/A"

        row += f"{value:>15}"

    print(row)


# =========================================================
# DETAILED SUMMARY
# =========================================================

print()
print("=" * 110)
print("DETAILED SUMMARY")
print("=" * 110)

for result in results_summary:

    print()
    print(result["image"])

    for method in method_names:

        if method not in result:
            continue

        data = result[method]

        print(
            f"  {method:35}"
            f"count={data['count']:<3} "
            f"avg_conf={data['average_confidence']:.4f} "
            f"classes={data['classes']}"
        )


print()
print("=" * 110)
print("Individual preprocessing test completed.")
print("=" * 110)

print()
print(
    "IMPORTANT: No API files were changed."
)