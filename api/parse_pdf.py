import os
from dotenv import load_dotenv, find_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import tempfile

load_dotenv(find_dotenv(), override=True)
app = Flask(__name__)
CORS(app)

@app.route('/api/parse_pdf', methods=['POST'])
def parse_pdf():
    from markitdown import MarkItDown
    
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
            md = MarkItDown()
            result = md.convert(temp_path)
            md_text = result.text_content
            os.remove(temp_path)
            return jsonify({"text": md_text})
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({"error": str(e)}), 500
