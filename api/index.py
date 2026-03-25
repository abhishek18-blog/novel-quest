import os
import requests
import json
import base64g
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_groq_key():
    key = os.getenv("GROQ_API_KEY", "").strip()
    if not key:
        raise ValueError("GROQ_API_KEY missing")
    return key

# --- CHAT ROUTE ---
@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    try:
        GROQ_KEY = get_groq_key()
        data = request.get_json()
        sys_msg = data.get('systemPrompt', "You are a helpful assistant.")
        user_q = data.get('prompt', 'Hello')
        context = data.get('context', '')

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": f"{sys_msg} Answer strictly based on the manuscript provided."
                },
                {
                    "role": "user",
                    "content": f"MANUSCRIPT:\n{context[:5000]}\n\nQUESTION: {user_q}"
                }
            ],
            "temperature": 0.6,
            "stream": False
        }

        response = requests.post(
            url="https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=25
        )

        result = response.json()
        print("Groq chat response:", result)

        full_text = result['choices'][0]['message']['content']
        thought = ""
        answer = full_text
        if "<think>" in full_text:
            parts = full_text.split("</think>")
            thought = parts[0].replace("<think>", "").strip()
            answer = parts[1].strip() if len(parts) > 1 else ""

        return jsonify({"answer": answer, "thought": thought})

    except Exception as e:
        print("CHAT ERROR:", e)
        return jsonify({"error": str(e)}), 500


# --- OCR ROUTE (Groq Vision) ---
@app.route('/api/ocr', methods=['POST'])
def ocr_images():
    try:
        GROQ_KEY = get_groq_key()
        data = request.get_json()
        images = data.get('images', [])  # list of base64 strings with mime type

        if not images:
            return jsonify({"error": "No images provided"}), 400

        all_text = []

        for idx, img in enumerate(images):
            # img = { "base64": "...", "mimeType": "image/jpeg" }
            b64 = img.get('base64', '')
            mime = img.get('mimeType', 'image/jpeg')

            payload = {
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",  # Groq vision model
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime};base64,{b64}"
                                }
                            },
                            {
                                "type": "text",
                                "text": "Extract ALL text from this image exactly as it appears. Preserve paragraph breaks and line structure. Output only the extracted text, nothing else."
                            }
                        ]
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 4096
            }

            response = requests.post(
                url="https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
                json=payload,
                timeout=30
            )

            result = response.json()
            print(f"OCR image {idx+1} response:", result)

            if 'choices' not in result:
                print(f"OCR failed for image {idx+1}:", result)
                all_text.append(f"[Could not extract text from image {idx+1}]")
                continue

            extracted = result['choices'][0]['message']['content'].strip()
            all_text.append(extracted)

        combined = "\n\n".join(all_text)
        return jsonify({"text": combined, "pages": len(all_text)})

    except Exception as e:
        print("OCR ERROR:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)