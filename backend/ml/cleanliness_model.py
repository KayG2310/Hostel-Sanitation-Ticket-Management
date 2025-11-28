import json
from transformers import pipeline
from PIL import Image
from openai import OpenAI
import os
import sys
import io
import requests

os.environ["TRANSFORMERS_NO_TF_IMPORT"] = "1"
os.environ["TRANSFORMERS_NO_TORCHVISION_IMPORT"] = "1"
os.environ["TRANSFORMERS_NO_FLAX_IMPORT"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

sys.modules["tensorflow"] = None
sys.modules["flax"] = None

# Validate inputs
if len(sys.argv) < 3:
    print(json.dumps({"error": "Insufficient arguments"}))
    sys.exit(1)

image_path = sys.argv[1]
description = sys.argv[2]

# OpenAI client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

if not os.getenv("OPENROUTER_API_KEY"):
    print(json.dumps({"error": "Missing OpenRouter API key"}))
    sys.exit(1)


def get_text_cleanliness_score(description: str) -> float:
    try:
        prompt = f"""
        You are a cleanliness evaluator. Based on the following facility issue description,
        give a cleanliness or urgency score between 0.0 (very clean or minor issue)
        and 1.0 (extremely dirty or urgent). Respond ONLY with a JSON object like: {{"score": <number>}}
        Description: "{description}"
        """
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an accurate cleanliness assessment assistant."},
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content.strip()
        import re
        match = re.search(r"[-+]?\d*\.\d+|\d+", content)
        if match:
            score = float(match.group())
            return max(0.0, min(1.0, score))
        else:
            raise ValueError(f"Invalid response: {content}")
    except Exception as e:
        print(json.dumps({"error": f"Text LLM scoring failed: {str(e)}"}))
        return None


try:
    image_score = None
    text_score = None

    # 🖼️ Image-based score
    if image_path.lower() != "none":
        try:
            if image_path.startswith("http"):
                # Download remote image from Cloudinary
                resp = requests.get(image_path)
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            else:
                # Local file fallback
                img = Image.open(image_path).convert("RGB")

            image_model = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
            candidate_labels = ["clean", "dirty"]
            result = image_model(image=img, candidate_labels=candidate_labels)[0]
            image_score = result["score"] if result["label"] == "dirty" else 1 - result["score"]
        except Exception as e:
            print(json.dumps({"error": f"Image scoring failed: {str(e)}"}))
            image_score = None

    # ✍️ Text-based score
    if description.strip():
        text_score = get_text_cleanliness_score(description)

    # ⚖️ Combine scores
    if image_score is not None and text_score is not None:
        final_score = (0.3 * image_score + 0.7 * text_score) * 100
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
