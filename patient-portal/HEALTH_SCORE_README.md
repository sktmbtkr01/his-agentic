# Patient Health Score Calculation

## Overview

The Patient Portal Health Score is a composite metric (0-100) that provides patients with a simple, understandable indicator of their overall health status. The scoring system is **EMR Risk-Aligned**, inspired by the clinical NEWS2 (National Early Warning Score 2) scoring system used by healthcare professionals.

---

## Score Interpretation

| Score Range | Status | Color | Meaning |
|-------------|--------|-------|---------|
| **80-100** | Excellent | 🟢 Green | You're doing well. Keep it up! |
| **60-79** | Moderate | 🟡 Amber | Your score has dropped. Monitor symptoms closely. |
| **0-59** | Concerning | 🔴 Red | Potential health concern. Consult a doctor if symptoms persist. |

---

## How the Health Score is Calculated

### Step 1: Baseline Score (100 Points)

Every patient starts with a perfect health score of **100 points**.

### Step 2: Clinical Risk Deduction (Primary Factor)

The most significant impact on your health score comes from **reported symptoms**. This aligns with how clinical risk is assessed in the hospital's EMR system.

#### Symptom Severity Points:

| Severity | Base Risk Points |
|----------|------------------|
| Mild | 1 point |
| Moderate | 2 points |
| Severe | 4 points |

#### Red Flag Symptom Boosters:

Certain symptoms are considered high-priority clinical indicators and add **+2 extra risk points**:
- Shortness of breath / breathing difficulties
- Chest pain / chest discomfort
- Heart-related symptoms

#### Risk Deduction Formula:

```
Total Risk Points = Sum of all symptom risk points
Risk Deduction = Risk Points × 10
Health Score = 100 - Risk Deduction
```

**Example Calculations:**

| Scenario | Risk Points | Deduction | Final Score |
|----------|-------------|-----------|-------------|
| Mild headache | 1 | -10 | 90 |
| Moderate fatigue + Mild nausea | 2 + 1 = 3 | -30 | 70 |
| Severe chest pain (red flag) | 4 + 2 = 6 | -60 | 40 |

### Step 3: Mood Modifiers (+/- 15 points max)

Your mood and stress levels act as secondary modifiers to the score:

| Mood Type | Impact |
|-----------|--------|
| Great | +5 points |
| Good | +2 points |
| Okay | 0 points |
| Low | 0 points |
| Bad | -5 points |
| High Stress (>7/10) | -5 points |

The total mood impact is **capped at ±15 points** per calculation period.

### Step 4: Lifestyle Modifiers

Your lifestyle choices also affect the score:

| Factor | Impact |
|--------|--------|
| Sleep < 5 hours | -5 points |
| Active/Very Active lifestyle | +5 points |

### Step 5: Final Score Clamp

The final score is clamped to ensure it stays within the **0-100 range**.

---

## Trend Analysis

The system compares your current score with your previous score to determine the trend:

| Trend | Condition | Indicator |
|-------|-----------|-----------|
| 📈 **Improving** | Score increased by > 5 points | Green upward arrow |
| ➡️ **Stable** | Score changed by ≤ 5 points | Gray horizontal line |
| 📉 **Declining** | Score decreased by > 5 points | Red downward arrow |

---

## Data Sources (Patient Signals)

The health score is calculated from data you log in the Patient Portal:

### 1. Symptom Signals
- **Type**: headache, fatigue, nausea, fever, cough, chest pain, shortness of breath, etc.
- **Severity**: mild, moderate, severe
- **Duration**: minutes, hours, days
- **Notes**: Additional context

### 2. Mood Signals
- **Type**: great, good, okay, low, bad
- **Stress Level**: 1-10 scale

### 3. Lifestyle Signals
- **Sleep**: duration (hours), quality (poor/fair/good/excellent)
- **Activity**: sedentary, light, moderate, active, very active
- **Hydration**: glasses of water
- **Meals**: count per day

---

## Score Components Breakdown

The health score also tracks individual component scores (0-100 each):

| Component | Description |
|-----------|-------------|
| **Symptom Score** | Based on severity and frequency of logged symptoms |
| **Mood Score** | Based on mood type and stress levels |
| **Lifestyle Score** | Based on sleep, activity, and daily habits |
| **Vitals Score** | Based on blood pressure and heart rate stability |
| **Compliance Score** | Based on medication adherence (future feature) |

---

## Calculation Window

- **Period**: Daily (last 24 hours)
- **Active Signals Only**: Only signals marked as active are included
- **Real-time Updates**: Score recalculates when you log new signals

---

## Technical Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Patient Portal App                        │
├─────────────────────────────────────────────────────────────┤
│  Patient logs symptoms, mood, and lifestyle data            │
│                          ↓                                   │
│  Signals stored in database (last 24 hours considered)       │
│                          ↓                                   │
│  Health Score Service calculates:                            │
│    1. Clinical Risk Points from symptoms                     │
│    2. Mood modifiers                                         │
│    3. Lifestyle modifiers                                    │
│    4. Final score (0-100)                                    │
│                          ↓                                   │
│  Score + Trend + Summary displayed on Dashboard              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/patient/score` | GET | Get latest health score (calculates if needed) |
| `/api/v1/patient/score/history` | GET | Get score history for last 30 days |

---

## Alignment with EMR Risk Score

The Patient Portal health score is designed to align conceptually with the hospital's EMR Risk Score system:

| EMR Risk Score | Patient Portal Health Score |
|----------------|----------------------------|
| NEWS2 Points (from vitals) | Symptom Risk Points (from logged symptoms) |
| Lab Risk Delta | Mood Modifiers |
| Radiology Risk Delta | Lifestyle Modifiers |
| Final Risk Score (0-20+) | Inverted Health Score (100 - Risk = Health) |

**Key Difference**: The EMR tracks clinical acuity (higher = worse), while the Patient Portal tracks wellness (higher = better).

---

## Files Involved

| File | Purpose |
|------|---------|
| `patient-portal/src/services/healthScore.service.js` | Frontend API service |
| `patient-portal/src/components/HealthScoreCard.jsx` | UI component for displaying score |
| `hospital-his-backend/services/healthScore.service.js` | Core calculation logic |
| `hospital-his-backend/controllers/patient/healthScore.controller.js` | API handlers |
| `hospital-his-backend/models/HealthScore.js` | Database schema for scores |
| `hospital-his-backend/models/Signal.js` | Database schema for patient signals |

---

## Summary

The Patient Health Score provides a **simple, actionable metric** that:

1. ✅ Reflects clinical risk principles (EMR-aligned)
2. ✅ Considers symptoms, mood, and lifestyle holistically
3. ✅ Updates in real-time as patients log data
4. ✅ Shows trends to track health over time
5. ✅ Provides clear, color-coded interpretation

**Remember**: This score is a self-monitoring tool and does not replace professional medical advice. Always consult a healthcare provider for concerning symptoms.
