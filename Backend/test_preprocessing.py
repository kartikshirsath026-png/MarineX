from app.services.preprocessing.sonar_preprocessor import SonarPreprocessor


# Original sonar image
input_image = r"dataset\images\marine_marine-debris-aris3k-1009.png"

# Where the processed image will be saved
output_image = r"dataset\images\processed\propeller_processed.png"


# Create the preprocessing object
preprocessor = SonarPreprocessor(
    denoise=True,
    clahe=True,
    sharpen=False
)


# Run preprocessing
result = preprocessor.preprocess(
    image_path=input_image,
    output_path=output_image
)


# Display the result
print("\n========================================")
print("MarineX Preprocessing Test")
print("========================================")

print(f"Original image : {result['original_path']}")
print(f"Processed image: {result['processed_path']}")

print(
    f"Original size  : "
    f"{result['original_width']} x {result['original_height']}"
)

print(
    f"Processed size : "
    f"{result['processed_width']} x {result['processed_height']}"
)

print(f"Operations     : {', '.join(result['operations'])}")

print("========================================")
print("Preprocessing completed successfully!")
print("========================================")