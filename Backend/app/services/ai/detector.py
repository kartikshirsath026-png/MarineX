from ultralytics import YOLO
import os


MODEL_PATH = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )
    ),
    "models",
    "best.pt"
)


class MarineXDetector:

    def __init__(self):
        self.model = None

    def load_model(self):
        """
        Load the trained MarineX YOLO model.
        """

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"MarineX model not found: {MODEL_PATH}"
            )

        self.model = YOLO(MODEL_PATH)

    def predict(self, image_path: str):
        """
        Run object detection on a sonar image.
        """

        if self.model is None:
            self.load_model()

        results = self.model(image_path)

        detections = []

        for result in results:

            if result.boxes is None:
                continue

            for box in result.boxes:

                coordinates = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                class_id = int(box.cls[0])

                class_name = self.model.names[class_id]

                detections.append({
                    "object_class": class_name,
                    "confidence": confidence,
                    "x_min": coordinates[0],
                    "y_min": coordinates[1],
                    "x_max": coordinates[2],
                    "y_max": coordinates[3]
                })

        return detections


detector = MarineXDetector()