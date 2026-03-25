import os
import requests
import json
import base64g
from dotenv import load_dotenv, find_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import tempfile
import pymupdf4llm

load_dotenv(find_dotenv())
app = Flask(__name__)
CORS(app)

GROQ_KEY = os.getenv("GROQ_API_KEY", "").strip()

@app.route('/api/parse_pdf', methods=['POST'])
def parse_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)
        try:
            md_text = pymupdf4llm.to_markdown(temp_path)
            os.remove(temp_path)
            return jsonify({"text": md_text})
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    if not GROQ_KEY:
        return jsonify({"error": "GROQ_API_KEY missing"}), 500

    try:
        data = request.get_json(silent=True) or {}
        sys_msg = data.get('systemPrompt', "You are a helpful assistant.")
        user_q = data.get('prompt', 'Hello')
        context = str(data.get('context', ''))
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
            "stream": False  # Non-streaming for Vercel compatibility
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
        
        if response.status_code != 200:
            return jsonify({"error": f"Groq Error: {result}"}), response.status_code

        if 'choices' not in result or len(result['choices']) == 0:
            return jsonify({"error": "Empty choices from Groq"}), 500

        full_text = result['choices'][0]['message']['content']

        # Strip <think> tags, send thought and answer separately
        thought = ""
        answer = full_text
        if "<think>" in full_text:
            parts = full_text.split("</think>")
            thought = parts[0].replace("<think>", "").strip()
            answer = parts[1].strip() if len(parts) > 1 else ""

        # Remove markdown bold formatting
        answer = answer.replace("**", "")

        return jsonify({"answer": answer, "thought": thought})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)