---
description: Complete deployment workflow for HIS Agentic to HF Spaces + Vercel
---

# 🚀 HIS Agentic Deployment Workflow

> **Goal**: Deploy the complete HIS Agentic system with 4 HF Spaces + 1 Vercel frontend

---

## 📋 Deployment Overview

| # | Service | Platform | HF Space Name | Status |
|---|---------|----------|---------------|--------|
| 1 | Backend API | HF Spaces | `his-agentic-backend` | ⬜ Pending |
| 2 | OCR Service | HF Spaces | `his-id-ocr` | ⬜ Pending |
| 3 | Voice Agent | HF Spaces | `his-voice-agent` | ⬜ Pending |
| 4 | ML Services | HF Spaces | `his-ml-services` | 🔄 Prepared |
| 5 | Frontend | Vercel | `his-agentic` | ⬜ Pending |

---

## 🔧 PHASE 0: Prerequisites & Setup

### Step 0.1: Create New GitHub Repository
- [ ] Go to github.com → New Repository
- [ ] Name: `his-agentic` (or your choice)
- [ ] Visibility: Private (recommended) or Public
- [ ] Do NOT initialize with README (we'll push existing code)

### Step 0.2: Create New MongoDB Atlas Database
- [ ] Go to cloud.mongodb.com
- [ ] Create new cluster OR use existing cluster
- [ ] Create new database: `his-agentic-prod`
- [ ] Create database user with read/write access
- [ ] Whitelist IP: `0.0.0.0/0` (allow all - required for HF Spaces)
- [ ] Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/his-agentic-prod`

### Step 0.3: Create Hugging Face Access Token
- [ ] Go to huggingface.co → Settings → Access Tokens
- [ ] Create new token with **Write** permissions
- [ ] Save token securely (will be used as `HF_TOKEN`)

### Step 0.4: Prepare API Keys
Gather all required API keys:
- [ ] OpenRouter API Key (primary): `OPENROUTER_API_KEY`
- [ ] OpenRouter Inventory Agent Key: `OPENROUTER_AGENTIC_INVENTORY_API_KEY`
- [ ] OpenRouter Insurance Agent Key: `OPENROUTER_AGENTIC_INSURANCE_API`
- [ ] Google API Key (if using): `GOOGLE_API_KEY`
- [ ] Gemini API Key (for voice agent): `GEMINI_API_KEY`

---

## 🖥️ PHASE 1: Backend Preparation

### Step 1.1: Add Root Route to server.js
**File**: `hospital-his-backend/server.js`
**Location**: After middleware section, before `/api/health` route

```javascript
// Root route - Welcome message
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'HIS Agentic Backend API',
        version: '1.0.0',
        environment: config.nodeEnv,
        endpoints: {
            health: '/api/health',
            api: '/api/v1/*',
            docs: '/docs'
        },
        timestamp: new Date().toISOString()
    });
});
```

### Step 1.2: Add Swagger Dependencies
**File**: `hospital-his-backend/package.json`

Add to dependencies:
```json
"swagger-jsdoc": "^6.2.8",
"swagger-ui-express": "^5.0.0"
```

### Step 1.3: Create Swagger Configuration
**Create file**: `hospital-his-backend/config/swagger.config.js`

### Step 1.4: Add Swagger to server.js
**File**: `hospital-his-backend/server.js`

### Step 1.5: Create Backend Dockerfile
**Create file**: `hospital-his-backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose HF Spaces port
EXPOSE 7860

# Set environment variable for port
ENV PORT=7860

