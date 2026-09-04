# MarineX YOLO Model

## Project
MarineX - AI-Powered Underwater Sonar Object Detection System

## Model
Custom YOLO object detection model trained for underwater sonar imagery.

Model file:
- best.pt

## Dataset
Forward-Looking Under-Water Mines And Debris Sonar Dataset

Dataset type:
- Forward-Looking Sonar (FLS)

Note:
This dataset is Forward-Looking Sonar, not Side-Scan Sonar.

## Classes

The model was trained to detect the following 11 classes:

0. mine
1. can
2. bottle
3. drink-carton
4. chain
5. propeller
6. tire
7. hook
8. valve
9. shampoo-bottle
10. standing-bottle

## Training Configuration

Training framework:
- Ultralytics YOLO

Training hardware:
- Google Colab
- NVIDIA T4 GPU

Training parameters:
- Epochs: 50
- Image size: 640
- Batch size: 16

## Dataset Split

Training images: 1627
Validation images: 202
Test images: 206

## Validation Performance

Precision: 0.942
Recall: 0.912
mAP@50: 0.972
mAP@50-95: 0.745

## Test Performance

Precision: 0.881
Recall: 0.948
mAP@50: 0.971
mAP@50-95: 0.728

## MarineX Integration

The trained model is integrated into the MarineX FastAPI backend.

Pipeline:

Sonar Image
    ↓
Image Preprocessing
    ↓
YOLO Model
    ↓
Object Detection
    ↓
Confidence Filtering
    ↓
Priority Assessment
    ↓
Human Verification
    ↓
Dashboard / Map / Report

## Important Limitation

The model detects only the 11 classes listed above.

It does not directly detect:
- fish
- sharks
- ghost nets
- generic marine debris
- unknown anomalies

unless additional training data/classes are added.

The `mine` class should be treated as a detected sonar hazard/anomaly rather than automatically being classified as marine debris.

## Model File

best.pt is the trained MarineX YOLO model used for inference.