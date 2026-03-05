import os
import json
import requests
from http.server import BaseHTTPRequestHandler

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        if not GROQ_API_KEY:
            self._respond(500, {"error": "GROQ_API_KEY missing"})
            return

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

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
                self._respond(response.status_code, {
                    "error": "Groq API Error",
                    "details": response.text
                })
                return

            self._respond(200, response.json())

        except requests.exceptions.Timeout:
            self._respond(504, {"error": "AI response timed out"})
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _respond(self, status, data):
        self.send_response(status)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())