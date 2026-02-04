# LifelineX Patient Portal

**Product Requirements Document (PRD)**

**Version:** 1.0
**Last Updated:** February 2026
**Status:** Approved for Development

---

## 1. Executive Summary

LifelineX Patient Portal is a **web-based patient engagement platform** integrated with the LifelineX Hospital Information System (HIS).
It enables patients to access their medical information, log health signals, receive AI-assisted insights, manage appointments, and remain engaged in their care journey between hospital visits.

The portal is designed with a **clinical-first mindset**, prioritizing:

* Patient safety
* Anxiety reduction
* Observational (non-diagnostic) insights
* Seamless HIS integration

This is **not a consumer wellness app**.
It is a **hospital-grade patient interface** intended to complement clinical workflows.

---

## 2. Product Vision

Enable patients to become informed, engaged partners in their healthcare through a calm, trustworthy digital interface that connects directly with hospital systems.

---

## 3. Product Goals

* Reduce patient anxiety through calm, explainable health insights
* Improve care adherence and appointment follow-through
* Surface early health pattern changes without alarmism
* Provide easy access to hospital records, prescriptions, and lab results
* Support continuity of care between hospital visits

---

## 4. Target Users

| User Type               | Description                              | Primary Needs                           |
| ----------------------- | ---------------------------------------- | --------------------------------------- |
| Registered Patients     | Patients with existing hospital records  | View records, appointments, lab results |
| Chronic Care Patients   | Diabetes, hypertension, cardiac patients | Trend monitoring, regular logging       |
| Post-Discharge Patients | Recently discharged IPD patients         | Recovery tracking, follow-ups           |
| Family Caregivers       | Managing dependents                      | Shared access, simplified logging       |

---

## 5. Technical Architecture

### Stack Overview

| Layer      | Technology              | Notes                     |
| ---------- | ----------------------- | ------------------------- |
| Frontend   | React 18 + Vite         | Web-first, responsive     |
| Styling    | Tailwind CSS            | Matching HIS design tokens |
| State      | React Context + Hooks   | Auth and patient data     |
| API Client | Axios                   | Token refresh handling    |
| Backend    | Node.js + Express       | Shared HIS backend        |
| Database   | MongoDB                 | Patient collections       |
| AI/ML      | OpenRouter LLM API      | Scoring, summaries        |
| Auth       | JWT + Refresh Tokens    | Separate patient auth     |

---

## 6. Project Structure

```
patient-portal/
├── public/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Route-based pages
│   ├── hooks/               # Health score, nudges
│   ├── services/            # API services
│   ├── context/             # Auth, Theme contexts
│   ├── api.js               # API client
│   ├── AuthContext.jsx
│   └── App.jsx
└── index.html
```

> PWA support may be added later but is **not required for MVP**.

---

## 7. Core Modules

---

### Module 1: Authentication & Patient Access

**Purpose:** Secure, simple patient access aligned with hospital identity.

**Features**

| Feature                         | Priority |
| ------------------------------- | -------- |
| Patient login (ID + DOB or OTP) | P0       |
| JWT access + refresh tokens     | P0       |
| View / edit patient profile     | P0       |
| Session management              | P0       |

**API Endpoints**

```
POST /api/patient/auth/login
POST /api/patient/auth/refresh
POST /api/patient/auth/logout
GET  /api/patient/profile
PUT  /api/patient/profile
```

---

### Module 2: Health Signal Logging

**Purpose:** Allow patients to log health signals in a low-friction, structured manner.

**Signal Types**

* Symptoms
* Mood & stress
* Lifestyle (sleep, activity, hydration)
* Manual vitals (optional)

**Features**

| Feature             | Priority |
| ------------------- | -------- |
| Log symptoms        | P0       |
| Log mood & stress   | P0       |
| Log lifestyle       | P0       |
| View signal history | P0       |
| Manual vitals entry | P1       |

**API Endpoints**

```
POST /api/patient/signals
GET  /api/patient/signals
DELETE /api/patient/signals/:id
```

---

### Module 3: Health Score & Status

**Purpose:** Provide a **high-level health overview**, not a diagnosis.

**Features**

| Feature                                          | Priority |
| ------------------------------------------------ | -------- |
| Composite health score (0–100)                   | P0       |
| Trend indicator (improving / stable / declining) | P0       |
| One-line observational explanation               | P0       |
| Component breakdown                              | P1       |
| Historical score chart                           | P2       |

**Design Rules**

* Trend-based, not single-reading based
* Observational language only
* No clinical thresholds shown to patients

**API Endpoints**

```
GET /api/patient/status
GET /api/patient/health-score
```

---

### Module 4: Care Nudges

**Purpose:** Support patient behavior without urgency or alarmism.

**Features**

| Feature             | Priority |
| ------------------- | -------- |
| View active nudges  | P0       |
| Mark done / dismiss | P0       |
| Priority levels     | P1       |
| Scheduled reminders | P2       |

**API Endpoints**

```
GET  /api/patient/nudges
POST /api/patient/nudges/:id/respond
GET  /api/patient/nudges/history
```

---

### Module 5: Appointments

