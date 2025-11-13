import json
from transformers import pipeline
from PIL import Image
from openai import OpenAI

import os
os.environ["TRANSFORMERS_NO_TF_IMPORT"] = "1"
os.environ["TRANSFORMERS_NO_TORCHVISION_IMPORT"] = "1"
os.environ["TRANSFORMERS_NO_FLAX_IMPORT"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"  # ✅ enable Apple M1 GPU fallback

import sys
sys.modules["tensorflow"] = None  # pretend tensorflow doesn't exist
sys.modules["flax"] = None

# ✅ Validate inputs
if len(sys.argv) < 3:
    print(json.dumps({"error": "Insufficient arguments"}))
    sys.exit(1)

image_path = sys.argv[1]
description = sys.argv[2]

# ✅ Initialize OpenAI client with OpenRouter endpoint
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

if not os.getenv("OPENROUTER_API_KEY"):
    print(json.dumps({"error": "Missing OpenRouter API key"}))
    sys.exit(1)


def get_text_cleanliness_score(description: str) -> float:
    """
    Uses an OpenRouter LLM (via OpenAI client) to rate cleanliness urgency
    based on the issue description. Returns score between 0.0 (very clean)
    and 1.0 (extremely dirty/urgent).
    """
    try:
        prompt = f"""
        You are a cleanliness evaluator. Based on the following facility issue description,
        give a cleanliness or urgency score between 0.0 (very clean or minor issue)
        and 1.0 (extremely dirty or urgent). Consider both hygiene and urgency level.
        Respond ONLY with a JSON object like: {{"score": <number>}}

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

        # Extract numeric score
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
    if image_path.lower() != "none" and os.path.exists(image_path):
        image_model = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
        img = Image.open(image_path)
        candidate_labels = ["clean", "dirty"]
        result = image_model(image=img, candidate_labels=candidate_labels)[0]
        image_score = result["score"] if result["label"] == "dirty" else 1 - result["score"]

    # ✍️ Text-based score (via LLM)
    if description.strip():
        text_score = get_text_cleanliness_score(description)

    # ⚖️ Combine results
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
