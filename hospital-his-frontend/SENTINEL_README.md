# Doctor Sentinel View

Logic for the Doctor Sentinel View has been implemented!

## How to Access
1. Log in as a Doctor (e.g., `DOC001` / `password`).
2. Navigate to **OPD** or **Patients List**.
3. Click on a patient to view their **EMR**.
4. In the EMR Header, click the **Sentinel View** button.

## Features
- **Health Score**: Real-time score based on patient signals.
- **Trend**: Improving/Declining indicator.
- **Activity Log**: History of symptoms, mood, and lifestyle logs.
- **AI Insights**: Context for the score.

## Implementation Details
- **Frontend**: `src/pages/doctor/PatientSentinel.jsx`
- **Service**: `src/services/sentinelService.js`
- **Route**: `/dashboard/sentinel/:patientId`
