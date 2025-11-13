import os
import sys
import json
from transformers import pipeline
from PIL import Image

# Disable unused imports
os.environ["TRANSFORMERS_NO_TF_IMPORT"] = "1"
os.environ["TRANSFORMERS_NO_TORCHVISION_IMPORT"] = "1"
sys.modules["tensorflow"] = None

# ✅ Validate inputs
if len(sys.argv) < 3:
    print(json.dumps({"error": "Insufficient arguments"}))
    sys.exit(1)

image_path = sys.argv[1]
description = sys.argv[2]

try:
    image_score = None
    text_score = None

    # 🖼️ Image-based score
    if image_path.lower() != "none" and os.path.exists(image_path):
        image_model = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
        img = Image.open(image_path)
        candidate_labels = ["clean", "dirty"]
        result = image_model(image=img, candidate_labels=candidate_labels)[0]
        image_score = result['score'] if result['label'] == "dirty" else 1 - result['score']

    # ✍️ Text-based score
    if description.strip():
        text_model = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
        text_result = text_model(description)[0]
        text_score = 1 - text_result['score'] if text_result['label'] == "POSITIVE" else text_result['score']

    # ⚖️ Combine scores
    if image_score is not None and text_score is not None:
        final_score = (0.6 * image_score + 0.4 * text_score) * 100
    elif image_score is not None:
        final_score = image_score * 100
    elif text_score is not None:
        final_score = text_score * 100
    else:
        print(json.dumps({"error": "No image or description provided"}))
        sys.exit(1)

    print(json.dumps({"score": round(final_score, 2)}))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
