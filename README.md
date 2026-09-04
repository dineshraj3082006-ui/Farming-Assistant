# 🌾 KrishiMitra AI (കൃഷിമിത്ര AI)
### *AI-Powered Personal Farming Assistant for Kerala Farmers*
**Problem Statement ID: SIH25074 | Smart India Hackathon**

---

## 📖 Overview

**KrishiMitra AI** is a bilingual (English & Malayalam) hyper-localized smart farming assistant engineered specifically for farmers across Kerala's 14 agro-climatic zones. It integrates deep learning computer vision, Retrieval-Augmented Generation (RAG), real-time APMC market intelligence, and localized weather advisories into an intuitive, voice-enabled web platform.

---

## ✨ Key Features

### 🩺 1. AI Crop Doctor (Leaf Disease Diagnosis)
- **Local Edge Inference**: Powered by a fine-tuned **MobileNetV3-Large** PyTorch model classifying 28 crop-disease combinations in under 50ms.
- **Multimodal Cloud Escalation**: Seamlessly escalates low-confidence or non-standard field images to **NVIDIA NIM Multimodal Vision AI (`meta/llama-3.2-11b-vision-instruct`)**.
- **Kerala Agricultural University (KAU) Alignment**: Returns organic bio-control protocols (e.g., *Pseudomonas fluorescens*, *Trichoderma viride*), chemical remedies, and preventive measures in both **English and Malayalam**.

### 💬 2. Bilingual Agronomic Chatbot & RAG Engine
- Domain-specific **Retrieval-Augmented Generation (RAG)** built on curated agronomic knowledge (crops, endemic pests, soil types, seasonal calendars).
- Fallback to an offline rule-based knowledge synthesizer to ensure 100% uptime for rural farmers with intermittent internet.

### 📈 3. Kerala APMC Market Intelligence
- Real-time commodity tracking (Paddy, Coconut, Black Pepper, Banana/Nendran, Cardamom, Rubber, Arecanut, Ginger) across major Kerala wholesale markets (Palakkad, Thrissur, Nedumangad, Wayanad).
- Price trend indicators, 7-day historical pricing, and interactive visualization charts.

### 🌦️ 4. Agro-Weather & Smart Advisory
- Real-time weather monitoring via WeatherAPI with dynamic agricultural tips (e.g., spraying alerts during humidity spikes, rain warnings for harvesting).

### 🌾 5. Soil & Season Crop Recommendation
- Recommends optimal crops tailored to district, land acreage, soil type (Laterite, Coastal Alluvium, Red Loam, Black Cotton), water availability, and cropping season (Virippu, Mundakan, Puncha).

### 🎙️ 6. Voice Navigation & Malayalam TTS
- Integrated Web Speech API enabling voice commands and audio playback of diagnostic reports in Malayalam (മലയാളം) for non-literate farmers.

---

## 🏛️ System Architecture

```
                       ┌─────────────────────────────────────┐
                       │     Modern Responsive Web UI        │
                       │ (HTML5, Vanilla CSS, JS, Web Speech)│
                       └──────────────────┬──────────────────┘
                                          │ HTTP / REST
                                          ▼
                       ┌─────────────────────────────────────┐
                       │      Node.js / Express Server       │
                       │            (Port 5000)              │
                       └──────────┬─────────────────┬────────┘
                                  │                 │
                Internal Microservice Call          │ External Cloud APIs
                                  ▼                 ▼
     ┌──────────────────────────────────┐   ┌───────────────────────────────┐
     │   Python Flask ML Microservice   │   │  - NVIDIA NIM AI Vision API   │
     │            (Port 5001)           │   │  - WeatherAPI.com             │
     │  - MobileNetV3 PyTorch Model     │   └───────────────────────────────┘
     │  - Fast <50ms Inference Engine   │
     └──────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Semantic HTML5, Vanilla CSS3 (Custom Design System), Modern JavaScript (ES6+), Web Speech API |
| **Backend** | Node.js, Express.js, Multer, CORS, dotenv |
| **Machine Learning** | Python 3.10+, PyTorch, TorchVision (MobileNetV3-Large), Flask, Scikit-learn, PIL, NumPy |
| **External APIs** | NVIDIA NIM API (`meta/llama-3.2-11b-vision-instruct`), WeatherAPI.com |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or higher) & **npm**
- **Python** (v3.9 or higher) & **pip**
- **Git**

---

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/krishimitra-ai.git
   cd krishimitra-ai
   ```

