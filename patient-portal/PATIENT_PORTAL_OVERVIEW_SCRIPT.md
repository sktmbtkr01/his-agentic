# Patient Portal - Technical Overview Script

## 🎬 Introduction

> "Welcome to LifelineX Patient Portal - a patient-facing web application that empowers patients to actively participate in their healthcare journey."

---

## 📊 AI vs Rule-Based Workflows Summary

| Feature | Type | Technology |
|---------|------|------------|
| **Health Score Calculation** | 🔧 Rule-Based | Mathematical formulas (NEWS2-inspired) |
| **Care Nudges** | 🔧 Rule-Based | Conditional logic triggers |
| **Lab Report AI Summary** | 🤖 AI-Powered | Google Gemini 2.0 Flash |
| **ID Card OCR** | 🤖 AI-Powered | Tesseract OCR + Regex Parsing |
| **Voice Assistant** | 🤖 AI-Powered | Speech-to-Text/TTS (External service) |
| **Trend Analysis** | 🔧 Rule-Based | Simple comparison logic |

---

## 🎯 Feature Breakdown

### 1️⃣ Health Score Engine (RULE-BASED)

**What it does:** Calculates a 0-100 health score displayed on the dashboard.

**How it works:**
```
Base Score = 100

Deductions:
├── Symptoms: severity × 10 points
│   ├── Mild = -10
│   ├── Moderate = -20
│   └── Severe = -40
├── Red Flag Symptoms: additional -20 (chest pain, breathing issues)
├── Bad Mood: -5
├── High Stress (>7): -5
└── Poor Sleep (<5 hrs): -5

Bonuses:
├── Great Mood: +5
├── Good Mood: +2
└── Active Lifestyle: +5

Final Score = max(0, min(100, calculated_score))
```

**Why rule-based?** 
- Transparent and explainable to patients
- No API costs or latency
- Deterministic results
- Inspired by clinical NEWS2 scoring

---

### 2️⃣ Care Nudges System (RULE-BASED)

**What it does:** Sends personalized health reminders and suggestions.

**Trigger Conditions:**
```javascript
// Trigger 1: Missing Log (>24 hours since last signal)
if (hoursSinceLastLog > 24) → "Time to Check In" nudge

// Trigger 2: No Hydration Log Today
if (!hydrationLogToday) → "Stay Hydrated" nudge

// Trigger 3: Declining Score OR Critical Score
if (trend === 'declining' || score < 40) → "Health Trend Alert" nudge
```

**Why rule-based?**
- Predictable behavior
- No AI hallucination risk
- Instant generation
- Easy to debug and modify

---

### 3️⃣ Lab Report AI Summary (AI-POWERED ✨)

**What it does:** Generates plain-language explanations of lab results.

**Technology:** Google Gemini 2.0 Flash (LLM)

**How it works:**
```
1. Extract text from PDF (pdf-parse or OCR fallback)
2. Send to Gemini with structured prompt
3. Return formatted markdown summary with:
   - Key Findings (abnormal values with ⚠️)
   - Normal Results
   - Clinical Notes
```

**Sample Prompt:**
> "You are a clinical lab report summarizer. Analyze this lab test report and provide a structured summary for a physician..."

**Why AI-powered?**
- Unstructured text requires NLU
- Variability in lab report formats
- Clinical interpretation needed

---

### 4️⃣ ID Card OCR (AI-POWERED ✨)

**What it does:** Extracts patient info from government ID cards (Aadhaar, PAN, etc.)

**Technology:** Tesseract OCR + Regex Pattern Matching

**How it works:**
```
1. Upload ID card image
2. Tesseract extracts raw text
3. Regex patterns extract:
   - Name (heuristics for Indian names)
   - Date of Birth (DD/MM/YYYY patterns)
   - Aadhaar Number (XXXX XXXX XXXX)
   - Gender
4. Patient reviews & confirms before saving
```

**Why AI-powered?**
- Images require computer vision
- Handwritten/printed text variation
- Multiple document formats

---

### 5️⃣ Voice Assistant (AI-POWERED ✨)

**What it does:** Hands-free appointment booking via voice.

**Technology:** External voice-agent microservice

**Components:**
- Speech-to-Text (transcription)
- Natural Language Understanding
- Text-to-Speech (response)
- WebSocket real-time communication

**Why AI-powered?**
- Natural language is inherently unstructured
- Intent classification required
- Accessibility feature

---

### 6️⃣ Trend Analysis (RULE-BASED)

**What it does:** Shows if health score is improving, stable, or declining.

**Logic:**
```javascript
const diff = currentScore - previousScore;

if (diff > 5)  → "Improving" ↑
if (diff < -5) → "Declining" ↓
else           → "Stable"   →
```

**Why rule-based?**
- Simple threshold comparison
- No complex pattern recognition needed

---

## 📱 User Journey Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT LOGIN                             │
│              (Patient ID + Date of Birth)                    │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Health Score│  │ Care Nudges │  │ Quick Actions│          │
│  │  (Rule-Based│  │ (Rule-Based)│  │             │          │
│  │   0-100)    │  │             │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
    ┌──────────────────┼──────────────────┐
    ▼                  ▼                  ▼
┌────────┐      ┌────────────┐      ┌────────────┐
│ LOG    │      │ VIEW       │      │ UPLOAD     │
│ SIGNALS│      │ RECORDS    │      │ DOCUMENTS  │
│        │      │            │      │            │
│Symptoms│      │Labs        │      │ OCR Extract│
│Mood    │      │(AI Summary)│      │ (AI)       │
│Lifestyle│     │Prescriptions│     │ Confirm    │
└────────┘      │Timeline    │      │ Save       │
                └────────────┘      └────────────┘
```

---

## 🔑 Key Takeaways

### What's AI-Powered:
1. **Lab Report Summaries** - LLM (Gemini) for text interpretation
2. **ID Card OCR** - Computer vision for image text extraction
3. **Voice Assistant** - NLU for voice commands

### What's Rule-Based:
1. **Health Score** - Formula-based calculation (transparent, no black box)
2. **Care Nudges** - Conditional triggers (deterministic)
3. **Trend Analysis** - Simple threshold comparison

### Why This Mix?
- **Rule-based for patient-facing metrics** → Explainable, no anxiety from AI unpredictability
- **AI for unstructured data processing** → Images, PDFs, voice require ML
- **Cost-efficient** → AI only where truly needed
- **Reliable** → Core features work without API dependencies

---

## 🎤 Closing Script

> "The Patient Portal strategically combines rule-based logic for transparent health scoring with AI-powered features for document processing and voice interaction. This ensures patients get reliable, explainable health insights while leveraging AI only where it adds irreplaceable value - processing images, understanding natural language, and summarizing complex medical reports."

---

**Document Version:** 1.0  
**Last Updated:** February 5, 2026
