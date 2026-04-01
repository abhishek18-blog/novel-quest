# 📖 Novel Quest

**Novel Quest** is an intelligent, immersive e-reading application designed to help scholars, students, and readers structurally extract, deeply explore, and interact with their PDF manuscripts. Built with React and supercharged by a dedicated Python backend, Novel Quest effortlessly extracts the core framework of your documents using LLMs to deliver an unparalleled, disruption-free reading ecosystem.

---

## ✨ Features

- **Structurally-Aware PDF Uploads:** Powered by `PyMuPDF4LLM`, ensuring that headers, nested lists, bold formatting, and context remain entirely intact when parsed into beautiful Markdown prose.
- **Smart Chat Context Modes:** Talk directly with embedded Artificial Intelligence about your manuscript utilizing *Strict* (current page context only) or *Global* (broad LLM understanding) scope mechanics.
- **Magic Insights:** Command powerful instant insights from any page you're traversing:
  - 📝 **Summary:** Instantly compress and summarize large chunks of narrative texts.
  - 🕵️ **Characters:** Track and decode character goals and motivations dynamically.
  - 🪄 **Story Weaver:** Brainstorm 3 vivid creative plot directions directly based on the current scene.
  - 🌍 **Translation:** Quickly dissect and translate document selections cleanly.
- **Beautiful E-Reader UI:** Distraction-free, responsive pagination engineered for an immersive aesthetic experience alongside a sleek native Dark Mode toggle.
- **Cloud Library Syncing:** Fluid user onboarding orchestrated with Firebase Authentication (supports both Google and secure Email/Password pipelines) ensuring your expansive reading library persists tightly across all platforms.

---

## 🛠️ Architecture & Technologies

### Frontend Client
- **Core:** React + Vite
- **Styling:** Modern TailwindCSS v4 natively nested with custom typography layer overriding
- **Markup Translation:** `react-markdown` 
- **BaaS Platform:** Firebase (Firestore NoSQL Database & Multi-Auth Architecture)
- **Icons:** `lucide-react`

### Backend Engine (`/api`)
- **Core Server:** Python via Flask
- **Document Distillation:** `pymupdf4llm`
- **LLM Cognitive Engine:** Groq Ecosystem using ultra-low latency models (`llama-3.3-70b-versatile` & `llama-3.2-11b-vision-preview`)

---

## 🚀 Getting Started

### 1. Prerequisites 
- **Node.js** (v18+)
- **Python** (v3.9+)
- A registered **Firebase** Web project setup perfectly with Firestore capabilities and Authentication routing seamlessly enabled.
- A **Groq API Key**.

### 2. Frontend Environment Setup

1. Spin up your terminal inside the root project directory:
```bash
git clone https://github.com/abhishek18-blog/novel-quest.git
cd novel-quest
npm install
```

2. Inject your core environment configuration tokens. Create an `.env` file inside the root directory and format it:
```env
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-domain.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-bucket.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

3. Ignite the frontend server locally:
```bash
npm run dev
```

### 3. Backend Engine Setup

The application gracefully proxies its heavy intensive file extraction routing alongside the Groq API computational logic to its dedicated local Python backend sandbox. 

1. Launch a new isolated terminal directly targeting the API environment:
```bash
cd api
```

2. Setup your ecosystem and fetch pipeline dependencies:
```bash
pip install flask flask-cors requests python-dotenv pymupdf4llm
```

3. Construct the API-layer environment file configuration. Build a local `.env` internal exclusively in the `api` folder containing:
```env
GROQ_API_KEY="your_groq_api_key_here"
```

4. Bootstrap the native listener:
```bash
python index.py
```
*(The Python server binds natively to port `5000`. The Vite host magically binds proxy routing towards `/api` immediately off the shelf!)*

---

## 🎮 Application Usage

1. Open `http://localhost:5173` inside your modern browser window.
2. Admire the full-width landing presentation and strike the **Get Started** prompt.
3. Utilize the application locally directly as an Anonymous navigator, or establish a cohesive account through the beautiful **Sign Up** interface.
4. Dive into the **Library** toggle, upload an intricate dense analytical PDF file, and engage the **Magic Insights**! 

HOSTED AS https://novel-quest-lv1v.vercel.app/
---
