# 🏥 LifelineX - Agentic AI Healthcare System

> **A Next-Generation Hospital Information System (HIS) Powered by Multi-Agent AI**

LifelineX transforms traditional healthcare management into a proactive, intelligent ecosystem. By leveraging **Agentic AI**, **Real-time Monitoring**, and **Predictive Analytics**, it bridges the gap between hospital operations and patient wellness.

---

## 🌟 Key Features

### 🤖 Multi-Agent AI Architecture
- **Intake Agent (Voice-First)**: Intelligent symptom triage and risk assessment using natural language processing. Routines patients to Emergency, Telehealth, or In-Person care.
- **Wellness Agent**: 24/7 health companion that syncs with wearables (Fitbit, Google Fit) to monitor vitals and provide personalized health nudges.
- **Care Coordinator**: Automates appointment scheduling, improved by reinforcement learning (RL) to reduce no-shows.
- **Insights Agent**: Generates explainable AI predictions for patient health trends and "Virtual Twin" simulations.

### ⚡ Core Capabilities
- **Smart Patient Portal**: Real-time dashboard for patients to view health scores, appointments, and lab reports.
- **Staff Dashboard**: Comprehensive control center for doctors and admins to manage OPD, IPD, and emergency flows.
- **Automated ID Verification**: Integrated OCR service for instant patient registration via Aadhar/Government ID.
- **Predictive Analytics**: Forecasting for OPD load, bed availability, and disease risk factors.

---

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Backend** | Node.js, Express, MongoDB (Data), PostgreSQL (Inventory/Billing), Redis (Caching) |
| **Frontend** | React, Vite, TailwindCSS, Framer Motion |
| **AI & ML** | Python, FastAPI, Google Gemini / OpenRouter LLMs |
| **Voice** | Web Speech API, GCS STT/TTS Pipelines |
| **DevOps** | Docker, GitHub Actions, Hugging Face Spaces |

---

## 🚀 Getting Started

Follow these steps to set up the entire ecosystem locally.

### Prerequisites
*   Node.js (v18+) & mL (npm/yarn)
*   Python (v3.9+)
*   MongoDB & PostgreSQL instances
*   Redis server

### 1. Clone & Install Dependencies

**Backend (Core System)**
```bash
cd hospital-his-backend
npm install
```

**Frontend (Hospital Dashboard)**
```bash
cd hospital-his-frontend
npm install
```

**Patient Portal**
```bash
cd patient-portal
npm install
```

**AI Services (Voice & OCR)**
```bash
# Voice Agent
cd voice-agent
pip install -r requirements.txt

# ID OCR Service
cd ../his-id-ocr
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file in `hospital-his-backend/` based on the example. Key variables needed:
```env
MONGODB_URI=mongodb+srv://...
POSTGRES_HOST=localhost
REDIS_HOST=localhost
OPENROUTER_API_KEY=sk-or-...
GOOGLE_API_KEY=AIza...
```
*Repeat similar `.env` setup for `voice-agent` and `frontend` directories as required.*

### 3. Run the Application

**Step 1: Start Backend**
```bash
# In hospital-his-backend
npm run dev
```

**Step 2: Start AI Microsystems**
```bash
# In voice-agent
python run.py
```

**Step 3: Launch Frontends**
```bash
# Hospital Staff Dashboard
cd hospital-his-frontend
npm run dev

# Patient Portal
cd patient-portal
npm run dev
```

---

## 📂 Project Structure

```text
his-agentic/
├── hospital-his-backend/   # Core API, Auth, & Agent Orchestration
├── hospital-his-frontend/  # Staff/Admin Dashboard (React)
├── patient-portal/         # Patient-facing Web App (React)
├── voice-agent/            # AI Voice Interaction Service (Python/FastAPI)
├── his-id-ocr/             # ID Card Scanning Service (Python)
├── hospital-his-ml/        # Predictive Modelling & Analysis
└── .agent/                 # Agentic workflow configurations
```

---



---

## 📚 Documentation
For detailed architecture and deployment guides, refer to:
- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Reference](DEPLOYMENT_REFERENCE.md)
- [Project PRD](his-project-prd.md)
- [Backend Documentation](hospital-his-backend/README.md)
- [Frontend Documentation](hospital-his-frontend/README.md)

## 🤝 Contributors
*   **Team Co-Code-S4DS** - *Developers & Architects*

---
*Built with ❤️ for the future of healthcare.*