# Start server
CMD ["node", "server.js"]
```

### Step 1.6: Sync package-lock.json
**CRITICAL**: Run this command to ensure package-lock.json is in sync

```bash
cd hospital-his-backend
npm install
```

---

## 🔍 PHASE 2: OCR Service Preparation

### Step 2.1: Update Dockerfile Port
**File**: `his-id-ocr/Dockerfile`
**Change**: Port 8000 → 7860

Update the following lines:
- `EXPOSE 8000` → `EXPOSE 7860`
- `CMD [..., "--port", "8000"]` → `CMD [..., "--port", "7860"]`
- Health check URL port update

### Step 2.2: Verify requirements.txt
**File**: `his-id-ocr/requirements.txt`
Ensure all dependencies are listed

---

## 🎤 PHASE 3: Voice Agent Preparation

### Step 3.1: Update Dockerfile Port
**File**: `voice-agent/Dockerfile`
**Change**: Port 5003 → 7860

Update the following lines:
- `EXPOSE 5003` → `EXPOSE 7860`
- `CMD [..., "--port", "5003"]` → `CMD [..., "--port", "7860"]`
- Health check URL port update

### Step 3.2: Verify requirements.txt
**File**: `voice-agent/requirements.txt`
Ensure all dependencies are listed

---

## 🧠 PHASE 4: ML Services Preparation

### Step 4.1: Create Combined ML Dockerfile
**Create file**: `hospital-his-ml/Dockerfile`

This will run both predictive_analytics and revenue_leakage services.

### Step 4.2: Create Combined Entry Point
**Create file**: `hospital-his-ml/app.py`

Create a single FastAPI/Flask app that mounts both services.

### Step 4.3: Create Combined requirements.txt
**File**: `hospital-his-ml/requirements.txt`

Merge dependencies from:
- `predictive_analytics/requirements.txt`
- `revenue_leakage/requirements.txt`

---

## ☁️ PHASE 5: Create HF Spaces

### Step 5.1: Create Backend Space
1. Go to huggingface.co/spaces
2. Click "Create new Space"
3. Settings:
   - Name: `his-agentic-backend`
   - SDK: **Docker**
   - Hardware: CPU Basic (Free)
   - Visibility: Public

### Step 5.2: Create OCR Space
1. Create new Space
2. Settings:
   - Name: `his-id-ocr`
   - SDK: **Docker**
   - Hardware: CPU Basic (Free)

### Step 5.3: Create Voice Agent Space
1. Create new Space
2. Settings:
   - Name: `his-voice-agent`
   - SDK: **Docker**
   - Hardware: CPU Basic (Free)

### Step 5.4: Create ML Services Space
1. Create new Space
2. Settings:
   - Name: `his-ml-services`
   - SDK: **Docker**
   - Hardware: CPU Basic (Free)

---

## 🔐 PHASE 6: Configure GitHub Secrets

### Step 6.1: Add Repository Secrets
Go to GitHub Repo → Settings → Secrets and variables → Actions

| Secret Name | Value |
|-------------|-------|
| `HF_TOKEN` | Your Hugging Face Write token |
| `HF_BACKEND_SPACE` | `username/his-agentic-backend` |
| `HF_OCR_SPACE` | `username/his-id-ocr` |
| `HF_VOICE_SPACE` | `username/his-voice-agent` |
| `HF_ML_SPACE` | `username/his-ml-services` |

---

## ⚙️ PHASE 7: Create GitHub Actions

### Step 7.1: Create Backend Deployment Action
**Create file**: `.github/workflows/deploy-backend.yml`

```yaml
name: Deploy Backend to HF Spaces

on:
  push:
    branches: [main]
    paths:
      - 'hospital-his-backend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Push to HF Space
        uses: JacobLinCool/huggingface-sync@v1
        with:
          github: ${{ github.repository }}
          huggingface: ${{ secrets.HF_BACKEND_SPACE }}
          token: ${{ secrets.HF_TOKEN }}
          directory: hospital-his-backend
```

### Step 7.2: Create OCR Deployment Action
**Create file**: `.github/workflows/deploy-ocr.yml`

### Step 7.3: Create Voice Agent Deployment Action
**Create file**: `.github/workflows/deploy-voice.yml`

### Step 7.4: Create ML Services Deployment Action
**Create file**: `.github/workflows/deploy-ml.yml`

---

## 🔑 PHASE 8: Configure HF Spaces Environment Variables

### Step 8.1: Backend Space Secrets
Go to HF Space → Settings → Repository Secrets

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Your secure JWT secret |
| `NODE_ENV` | `production` |
| `PORT` | `7860` |
| `CORS_ORIGINS` | Your Vercel frontend URL |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `OPENROUTER_MODEL` | `google/gemma-3-27b-it:free` |
| `OPENROUTER_AGENTIC_INVENTORY_API_KEY` | Inventory agent key |
| `OPENROUTER_AGENTIC_INVENTORY_MODEL` | `nvidia/nemotron-3-nano-30b-a3b:free` |
| `OPENROUTER_AGENTIC_INSURANCE_API` | Insurance agent key |
| `OPENROUTER_AGENTIC_INSURANCE_MODEL` | `nvidia/nemotron-3-nano-30b-a3b:free` |
| `OCR_SERVICE_URL` | `https://username-his-id-ocr.hf.space` |
| `VOICE_SERVICE_URL` | `https://username-his-voice-agent.hf.space` |
| `ML_SERVICE_URL` | `https://username-his-ml-services.hf.space` |