**Purpose:** Provide patients clarity and control over appointments.

**Features**

| Feature             | Priority |
| ------------------- | -------- |
| View appointments   | P0       |
| Appointment details | P0       |
| Book appointment    | P1       |
| Cancel / reschedule | P1       |

**API Endpoints**

```
GET  /api/patient/appointments
POST /api/patient/appointments
PUT  /api/patient/appointments/:id
DELETE /api/patient/appointments/:id
GET  /api/patient/slots
```

---

### Module 6: Prescriptions & Medications

**Purpose:** Transparent access to prescribed medications.

**Features**

| Feature              | Priority |
| -------------------- | -------- |
| Active prescriptions | P0       |
| Medication details   | P0       |
| Prescription history | P1       |
| Refill requests      | P2       |

**API Endpoints**

```
GET  /api/patient/prescriptions
GET  /api/patient/prescriptions/:id
GET  /api/patient/prescriptions/history
POST /api/patient/prescriptions/:id/refill
```

---

### Module 7: Lab Results & Reports

**Purpose:** Help patients understand lab data without anxiety.

**Features**

| Feature                   | Priority |
| ------------------------- | -------- |
| Lab results list          | P0       |
| Result details            | P0       |
| Abnormal highlighting     | P0       |
| AI plain-language summary | P1       |
| Download report           | P1       |
| Trend charts              | P2       |

**API Endpoints**

```
GET  /api/patient/labs
GET  /api/patient/labs/:id
GET  /api/patient/labs/:id/summary
GET  /api/patient/labs/:id/download
```

---

### Module 8: Medical Records & History

**Purpose:**
Provide patients with a unified, trustworthy view of their medical history by combining hospital records and patient-uploaded documents into a single chronological timeline.

---

#### AI-Powered OCR Document Scanning

**Objective:**
Enable patients to digitize external medical documents (prescriptions, lab reports) and integrate them into their medical history with minimal friction.

**Features**

| Feature                     | Priority |
| --------------------------- | -------- |
| Document upload (image/PDF) | P0       |
| AI-powered OCR extraction   | P0       |
| Editable OCR confirmation   | P0       |
| Document classification     | P1       |
| Secure document storage     | P0       |

**OCR Processing Flow**

1. Patient uploads document
2. OCR extracts structured data
3. Patient reviews and corrects extracted fields
4. Data is confirmed and saved
5. Document is linked to patient history

> OCR data is **never auto-finalized without patient confirmation**.

---

#### Unified Medical Timeline

**Objective:**
Present a single chronological view of the patient's healthcare journey.

**Timeline Includes**

* Patient-entered health signals
* Vital signs
* Appointments (OPD/IPD)
* Lab results
* Prescriptions
* Uploaded OCR documents

**Features**

| Feature                   | Priority |
| ------------------------- | -------- |
| Chronological timeline    | P0       |
| Clear source labels       | P0       |
| Filter and search         | P1       |
| Read-only hospital data   | P0       |
| Patient upload indicators | P0       |

**API Endpoints**

```
POST /api/patient/records/upload
POST /api/patient/records/ocr/confirm
GET  /api/patient/records/timeline
GET  /api/patient/records/documents
GET  /api/patient/records/documents/:id
```

---

### Module 9: Profile & Settings

**Features**

| Feature                  | Priority |
| ------------------------ | -------- |
| Edit profile             | P0       |
| Notification preferences | P1       |
| Language selection       | P1       |
| Privacy controls         | P2       |
| Account deletion         | P2       |

**API Endpoints**

```
GET  /api/patient/profile
PUT  /api/patient/profile
PUT  /api/patient/settings/notifications
PUT  /api/patient/settings/language
DELETE /api/patient/account
```

---

## 8. AI / ML Capabilities

* Health score computation (30-day rolling window)
* Contextual care nudge generation
* Multi-signal risk sentinel analysis
* Plain-language lab report summaries

---

## 9. Security & Compliance

* JWT authentication with refresh tokens
* HTTPS and encrypted storage
* Patient-level authorization checks
* Rate limiting and audit logs
* HIPAA-aligned PHI handling

---

## 10. UI / UX Guidelines

**Design Principles**

* Calm, clinical, reassuring
* Generous whitespace
* No alarmist visuals
* Glanceable information

**Color System** (Matching HIS Theme)

* Warm Stone neutrals for background
* Teal primary accent
* Soft amber for "attention"
* Red reserved for system errors

**Dark Mode Support**

* Full dark mode support matching HIS implementation
* Theme toggle in settings

---

## 11. Future Roadmap (Post-MVP)

**Phase 2**

* Wearable integrations
* Family profiles
* Telehealth
* Billing and insurance

**Phase 3**

* Personalized care plans
* Predictive alerts
* Multi-hospital support

**Phase 4**

* Advanced AI assistant
* Interoperability (FHIR / HL7)

---

## 12. Summary

LifelineX Patient Portal is a **hospital-grade, web-first patient interface** that prioritizes safety, clarity, and continuity of care.
It empowers patients without replacing clinicians and integrates tightly with hospital systems to support better long-term outcomes.