2. **Install Node.js Backend Dependencies**:
   ```bash
   npm install
   ```

3. **Install Python ML Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Up Environment Variables**:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and insert your API keys:
   ```env
   PORT=5000
   DEMO_MODE=false

   # NVIDIA AI NIM API Key (https://build.nvidia.com/)
   NVIDIA_API_KEY=your_nvidia_api_key_here
   NVIDIA_MODEL=meta/llama-3.2-11b-vision-instruct

   # WeatherAPI.com API Key (https://www.weatherapi.com/)
   WEATHER_API_KEY=your_weatherapi_key_here
   ```

---

## 💻 Running the Application

### Option A: Run Full Stack (Automatic)
Start the Express server; it automatically detects and spawns the Python ML microservice:
```bash
npm start
```
Open your browser and navigate to: **`http://localhost:5000`**

### Option B: Run Services Individually (Recommended for Development)

**Terminal 1 — Python ML Microservice (Port 5001)**:
```bash
python ml_service/app.py
```

**Terminal 2 — Express Backend & Frontend Server (Port 5000)**:
```bash
npm run dev
```

---

## 🧪 Verification & Testing

Run the automated full-system verification suite:
```bash
python ml_service/verify_full_system.py
```

This verifies:
1. Express API health & database connectivity
2. Python PyTorch MobileNetV3 inference pipeline
3. Leaf disease diagnosis across test datasets
4. Quick preset diagnostic models

---

## 📂 Project Structure

```
krishimitra-ai/
├── assets/                 # Brand assets, hero images, and diagnostic badges
├── css/
│   └── style.css           # Custom CSS styling & responsive tokens
├── js/
│   ├── api-services.js     # Frontend API connection layer with offline fallbacks
│   ├── script.js           # Core UI logic, state management, modal handlers
│   ├── translations.js     # Complete English-Malayalam bilingual dictionaries
│   └── voice-engine.js     # Web Speech API voice synthesis & recognition
├── knowledge/              # Curated Kerala agronomic RAG knowledge base (.md)
├── ml_service/
│   ├── models/             # Trained MobileNetV3 weights (.pth) and label mappings
│   ├── app.py              # Flask inference microservice (Port 5001)
│   ├── train.py            # PyTorch transfer learning training script
│   ├── evaluate.py         # Model evaluation & confusion matrix script
│   └── verify_full_system.py # End-to-end integration test suite
├── server/
│   ├── cropDoctorService.js          # Hybrid diagnostic engine (Local ML + Vision AI)
│   ├── cropRecommendationService.js  # Agro-climatic crop matching algorithm
│   ├── keralaMarketData.js           # Kerala APMC wholesale market data
│   ├── ragEngine.js                  # Agronomic RAG chat engine
│   └── server.js                     # Express.js REST API server
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules (node_modules, caches, dataset)
├── package.json            # Node.js project manifest & scripts
├── requirements.txt        # Python pip dependencies
├── index.html              # Landing page
├── dashboard.html          # Farmer main dashboard
├── crop-disease.html       # Crop Doctor diagnostic portal
├── crop-recommendation.html# Crop suitability recommendation tool
├── market.html             # APMC commodity price tracker
├── weather.html            # Hyper-local weather forecast & advisories
├── chatbot.html            # Bilingual conversational agricultural assistant
├── login.html              # Farmer mobile authentication
└── profile.html            # Farmer farm & crop profile management
```

---

## 📜 License & Attribution
Developed for **Smart India Hackathon (SIH25074)**.  
Agronomic recommendations reference the **Package of Practices (POP) Recommendations: Crops**, published by the **Directorate of Extension, Kerala Agricultural University (KAU)**.