### Step 8.2: OCR Space Secrets
| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | (if using Gemini for OCR) |

### Step 8.3: Voice Agent Space Secrets
| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `HIS_API_URL` | Backend URL |

### Step 8.4: ML Services Space Secrets
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `FLASK_PORT` | `7860` |

---

## 🌐 PHASE 9: Deploy Frontend to Vercel

### Step 9.1: Connect to Vercel
1. Go to vercel.com
2. Import GitHub repository
3. Settings:
   - Framework: Vite
   - Root Directory: `hospital-his-frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 9.2: Set Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://username-his-agentic-backend.hf.space/api/v1` |
| `VITE_OCR_URL` | `https://username-his-id-ocr.hf.space` |
| `VITE_VOICE_URL` | `https://username-his-voice-agent.hf.space` |

### Step 9.3: Deploy
Click "Deploy" or push to main branch

---

## 🚀 PHASE 10: Push Code & Deploy

### Step 10.1: Initialize Git (if needed)
```bash
cd Co-Code-S4DS
git init
git remote add origin https://github.com/username/his-agentic.git
```

### Step 10.2: Push to GitHub
```bash
git add .
git commit -m "Initial commit - HIS Agentic deployment"
git push -u origin main
```

### Step 10.3: Monitor GitHub Actions
- Go to GitHub → Actions tab
- Watch for deployment workflows to complete
- Check for any errors

---

## ✅ PHASE 11: Verification & Testing

### Step 11.1: Test Backend
1. **Root URL**: `https://username-his-agentic-backend.hf.space/`
   - Should return JSON with API info
2. **Health**: `https://username-his-agentic-backend.hf.space/api/health`
   - Should return health status
3. **Swagger**: `https://username-his-agentic-backend.hf.space/docs`
   - Should show API documentation

### Step 11.2: Test OCR Service
1. **Health**: `https://username-his-id-ocr.hf.space/health`

### Step 11.3: Test Voice Agent
1. **Health**: `https://username-his-voice-agent.hf.space/health`

### Step 11.4: Test ML Services
1. **Health**: `https://username-his-ml-services.hf.space/health`

### Step 11.5: Test Frontend
1. Visit Vercel URL
2. Try logging in with default credentials:
   - Email: `admin@hospital-his.com`
   - Password: `Admin@123`

### Step 11.6: Test Login API
In browser console:
```javascript
fetch('https://username-his-agentic-backend.hf.space/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'admin@hospital-his.com',
        password: 'Admin@123'
    })
}).then(r => r.json()).then(console.log)
```

---

## 🔧 PHASE 12: Post-Deployment Configuration

### Step 12.1: Seed Database (if new database)
Run database seeding to create default users, departments, etc.

### Step 12.2: Update CORS Origins
After Vercel deploys, update backend's `CORS_ORIGINS` with actual Vercel URL

### Step 12.3: Update Frontend Service URLs
If any hardcoded URLs exist, update them

---

## ⚠️ Common Issues & Solutions

### Issue: Build fails with "package-lock.json out of sync"
**Solution**: Run `npm install` locally and commit package-lock.json

### Issue: CORS errors
**Solution**: Add frontend URL to CORS_ORIGINS in HF Spaces secrets

### Issue: MongoDB connection timeout
**Solution**: Ensure IP whitelist includes `0.0.0.0/0` in MongoDB Atlas

### Issue: HF Space crashes on startup
**Solution**: Check logs in HF Space → Logs tab

### Issue: Docker image too large
**Solution**: Use slim base images, remove unnecessary dependencies

---

## 📋 Quick Checklist

### Before Deployment:
- [ ] All Dockerfiles created/updated
- [ ] All ports set to 7860
- [ ] package-lock.json synced
- [ ] Root routes added
- [ ] Swagger configured (backend)
- [ ] GitHub repo created
- [ ] MongoDB database created
- [ ] HF Spaces created
- [ ] All secrets configured

### After Deployment:
- [ ] All health endpoints responding
- [ ] Frontend loading correctly
- [ ] Login working
- [ ] CORS not blocking requests
- [ ] WebSocket connections working
- [ ] Agentic features functional

---

## 📅 Created
- **Date**: February 3, 2026
- **Project**: HIS Agentic - Hospital Information System with AI Agents
