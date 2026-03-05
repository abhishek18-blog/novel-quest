import os
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY missing"}), 500

    try:
        data = request.get_json()
        prompt = data.get('prompt', 'Hello')
        context = data.get('context', '')
        system_prompt = data.get('systemPrompt', 'You are a literary assistant.')

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        user_content = f"Context:\n{context}\n\nQuestion:\n{prompt}" if context else prompt
        messages.append({"role": "user", "content": user_content})

        response = requests.post(
            url="https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-70b-8192",
                "messages": messages,
                "temperature": 0.7
            },
            timeout=15
        )

        if response.status_code != 200:
            return jsonify({
                "error": "Groq API Error",
                "details": response.text
            }), response.status_code

        return jsonify(response.json())

    except requests.exceptions.Timeout:
        return jsonify({"error": "AI response timed out"}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500
