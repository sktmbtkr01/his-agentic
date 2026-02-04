# 🚀 Deploying the Patient Portal to Vercel

Follow these exact steps to deploy the new **Patient Portal** as a separate Vercel project effectively linked to your existing backend.

## 1. Create New Project in Vercel
1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub Codebase: `his-agentic` (Import it).

## 2. Configure Project Settings (CRITICAL)
Before you click "Deploy", you must edit the settings:

### A. Framework Preset
*   Vercel should auto-detect **Vite**. If not, select **Vite**.

### B. Root Directory
*   Click **Edit** next to "Root Directory".
*   Select the folder: `patient-portal`
*   *Why?* Because this frontend lives in a subfolder, not the root.

### C. Environment Variables
Expand the "Environment Variables" section and add the following keys. 

| Key | Value (Example) | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://sktmbtkr-his-agentic-backend.hf.space/api/v1` | URL of your running backend (HF Space) + `/api/v1` |
| `VITE_VOICE_URL` | `https://sktmbtkr-his-voice-agent.hf.space` | URL of your Voice Agent (HF Space) |
| `VITE_OCR_URL` | `https://sktmbtkr-his-id-ocr.hf.space` | URL of your OCR Service (HF Space) |

*(Note: Replace `sktmbtkr` with your actual HF username if different).*

## 3. Deploy
1.  Click **Deploy**.
2.  Wait for the build to finish (approx. 1-2 mins).
3.  **Success!** You will get a URL like `https://his-agentic-patient-portal.vercel.app`.

## 4. Post-Deployment: Update Backend CORS
Your backend (on Hugging Face) currently rejects requests from this new Vercel URL. You must allow it.

1.  Go to your **Hugging Face Space** -> **Settings**.
2.  Scroll to **Variables and secrets**.
3.  Find `CORS_ORIGINS`.
4.  Edit it to include your NEW Vercel URL (comma-separated).
    *   *Current*: `https://his-agentic.vercel.app`
    *   *New Value*: `https://his-agentic.vercel.app,https://your-new-patient-url.vercel.app`
5.  **Restart** the Backend Space for changes to take effect.

## 5. Verification
1.  Open the new Patient Portal URL.
2.  Try to **Login** (or Register if enabled).
3.  The request should succeed (Status 200).
