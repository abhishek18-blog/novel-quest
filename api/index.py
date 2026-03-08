import os
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # Load .env BEFORE reading env vars

app = Flask(__name__)
CORS(app)

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    GROQ_KEY = os.getenv("GROQ_API_KEY", "").strip()
    if not GROQ_KEY:
        return jsonify({"error": "GROQ_API_KEY missing"}), 500

    try:
        data = request.get_json()
        sys_msg = data.get('systemPrompt', "You are a helpful assistant.")
        user_q = data.get('prompt', 'Hello')
        context = data.get('context', '')
        mode = data.get('mode', 'strict')

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
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=25
        )

        result = response.json()
        print("Groq response:", result)  # Debug log

        full_text = result['choices'][0]['message']['content']

        # Strip <think> tags, send thought and answer separately
        thought = ""
        answer = full_text
        if "<think>" in full_text:
            parts = full_text.split("</think>")
            thought = parts[0].replace("<think>", "").strip()
            answer = parts[1].strip() if len(parts) > 1 else ""

        return jsonify({"answer": answer, "thought": thought})

    except Exception as e:
        print("ERROR:", e)  # Debug log
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)