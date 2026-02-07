# LifelineX Virtual Care Companion

## Migration PRD: From Patient Portal to Agentic AI Healthcare Ecosystem

**Version:** 5.0  
**Document Type:** Migration Product Requirements Document  
**Last Updated:** February 2026  
**Status:** Approved for Phased Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Architecture Vision](#3-target-architecture-vision)
4. [Agent Hospital Framework](#4-agent-hospital-framework)
5. [ML Personalization Engine](#5-ml-personalization-engine)
6. [Patient Flow Transformations](#6-patient-flow-transformations)
7. [Technical Architecture](#7-technical-architecture)
8. [Migration Strategy](#8-migration-strategy)
9. [API Specifications](#9-api-specifications)
10. [Data Models](#10-data-models)
11. [Integration Requirements](#11-integration-requirements)
12. [Security & Compliance](#12-security--compliance)
13. [UI/UX Transformation](#13-uiux-transformation)
14. [Testing Strategy](#14-testing-strategy)
15. [Rollout Plan](#15-rollout-plan)
16. [Success Metrics](#16-success-metrics)
17. [Risk Assessment](#17-risk-assessment)
18. [Appendices](#18-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This PRD defines the migration path from LifelineX Patient Portal v1.0 (passive patient portal) to LifelineX Virtual Care Companion v5.0 (proactive multi-agent AI healthcare ecosystem).

### 1.2 Strategic Shift

| Dimension | Current (v1.0) | Target (v5.0) |
|-----------|----------------|---------------|
| **Paradigm** | Reactive data logging | Proactive contextual care |
| **Interaction** | Form-based input | Voice-first conversational |
| **Intelligence** | Rule-based health score | Multi-agent ML orchestration |
| **Monitoring** | Manual signal logging | Continuous ambient sensing |
| **Scheduling** | Static appointment booking | Predictive care coordination |
| **Insights** | Basic trend display | Explainable AI predictions |
| **Engagement** | Portal visits | Ambient companion presence |

### 1.3 Business Impact Targets

| Metric | Current Baseline | Target Outcome |
|--------|------------------|----------------|
| Appointment No-Show Rate | ~25% | 15% (40% reduction) |
| Patient Adherence | ~55% | 72% (30% improvement) |
| Triage Time | 10-15 min | 5-7 min (50% faster) |
| Readmission Rate | ~12% | 9% (25% reduction) |
| Patient Engagement Score | 45/100 | 75/100 |

### 1.4 Key Stakeholders

| Stakeholder | Role | Primary Interest |
|-------------|------|------------------|
| Patients | End Users | Better care, less anxiety |
| Clinicians | Care Providers | Pre-visit context, risk alerts |
| Hospital Admin | Operations | Reduced no-shows, efficiency |
| IT/Engineering | Implementation | Scalability, maintainability |
| Compliance | Governance | HIPAA, data privacy |

---

## 2. Current State Analysis

### 2.1 Existing System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE (v1.0)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────────────────┐    │
│  │  Patient Portal  │      │    Hospital HIS Backend      │    │
│  │  (React + Vite)  │◄────►│    (Node.js + Express)       │    │
│  │                  │      │                              │    │
│  │  • Dashboard     │      │  • Auth Service              │    │
│  │  • Signal Log    │      │  • Health Score Service      │    │
│  │  • Appointments  │      │  • Patient Service           │    │
│  │  • Lab Results   │      │  • Appointment Service       │    │
│  │  • Prescriptions │      │  • ML Service (bridge)       │    │
│  │  • Voice Widget  │      │  • AI Service (LLM)          │    │
│  └──────────────────┘      └──────────────────────────────┘    │
│           │                            │                        │
│           │                            ▼                        │
│           │                ┌──────────────────────────────┐    │
│           │                │     Python ML Services       │    │
│           │                │     (FastAPI)               │    │
│           │                │  • Predictive Analytics     │    │
│           │                │  • Revenue Leakage          │    │
│           │                └──────────────────────────────┘    │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                          │
│  │   Voice Agent    │                                          │
│  │   (FastAPI)      │                                          │
│  │  • STT/TTS       │                                          │
│  │  • Intent Parse  │                                          │
│  │  • Workflow Eng  │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Current Capabilities Inventory

#### Frontend (patient-portal/src/)

| Component | Location | Status | Migration Action |
|-----------|----------|--------|------------------|
| Dashboard | `pages/Dashboard.jsx` | ✅ Active | Transform to Agent Hub |
| Health Score | `components/HealthScoreCard.jsx` | ✅ Active | Enhance with Wellness Agent |
| Voice Assistant | `components/VoiceAssistant.jsx` | ✅ Active | Upgrade to Intake Agent UI |
| Nudge System | `components/NudgeCard.jsx` | ✅ Active | Integrate with Care Coordinator |
| Symptom Logging | `pages/LogSymptom.jsx` | ✅ Active | Route through Intake Agent |
| Mood Logging | `pages/LogMood.jsx` | ✅ Active | Feed to Wellness Agent |
| Lifestyle Logging | `pages/LogLifestyle.jsx` | ✅ Active | Feed to Wellness Agent |
| Appointments | `pages/Appointments.jsx` | ✅ Active | Enhance with predictive scheduling |
| Lab Results | `pages/LabResults.jsx` | ✅ Active | Add Insights Agent summaries |
| Timeline | `pages/Timeline.jsx` | ✅ Active | Transform to Care Journey View |
| LifeLens | `pages/LifeLens.jsx` | ✅ Active | Integrate with Insights Agent |

#### Backend Services (hospital-his-backend/services/)

| Service | Location | Status | Migration Action |
|---------|----------|--------|------------------|
| Health Score | `healthScore.service.js` | ✅ Active | Expand to multi-signal fusion |
| ML Bridge | `ml.service.js` | ✅ Active | Connect to Agent Orchestrator |
| AI/LLM | `ai.service.js` | ✅ Active | Power all agent reasoning |
| Patient | `patient.service.js` | ✅ Active | Add real-time context streaming |
| Risk Score | `riskScore.service.js` | ✅ Active | Feed Insights Agent |
| Appointment | `appointment.service.js` | ✅ Active | Add predictive scheduling |
| Notification | `notification.service.js` | ✅ Active | Replace with agent nudges |

#### ML Services (hospital-his-ml/)

| Service | Location | Status | Migration Action |
|---------|----------|--------|------------------|
| OPD Predictor | `predictive_analytics/opd_predictor.py` | ✅ Active | Feed Care Coordinator |
| Bed Predictor | `predictive_analytics/bed_predictor.py` | ✅ Active | Integrate with discharge planning |
| Lab Predictor | `predictive_analytics/lab_predictor.py` | ✅ Active | Power Insights Agent |
| Time Series | `predictive_analytics/time_series.py` | ✅ Active | Expand for trend analysis |

#### Voice Agent (voice-agent/)

| Component | Location | Status | Migration Action |
|-----------|----------|--------|------------------|
| Workflow Engine | `app/orchestration/workflow_engine.py` | ✅ Active | Transform to Agent Orchestrator |
| Speech Services | `app/speech/` | ✅ Active | Enhance with streaming |
| Conversation | `app/conversation/` | ✅ Active | Deploy to all agents |
| Integration | `app/integration/` | ✅ Active | Extend for event streaming |

### 2.3 Current Limitations

| Limitation | Impact | Resolution in v5.0 |
|------------|--------|---------------------|
| Manual data entry required | Low engagement | Ambient device sync |
| Reactive appointment booking | High no-show rate | Predictive scheduling |
| Static health score | Delayed risk detection | Real-time trend analysis |
| Single-channel interaction | Limited accessibility | Voice-first + multi-modal |
| Rule-based nudges | Low personalization | RL-optimized recommendations |
| No device integration | Data gaps | Wearable/device sync layer |
| Siloed ML models | Fragmented insights | Unified personalization engine |

---

## 3. Target Architecture Vision

### 3.1 Multi-Agent Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LIFELINEX VIRTUAL CARE COMPANION v5.0                        │
│                       Multi-Agent Healthcare Ecosystem                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         PATIENT TOUCHPOINTS                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │   PWA    │  │  Voice   │  │ Wearable │  │  Kiosk   │  │ Telehealth│  │   │
│  │  │  (Web)   │  │  (Phone) │  │  (Sync)  │  │  (Walk-in│  │  (Video)  │  │   │
│  │  └─────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬──────┘  │   │
│  └────────┼────────────┼─────────────┼─────────────┼─────────────┼─────────┘   │
│           │            │             │             │             │              │
│           └────────────┴─────────────┴──────┬──────┴─────────────┘              │
│                                             │                                   │
│                                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     AGENT ORCHESTRATION LAYER                            │   │
│  │                    (LangGraph / AutoGen Framework)                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    SUPERVISOR AGENT                             │    │   │
│  │  │         (Task Routing, Context Management, Handoffs)            │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                │                                         │   │
│  │       ┌────────────────────────┼────────────────────────┐               │   │
│  │       │                        │                        │               │   │
│  │       ▼                        ▼                        ▼               │   │
│  │  ┌─────────────┐        ┌─────────────┐         ┌─────────────┐        │   │
│  │  │   INTAKE    │        │  WELLNESS   │         │    CARE     │        │   │
│  │  │   AGENT     │◄──────►│   AGENT     │◄───────►│ COORDINATOR │        │   │
│  │  │             │        │             │         │    AGENT    │        │   │
│  │  │ • Triage    │        │ • Monitor   │         │ • Schedule  │        │   │
│  │  │ • Urgency   │        │ • Nudge     │         │ • Refills   │        │   │
│  │  │ • Route     │        │ • Track     │         │ • Follow-up │        │   │
│  │  └──────┬──────┘        └──────┬──────┘         └──────┬──────┘        │   │
│  │         │                      │                       │               │   │
│  │         └──────────────────────┼───────────────────────┘               │   │
│  │                                │                                        │   │
│  │                                ▼                                        │   │
│  │                       ┌─────────────┐                                   │   │
│  │                       │  INSIGHTS   │                                   │   │
│  │                       │   AGENT     │                                   │   │
│  │                       │             │                                   │   │
│  │                       │ • Predict   │                                   │   │
│  │                       │ • Explain   │                                   │   │
│  │                       │ • Alert     │                                   │   │
│  │                       └─────────────┘                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                │                                                │
│                                ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ML PERSONALIZATION ENGINE                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │ Federated  │  │  Virtual   │  │   RLHF     │  │ On-Device  │        │   │
│  │  │  Learning  │  │Health Twin │  │  Nudging   │  │ Inference  │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                │                                                │
│                                ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       BACKEND SERVICES                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │  Event   │  │   FHIR   │  │ Serverless│  │  Agent   │  │  State   │  │   │
│  │  │  Bus     │  │   APIs   │  │  Compute │  │  Memory  │  │  Store   │  │   │
│  │  │ (Kafka)  │  │          │  │ (Lambda) │  │  (Redis) │  │(MongoDB) │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                │                                                │
│                                ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     HOSPITAL HIS INTEGRATION                             │   │
│  │         (EHR Sync, Clinical Workflows, Clinician Dashboards)            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Architectural Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Agent-First** | Every patient interaction routed through specialized agents | LangGraph orchestration |
| **Event-Driven** | Real-time context streaming over batch processing | Kafka event bus |
| **Voice-Primary** | Voice as default interaction, visual as enhancement | Web Speech API + STT/TTS |
| **Privacy-Preserving** | On-device inference, federated learning | TensorFlow.js, no raw data export |
| **Explainable AI** | Every recommendation with transparent reasoning | SHAP-like explanations |
| **Continuous Learning** | Agents adapt to individual patient patterns | RLHF, continual training |
| **Zero-Trust Security** | Verify every request, minimal data exposure | JWT + context-aware auth |

---

## 4. Agent Hospital Framework

### 4.1 Intake Agent – Intelligent Front Door

#### 4.1.1 Purpose
Real-time symptom triage that replaces static appointment booking with intelligent, risk-aware patient routing.

#### 4.1.2 Capabilities

| Capability | Description | Implementation |
|------------|-------------|----------------|
| NLP Symptom Understanding | Parse natural language symptom descriptions | Transformer-based NLP (med-BERT) |
| Urgency Classification | ML-based severity assessment | Multi-class classifier |
| Risk-Based Routing | Route to telehealth/in-person/emergency | Decision policy engine |
| Voice-First Interaction | Conversational triage flow | Web Speech API + existing STT |
| Pre-Visit Summary | Structured context for clinician | Auto-generated SOAP notes |

#### 4.1.3 Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                      INTAKE AGENT FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Patient Entry (Voice/Text/Kiosk)                               │
│          │                                                      │
│          ▼                                                      │
│  ┌───────────────────┐                                         │
│  │ Symptom Capture   │ ◄── NLP Entity Extraction               │
│  │ "I have chest     │                                         │
│  │  pain and..."     │                                         │
│  └─────────┬─────────┘                                         │
│            │                                                    │
│            ▼                                                    │
│  ┌───────────────────┐     ┌──────────────────────┐           │
│  │ Follow-up Q&A     │────►│  Context Enrichment  │           │
│  │ (Smart probing)   │     │  • Patient History   │           │
│  └─────────┬─────────┘     │  • Recent Labs       │           │
│            │               │  • Active Conditions │           │
│            │               └──────────────────────┘           │
│            ▼                                                    │
│  ┌───────────────────┐                                         │
│  │ Urgency Scoring   │ ◄── ML Classifier (NEWS2-inspired)     │
│  │ • Score: 0-10     │                                         │
│  │ • Red flags check │                                         │
│  └─────────┬─────────┘                                         │
│            │                                                    │
│            ▼                                                    │
│  ┌───────────────────────────────────────────────┐             │
│  │              ROUTING DECISION                 │             │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │             │
│  │  │Emergency│  │In-Person│  │Telehealth│       │             │
│  │  │ (Score  │  │(Score   │  │ (Score  │       │             │
│  │  │  8-10)  │  │  4-7)   │  │  0-3)   │       │             │
│  │  └────┬────┘  └────┬────┘  └────┬────┘       │             │
│  └───────┼────────────┼────────────┼────────────┘             │
│          │            │            │                           │
│          ▼            ▼            ▼                           │
│  ┌─────────────────────────────────────────────┐              │
│  │        HANDOFF TO CARE COORDINATOR          │              │
│  │  • Appointment slot suggestion              │              │
│  │  • Pre-visit summary for clinician          │              │
│  │  • Patient preparation instructions         │              │
│  └─────────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.4 API Endpoints

```yaml
# Intake Agent APIs
POST /api/v5/agents/intake/session/start
  Request:
    channel: enum[voice, text, kiosk]
    patient_id: string (optional, for returning patients)
  Response:
    session_id: string
    agent_greeting: string
    
POST /api/v5/agents/intake/symptom/capture
  Request:
    session_id: string
    input: string (natural language)
    input_type: enum[voice_transcript, text]
  Response:
    extracted_symptoms: array[Symptom]
    follow_up_questions: array[Question]
    confidence: float
    
POST /api/v5/agents/intake/triage/complete
  Request:
    session_id: string
  Response:
    urgency_score: integer (0-10)
    urgency_level: enum[emergency, urgent, routine, self_care]
    routing_recommendation: RoutingDecision
    pre_visit_summary: PreVisitSummary
    red_flags: array[string]
    explanation: string
    
GET /api/v5/agents/intake/session/{session_id}/summary
  Response:
    full_transcript: array[Message]
    extracted_data: TriageData
    clinician_summary: string
```

#### 4.1.5 Migration from Existing Components

| Current Component | Migration Path |
|-------------------|----------------|
| `VoiceAssistant.jsx` | Enhance with Intake Agent UI wrapper |
| `LogSymptom.jsx` | Route inputs through Intake Agent |
| `voiceAgentService.js` | Extend with intake-specific methods |
| Voice Agent workflows | Add triage workflow graph |

---

### 4.2 Wellness Agent – Continuous Monitoring Companion

#### 4.2.1 Purpose
24/7 adaptive health supervision that proactively monitors patient status and delivers personalized nudges.

#### 4.2.2 Capabilities

| Capability | Description | Implementation |
|------------|-------------|----------------|
| Vital Sync | Real-time sync with wearables/devices | Device integration layer |
| Trend Analysis | Time-series pattern detection | LSTM/Temporal models |
| Context-Aware Nudges | Personalized health recommendations | RLHF-optimized generation |
| Pattern Learning | Sleep, activity, medication adherence | Federated learning |
| Conversational Interface | 24/7 chat availability | LLM-powered responses |

#### 4.2.3 Device Integration Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                   DEVICE INTEGRATION LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  SUPPORTED DEVICES                        │  │
│  │                                                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │ Apple   │ │ Fitbit  │ │ Garmin  │ │ Samsung │        │  │
│  │  │ Watch   │ │         │ │         │ │ Health  │        │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │  │
│  │       │           │           │           │              │  │
│  │       └───────────┴───────────┴───────────┘              │  │
│  │                       │                                   │  │
│  │                       ▼                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │ Glucose │ │   BP    │ │ Pulse   │ │ Smart   │        │  │
│  │  │ Monitor │ │ Monitor │ │  Ox     │ │ Scale   │        │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │  │
│  │       │           │           │           │              │  │
│  │       └───────────┴─────┬─────┴───────────┘              │  │
│  │                         │                                 │  │
│  └─────────────────────────┼────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              DEVICE SYNC SERVICE                          │  │
│  │                                                          │  │
│  │  • OAuth2 integration with health platforms              │  │
│  │  • Real-time webhook receivers                           │  │
│  │  • Periodic batch sync (configurable intervals)          │  │
│  │  • Data normalization to FHIR Observation format         │  │
│  │  • Local caching for offline resilience                  │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.4 Wellness Agent State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│               WELLNESS AGENT STATE MACHINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                               │
│  │   IDLE      │◄─────────────────────────────────────┐       │
│  │ (Listening) │                                       │       │
│  └──────┬──────┘                                       │       │
│         │                                              │       │
│         │ Event: New data / Time trigger / User msg    │       │
│         ▼                                              │       │
│  ┌─────────────┐                                       │       │
│  │  ANALYZING  │                                       │       │
│  │   Context   │                                       │       │
│  └──────┬──────┘                                       │       │
│         │                                              │       │
│         ├── No action needed ──────────────────────────┘       │
│         │                                                       │
│         │ Action required                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 DECISION BRANCH                         │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  NUDGING    │  │  ALERTING   │  │ ESCALATING  │    │   │
│  │  │             │  │             │  │             │    │   │
│  │  │ • Tips      │  │ • Warnings  │  │ • To Intake │    │   │
│  │  │ • Reminders │  │ • Anomaly   │  │ • To Doctor │    │   │
│  │  │ • Goals     │  │   detected  │  │ • Emergency │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │   │
│  │         │                │                │            │   │
│  └─────────┼────────────────┼────────────────┼────────────┘   │
│            │                │                │                 │
│            ▼                ▼                ▼                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │ DELIVERING  │   │  AWAITING   │   │  HANDOFF    │          │
│  │   Nudge     │   │   Response  │   │  Complete   │          │
│  └──────┬──────┘   └──────┬──────┘   └─────────────┘          │
│         │                 │                                    │
│         │                 │ Response/Timeout                   │
│         └─────────────────┴────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.5 API Endpoints

```yaml
# Wellness Agent APIs
POST /api/v5/agents/wellness/sync/devices
  Request:
    patient_id: string
    device_type: enum[apple_health, fitbit, garmin, samsung, cgm, bp, pulse_ox]
    oauth_token: string
  Response:
    sync_status: enum[connected, pending, failed]
    last_sync: timestamp
    
GET /api/v5/agents/wellness/vitals/stream
  WebSocket: Real-time vital updates
  Response:
    patient_id: string
    vital_type: string
    value: float
    unit: string
    timestamp: timestamp
    source: string

POST /api/v5/agents/wellness/context/update
  Request:
    patient_id: string
    context_type: enum[sleep, activity, meal, medication, mood]
    data: object
  Response:
    acknowledged: boolean
    wellness_score_impact: float
    
GET /api/v5/agents/wellness/nudges/active
  Request:
    patient_id: string
  Response:
    nudges: array[Nudge]
    personalization_factors: array[string]
    
POST /api/v5/agents/wellness/chat
  Request:
    patient_id: string
    message: string
  Response:
    response: string
    suggested_actions: array[Action]
    context_used: array[string]

GET /api/v5/agents/wellness/trends/{patient_id}
  Request:
    metric: enum[heart_rate, glucose, bp, weight, sleep, activity]
    period: enum[7d, 30d, 90d]
  Response:
    trend_data: array[DataPoint]
    trend_direction: enum[improving, stable, declining]
    forecast: array[DataPoint]
    insights: array[string]
```

#### 4.2.6 Migration from Existing Components

| Current Component | Migration Path |
|-------------------|----------------|
| `HealthScoreCard.jsx` | Enhanced with Wellness Agent metrics |
| `NudgeCard.jsx` | Powered by Wellness Agent recommendations |
| `LogMood.jsx` | Feed into Wellness Agent context |
| `LogLifestyle.jsx` | Feed into Wellness Agent context |
| `healthScore.service.js` | Extend with device-sourced data |
| `nudgeService.js` | Replace with Wellness Agent API |

---

### 4.3 Care Coordinator Agent – Workflow Orchestrator

#### 4.3.1 Purpose
Optimize appointments, medication refills, and follow-ups through predictive scheduling and proactive workflow management.

#### 4.3.2 Capabilities

| Capability | Description | Implementation |
|------------|-------------|----------------|
| No-Show Prediction | ML model to predict appointment adherence | XGBoost classifier |
| Optimal Timing | RL-based appointment slot recommendation | Reinforcement learning |
| Refill Orchestration | Proactive medication refill management | Rule + ML hybrid |
| Insurance Workflow | Pre-authorization triggers | Integration with payers |
| Kiosk Sync | Walk-in flow optimization | Real-time queue management |

#### 4.3.3 Predictive Scheduling Model

```
┌─────────────────────────────────────────────────────────────────┐
│              PREDICTIVE SCHEDULING ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT FEATURES                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Patient Features:                                        │  │
│  │  • Historical no-show rate                                │  │
│  │  • Distance to clinic                                     │  │
│  │  • Insurance type                                         │  │
│  │  • Age, chronic conditions                                │  │
│  │                                                          │  │
│  │  Contextual Features:                                     │  │
│  │  • Day of week, time of day                              │  │
│  │  • Weather forecast                                       │  │
│  │  • Appointment type                                       │  │
│  │  • Lead time (days until appointment)                    │  │
│  │                                                          │  │
│  │  Behavioral Features:                                     │  │
│  │  • Recent engagement score                               │  │
│  │  • Response time to reminders                            │  │
│  │  • Last interaction timestamp                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              NO-SHOW PREDICTION MODEL                     │  │
│  │                                                          │  │
│  │  Architecture: XGBoost + Behavioral LSTM                 │  │
│  │                                                          │  │
│  │  Output:                                                 │  │
│  │  • No-show probability (0.0 - 1.0)                      │  │
│  │  • Risk factors contributing to prediction               │  │
│  │  • Confidence interval                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            INTERVENTION STRATEGY ENGINE                   │  │
│  │                                                          │  │
│  │  If P(no-show) > 0.3:                                   │  │
│  │    • Send extra reminder (SMS + Voice)                  │  │
│  │    • Offer rescheduling option                          │  │
│  │    • Suggest alternative time slots                     │  │
│  │                                                          │  │
│  │  If P(no-show) > 0.6:                                   │  │
│  │    • Personal outreach call                             │  │
│  │    • Transportation assistance offer                    │  │
│  │    • Telehealth alternative                             │  │
│  │                                                          │  │
│  │  If P(no-show) > 0.8:                                   │  │
│  │    • Double-book slot                                   │  │
│  │    • Waitlist patient assignment                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3.4 Reinforcement Learning Scheduler

```
┌─────────────────────────────────────────────────────────────────┐
│                RL APPOINTMENT OPTIMIZER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STATE SPACE:                                                   │
│  • Current slot availability                                    │
│  • Patient preference history                                   │
│  • Provider schedule                                            │
│  • Predicted demand                                             │
│                                                                 │
│  ACTION SPACE:                                                  │
│  • Suggest slot A (optimal for patient)                        │
│  • Suggest slot B (optimal for clinic)                         │
│  • Suggest slot C (balanced)                                   │
│  • Offer telehealth alternative                                │
│  • Suggest different provider                                  │
│                                                                 │
│  REWARD SIGNAL:                                                 │
│  • +10: Appointment kept                                       │
│  • +5: Rescheduled (not cancelled)                            │
│  • -5: Cancelled within 24h                                    │
│  • -10: No-show                                                │
│  • +3: Patient satisfaction score                              │
│                                                                 │
│  LEARNING:                                                      │
│  • Algorithm: Proximal Policy Optimization (PPO)               │
│  • Training: Monthly batch updates                              │
│  • Exploration: ε-greedy with decay                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3.5 API Endpoints

```yaml
# Care Coordinator Agent APIs
POST /api/v5/agents/coordinator/appointment/recommend
  Request:
    patient_id: string
    appointment_type: string
    urgency: enum[emergency, urgent, routine]
    preferences: AppointmentPreferences
  Response:
    recommended_slots: array[SlotRecommendation]
    no_show_probability: float
    optimization_reason: string
    
POST /api/v5/agents/coordinator/appointment/book
  Request:
    patient_id: string
    slot_id: string
    reminder_preferences: ReminderConfig
  Response:
    appointment_id: string
    confirmation: AppointmentConfirmation
    pre_visit_checklist: array[ChecklistItem]
    
GET /api/v5/agents/coordinator/refills/pending/{patient_id}
  Response:
    pending_refills: array[RefillRequest]
    auto_refill_eligible: array[Medication]
    attention_required: array[RefillIssue]
    
POST /api/v5/agents/coordinator/refills/request
  Request:
    patient_id: string
    medication_id: string
    pharmacy_preference: string
  Response:
    refill_status: enum[approved, pending_auth, requires_renewal]
    estimated_ready: timestamp
    instructions: string
    
GET /api/v5/agents/coordinator/workflow/status/{patient_id}
  Response:
    pending_tasks: array[WorkflowTask]
    completed_tasks: array[WorkflowTask]
    upcoming_reminders: array[Reminder]
    
POST /api/v5/agents/coordinator/kiosk/checkin
  Request:
    patient_id: string
    kiosk_id: string
    appointment_id: string
  Response:
    checkin_status: enum[success, appointment_not_found, early_arrival]
    queue_position: integer
    estimated_wait: integer (minutes)
    pre_visit_forms: array[FormLink]
```

#### 4.3.6 Migration from Existing Components

| Current Component | Migration Path |
|-------------------|----------------|
| `Appointments.jsx` | Enhanced with predictive recommendations |
| `BookAppointment.jsx` | Powered by RL scheduler |
| `appointmentService.js` | Extend with coordinator APIs |
| `Prescriptions.jsx` | Add refill orchestration |
| Voice Agent workflows | Add scheduling/refill workflows |

---

### 4.4 Insights Agent – Predictive Intelligence Layer

#### 4.4.1 Purpose
Deep personalization and outcome forecasting with explainable AI to enable proactive interventions and patient-clinician alignment.

#### 4.4.2 Capabilities

| Capability | Description | Implementation |
|------------|-------------|----------------|
| Multimodal Data Fusion | Combine labs, vitals, behavior, signals | Transformer fusion model |
| Virtual Health Twin | Patient-specific simulation model | Probabilistic digital twin |
| Lifestyle Impact Forecasting | "What-if" scenario analysis | Causal inference models |
| Explainable Predictions | Transparent AI reasoning | SHAP/LIME explanations |
| Decline Alerts | Early warning to hospital system | Anomaly detection + rules |

#### 4.4.3 Virtual Health Twin Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIRTUAL HEALTH TWIN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATA FUSION LAYER                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │  │
│  │  │  Lab    │  │ Vitals  │  │Behavior │  │ Signals │    │  │
│  │  │ Results │  │ Stream  │  │ Logs    │  │ History │    │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │  │
│  │       │           │           │           │            │  │
│  │       └───────────┴─────┬─────┴───────────┘            │  │
│  │                         │                              │  │
│  │                         ▼                              │  │
│  │              ┌──────────────────┐                      │  │
│  │              │ Multimodal       │                      │  │
│  │              │ Transformer      │                      │  │
│  │              │ Encoder          │                      │  │
│  │              └────────┬─────────┘                      │  │
│  │                       │                                │  │
│  └───────────────────────┼────────────────────────────────┘  │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PATIENT DIGITAL TWIN MODEL                   │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │           Personalized State Vector                 │ │  │
│  │  │                                                     │ │  │
│  │  │  • Metabolic parameters (glucose, A1C trajectory)   │ │  │
│  │  │  • Cardiovascular parameters (BP, HR variability)   │ │  │
│  │  │  • Behavioral parameters (sleep, activity, stress) │ │  │
│  │  │  • Medication response profile                      │ │  │
│  │  │  • Risk factor weights                              │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │           Simulation Engine                         │ │  │
│  │  │                                                     │ │  │
│  │  │  • Monte Carlo trajectory simulation                │ │  │
│  │  │  • Intervention impact modeling                     │ │  │
│  │  │  • Confidence interval generation                   │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                OUTPUT INTERFACES                          │  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │  Risk       │  │  What-If    │  │  Explainer  │      │  │
│  │  │  Forecast   │  │  Scenarios  │  │  Dashboard  │      │  │
│  │  │             │  │             │  │             │      │  │
│  │  │ • 30/60/90d │  │ • Diet Δ    │  │ • SHAP vals │      │  │
│  │  │   outlook   │  │ • Med Δ     │  │ • Feature   │      │  │
│  │  │ • Key risks │  │ • Activity Δ│  │   importance│      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.4.4 Explainable AI Framework

```yaml
# Explanation Types
Risk Score Explanation:
  type: feature_importance
  format:
    - factor: "Elevated fasting glucose (last 7 days)"
      contribution: +12
      direction: negative
      evidence: "Avg 142 mg/dL vs target <100"
    - factor: "Improved sleep consistency"
      contribution: -5
      direction: positive  
      evidence: "7.2h avg, low variance"
    - factor: "Missed BP medications (3 doses)"
      contribution: +8
      direction: negative
      evidence: "Adherence 71% vs recommended 95%"

Recommendation Explanation:
  type: causal_reasoning
  format:
    recommendation: "Consider evening workout instead of morning"
    reasoning:
      - "Your glucose levels spike in the morning (avg +45 mg/dL)"
      - "Evening activity has shown 23% better glucose response for you"
      - "Similar patients saw 15% improvement with this change"
    confidence: 0.82
    alternative_actions:
      - "Or try a 10-min walk after breakfast"
      - "Or adjust carb timing at breakfast"
```

#### 4.4.5 API Endpoints

```yaml
# Insights Agent APIs
GET /api/v5/agents/insights/risk-forecast/{patient_id}
  Request:
    horizon: enum[7d, 30d, 90d]
    conditions: array[string] (optional, filter specific conditions)
  Response:
    overall_risk: float
    risk_trend: enum[increasing, stable, decreasing]
    condition_risks: array[ConditionRisk]
    key_factors: array[RiskFactor]
    confidence: float
    explanation: RiskExplanation

POST /api/v5/agents/insights/whatif
  Request:
    patient_id: string
    scenario: WhatIfScenario
      type: enum[diet_change, medication_change, activity_change, sleep_change]
      parameters: object
  Response:
    projected_outcomes: array[ProjectedOutcome]
    confidence_intervals: array[ConfidenceInterval]
    time_to_impact: integer (days)
    side_effects: array[string]
    recommendation: string

GET /api/v5/agents/insights/health-twin/{patient_id}
  Response:
    twin_status: TwinStatus
    current_state_vector: StateVector
    trajectory_forecast: array[TrajectoryPoint]
    key_parameters: array[TwinParameter]
    last_updated: timestamp

POST /api/v5/agents/insights/explain
  Request:
    patient_id: string
    prediction_type: enum[risk_score, recommendation, alert]
    prediction_id: string
  Response:
    explanation: Explanation
    feature_contributions: array[FeatureContribution]
    similar_cases: array[AnonymizedCase]
    confidence: float
    
POST /api/v5/agents/insights/alert/escalate
  Request:
    patient_id: string
    alert_type: enum[decline_risk, anomaly_detected, threshold_breach]
    severity: enum[low, medium, high, critical]
    data: AlertData
  Response:
    escalation_id: string
    routed_to: array[Recipient]
    action_required: boolean
    response_deadline: timestamp
```

#### 4.4.6 Migration from Existing Components

| Current Component | Migration Path |
|-------------------|----------------|
| `LifeLens.jsx` | Integrate Insights Agent visualizations |
| `Timeline.jsx` | Add predictive annotations |
| `LabResults.jsx` | Add trend forecasting + explanations |
| `riskScore.service.js` | Extend with Insights Agent |
| `ml.service.js` | Add Insights Agent bridge |
| Predictive Analytics services | Feed Insights Agent |

---

## 5. ML Personalization Engine

### 5.1 Architecture Overview

The ML Personalization Engine is a centralized intelligence layer accessed by all agents for hyper-personalized recommendations.

```
┌─────────────────────────────────────────────────────────────────┐
│                 ML PERSONALIZATION ENGINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  FEDERATED LEARNING HUB                   │  │
│  │                                                          │  │
│  │  • Privacy-preserving model updates                      │  │
│  │  • Distributed across patient devices                    │  │
│  │  • Aggregated without raw data exposure                  │  │
│  │                                                          │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │  │
│  │  │  Patient   │ │  Patient   │ │  Patient   │           │  │
│  │  │  Device 1  │ │  Device 2  │ │  Device N  │   ...     │  │
│  │  │  (TF.js)   │ │  (TF.js)   │ │  (TF.js)   │           │  │
│  │  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘           │  │
│  │         │              │              │                  │  │
│  │         └──────────────┼──────────────┘                  │  │
│  │                        │                                 │  │
│  │                        ▼                                 │  │
│  │              ┌──────────────────┐                       │  │
│  │              │   Aggregation    │                       │  │
│  │              │     Server       │                       │  │
│  │              │  (Model Updates) │                       │  │
│  │              └──────────────────┘                       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                ON-DEVICE INFERENCE ENGINE                 │  │
│  │                                                          │  │
│  │  • Sensitive predictions run locally (TensorFlow.js)     │  │
│  │  • Models downloaded, data never uploaded               │  │
│  │  • Real-time inference for quick responses              │  │
│  │                                                          │  │
│  │  Models:                                                 │  │
│  │  • Anomaly detection (vitals)                           │  │
│  │  • Mood prediction                                      │  │
│  │  • Activity classification                              │  │
│  │  • Sleep quality scoring                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                RLHF NUDGE OPTIMIZATION                    │  │
│  │                                                          │  │
│  │  • Nudge content generation via LLM                     │  │
│  │  • A/B testing with patient feedback                    │  │
│  │  • Continuous reward signal from engagement             │  │
│  │  • Personalized tone, timing, frequency                 │  │
│  │                                                          │  │
│  │  Reward Signals:                                        │  │
│  │  • Nudge acted upon: +1                                 │  │
│  │  • Nudge dismissed: -0.2                                │  │
│  │  • Goal achieved: +2                                    │  │
│  │  • Negative feedback: -1                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              VIRTUAL TWIN SIMULATION                      │  │
│  │                                                          │  │
│  │  • Patient-specific health model                        │  │
│  │  • Lifestyle adjustment simulations                     │  │
│  │  • Treatment response predictions                       │  │
│  │  • "What-if" scenario engine                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Model Registry

| Model | Purpose | Training | Inference Location |
|-------|---------|----------|-------------------|
| Symptom NLP | Entity extraction from natural language | Batch (weekly) | Cloud |
| Urgency Classifier | Triage severity scoring | Batch (weekly) | Cloud |
| No-Show Predictor | Appointment adherence | Batch (daily) | Cloud |
| Vital Anomaly Detector | Real-time anomaly detection | Federated | On-device |
| Trend Forecaster | Time-series prediction | Batch (daily) | Cloud |
| Nudge Generator | Personalized recommendation content | RLHF (continuous) | Cloud |
| Health Twin Core | Patient-specific simulation | Personalized (per patient) | Cloud |
| Activity Classifier | Motion-based activity recognition | Federated | On-device |

### 5.3 Data Flow

```yaml
# Example: Wellness Agent querying Personalization Engine

Agent Request:
  agent: wellness_agent
  patient_id: "PAT-12345"
  query_type: nudge_recommendation
  context:
    recent_vitals:
      glucose_avg_7d: 145
      bp_avg_7d: "135/88"
      sleep_avg_7d: 6.2
    recent_behavior:
      medication_adherence: 0.78
      activity_minutes_7d: 120
    current_state:
      time_of_day: "morning"
      last_meal: "2h ago"

Engine Response:
  nudge:
    type: activity_reminder
    content: "Good morning! A short walk now could help with your morning glucose levels. Even 10 minutes helps."
    tone: encouraging
    urgency: low
  personalization_factors:
    - "Morning glucose spikes detected"
    - "Activity correlation with glucose improvement: 0.72"
    - "Patient preference: gentle reminders"
  confidence: 0.85
  alternative_nudges:
    - type: medication_reminder
      reason: "2 missed doses this week"
```

---

## 6. Patient Flow Transformations

### 6.1 Digital Front Door (Replaces Static Booking)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIGITAL FRONT DOOR FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ENTRY POINTS                                                   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐               │
│  │  PWA   │  │ Phone  │  │ Smart  │  │ Kiosk  │               │
│  │ Voice  │  │ Call   │  │Speaker │  │Walk-in │               │
│  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘               │
│      │           │           │           │                      │
│      └───────────┴───────────┴───────────┘                      │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   INTAKE AGENT                            │  │
│  │                                                          │  │
│  │  "Hi [Name], I'm here to help. What brings you in?"     │  │
│  │                                                          │  │
│  │  • Voice-first interaction                               │  │
│  │  • NLP symptom capture                                   │  │
│  │  • Contextual follow-up questions                        │  │
│  │  • Real-time urgency assessment                         │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 TRIAGE DECISION                           │  │
│  │                                                          │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐            │  │
│  │  │ EMERGENCY │  │ IN-PERSON │  │ TELEHEALTH│            │  │
│  │  │  (8-10)   │  │   (4-7)   │  │   (0-3)   │            │  │
│  │  │           │  │           │  │           │            │  │
│  │  │ Direct to │  │ Schedule  │  │ Instant   │            │  │
│  │  │ ED / Call │  │ Priority  │  │ Video or  │            │  │
│  │  │   911     │  │ Slot      │  │ Chat      │            │  │
│  │  └───────────┘  └───────────┘  └───────────┘            │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CARE COORDINATOR HANDOFF                     │  │
│  │                                                          │  │
│  │  • Optimal slot recommendation                           │  │
│  │  • Pre-visit checklist generation                       │  │
│  │  • Clinician summary preparation                        │  │
│  │  • Reminder scheduling                                   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Ambient Health Companion (Replaces Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│               AMBIENT HEALTH COMPANION VIEW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PERSISTENT WELLNESS DASHBOARD                │  │
│  │                                                          │  │
│  │  ┌─────────────────────┐  ┌────────────────────────────┐│  │
│  │  │   WELLNESS SCORE    │  │     ACTIVE HEALTH QUESTS   ││  │
│  │  │        82/100       │  │                            ││  │
│  │  │                     │  │  ☐ Complete 8000 steps     ││  │
│  │  │   ↗ Improving       │  │  ☑ Log morning glucose     ││  │
│  │  │  "Great sleep week" │  │  ☐ Take evening walk       ││  │
│  │  │                     │  │  ☐ Medication check-in     ││  │
│  │  └─────────────────────┘  └────────────────────────────┘│  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │              PREDICTIVE INSIGHTS                     ││  │
│  │  │                                                     ││  │
│  │  │  ⚠ Glucose trending up this week                   ││  │
│  │  │    "Consider reducing carbs at dinner"             ││  │
│  │  │                                                     ││  │
│  │  │  ✓ Blood pressure stable                           ││  │
│  │  │    "Medication adherence looks good"               ││  │
│  │  │                                                     ││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │              UPCOMING CARE TASKS                     ││  │
│  │  │                                                     ││  │
│  │  │  📅 Dr. Smith appointment in 3 days                ││  │
│  │  │  💊 Refill ready for pickup                        ││  │
│  │  │  🔬 Lab work due next week                         ││  │
│  │  │                                                     ││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  QUICK ACTIONS                            │  │
│  │                                                          │  │
│  │  🎤 "Hey LifelineX"   📸 Scan Medication   💬 Chat      │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Collaborative Care Loop

```
┌─────────────────────────────────────────────────────────────────┐
│               COLLABORATIVE CARE LOOP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PATIENT SIDE                     CLINICIAN SIDE               │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │                 │              │                  │          │
│  │  Continuous     │              │  Patient         │          │
│  │  Data Streaming │──────────────│  Risk Dashboard  │          │
│  │                 │              │                  │          │
│  │  • Vitals       │              │  • Risk scores   │          │
│  │  • Symptoms     │              │  • Trend alerts  │          │
│  │  • Behavior     │              │  • Predictions   │          │
│  │  • Signals      │              │  • Explanations  │          │
│  │                 │              │                  │          │
│  └─────────────────┘              └─────────────────┘          │
│           │                                │                    │
│           │                                │                    │
│           ▼                                ▼                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                        │    │
│  │               INSIGHTS AGENT                           │    │
│  │                                                        │    │
│  │  • Monitors all patient data                          │    │
│  │  • Detects decline risk patterns                      │    │
│  │  • Generates explainable predictions                  │    │
│  │  • Triggers alerts when thresholds crossed            │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          │ Risk threshold crossed               │
│                          ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                        │    │
│  │            ESCALATION PROTOCOL                         │    │
│  │                                                        │    │
│  │  LOW RISK:     Wellness Agent nudge                   │    │
│  │  MEDIUM RISK:  Care Coordinator outreach              │    │
│  │  HIGH RISK:    Clinician alert + auto-referral        │    │
│  │  CRITICAL:     Emergency protocol + direct contact    │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Community Intelligence Layer

```
┌─────────────────────────────────────────────────────────────────┐
│               COMMUNITY INTELLIGENCE LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          PRIVACY-PRESERVING CLUSTERING                    │  │
│  │                                                          │  │
│  │  • Patients clustered by condition profile               │  │
│  │  • No PII shared between patients                        │  │
│  │  • Differential privacy for aggregations                 │  │
│  │                                                          │  │
│  │  Clusters:                                               │  │
│  │  • Diabetes Type 2 (newly diagnosed)                    │  │
│  │  • Hypertension (well-controlled)                       │  │
│  │  • Post-cardiac event (recovery)                        │  │
│  │  • ...                                                   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          ANONYMOUS PEER SUPPORT                           │  │
│  │                                                          │  │
│  │  "3 people similar to you found morning walks helpful"  │  │
│  │  "Join 12 others managing similar conditions"           │  │
│  │                                                          │  │
│  │  • Optional anonymous forums                            │  │
│  │  • Peer success stories (anonymized)                    │  │
│  │  • Group challenges                                     │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          POPULATION HEALTH INSIGHTS                       │  │
│  │                                                          │  │
│  │  For Hospital System:                                    │  │
│  │  • Aggregated trend detection                           │  │
│  │  • Epidemic early warning                               │  │
│  │  • Resource demand forecasting                          │  │
│  │  • Community health patterns                            │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Technical Architecture

### 7.1 Stack Overview

| Layer | Current | Target v5.0 | Migration Strategy |
|-------|---------|-------------|-------------------|
| **Frontend** | React 18 + Vite | PWA + Voice-First + TF.js | Enhance existing, add PWA manifest |
| **Voice** | Web Speech API + Voice Agent | Enhanced with streaming STT/TTS | Extend current implementation |
| **Backend** | Node.js + Express | Node.js + Kafka Event Bus + FHIR | Add event layer, keep core |
| **Agent Orchestration** | None | LangGraph / AutoGen | New service layer |
| **ML Inference** | Python FastAPI | PyTorch + TF.js (on-device) | Extend existing, add TF.js |
| **Database** | MongoDB | MongoDB + Redis (agent state) | Add Redis for real-time |
| **Compute** | Traditional server | AWS Lambda (serverless) | Gradual migration |
| **Security** | JWT | Zero-trust + JWT | Enhance existing |

### 7.2 New Components to Build

```
┌─────────────────────────────────────────────────────────────────┐
│                  NEW COMPONENTS REQUIRED                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AGENT ORCHESTRATION SERVICE (NEW)                             │
│  Location: agent-orchestrator/                                  │
│  ├── agents/                                                   │
│  │   ├── intake_agent.py                                       │
│  │   ├── wellness_agent.py                                     │
│  │   ├── coordinator_agent.py                                  │
│  │   └── insights_agent.py                                     │
│  ├── orchestration/                                            │
│  │   ├── supervisor.py                                         │
│  │   ├── state_manager.py                                      │
│  │   └── handoff_protocol.py                                   │
│  ├── memory/                                                   │
│  │   ├── conversation_memory.py                                │
│  │   └── patient_context.py                                    │
│  └── tools/                                                    │
│      ├── his_integration.py                                    │
│      ├── ml_engine_client.py                                   │
│      └── notification_sender.py                                │
│                                                                 │
│  DEVICE SYNC SERVICE (NEW)                                     │
│  Location: device-sync/                                        │
│  ├── connectors/                                               │
│  │   ├── apple_health.py                                       │
│  │   ├── fitbit.py                                             │
│  │   ├── garmin.py                                             │
│  │   └── generic_bluetooth.py                                  │
│  ├── normalizers/                                              │
│  │   └── fhir_observation.py                                   │
│  └── streaming/                                                │
│      └── vital_stream.py                                       │
│                                                                 │
│  EVENT BUS (NEW)                                               │
│  Technology: Kafka / AWS EventBridge                           │
│  Topics:                                                       │
│  ├── patient.signal.created                                    │
│  ├── patient.vital.updated                                     │
│  ├── agent.task.assigned                                       │
│  ├── agent.escalation.triggered                                │
│  └── care.appointment.updated                                  │
│                                                                 │
│  ON-DEVICE ML MODELS (NEW)                                     │
│  Location: patient-portal/public/models/                       │
│  ├── anomaly_detector.json                                     │
│  ├── mood_predictor.json                                       │
│  └── activity_classifier.json                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Modified Components

```
┌─────────────────────────────────────────────────────────────────┐
│              EXISTING COMPONENTS TO MODIFY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PATIENT PORTAL FRONTEND                                       │
│  patient-portal/src/                                           │
│  ├── components/                                               │
│  │   ├── VoiceAssistant.jsx → AgentInterface.jsx              │
│  │   ├── HealthScoreCard.jsx → WellnessScoreCard.jsx          │
│  │   └── NudgeCard.jsx → SmartNudgeCard.jsx                   │
│  ├── pages/                                                    │
│  │   ├── Dashboard.jsx → AgentHub.jsx                         │
│  │   └── [Add] AmbientCompanion.jsx                           │
│  ├── services/                                                 │
│  │   ├── [Add] agentService.js                                │
│  │   ├── [Add] deviceSyncService.js                           │
│  │   └── [Add] onDeviceMLService.js                           │
│  └── hooks/                                                    │
│      └── [Add] useAgentContext.js                             │
│                                                                 │
│  HIS BACKEND                                                   │
│  hospital-his-backend/                                         │
│  ├── services/                                                 │
│  │   ├── healthScore.service.js → Enhanced                    │
│  │   ├── ml.service.js → Add agent bridge                     │
│  │   └── [Add] agentBridge.service.js                         │
│  ├── routes/                                                   │
│  │   └── [Add] agent.routes.js                                │
│  └── controllers/                                              │
│      └── [Add] agent.controller.js                            │
│                                                                 │
│  VOICE AGENT                                                   │
│  voice-agent/app/                                              │
│  ├── orchestration/                                            │
│  │   └── workflow_engine.py → Integrate with Agent Orchestrator│
│  └── conversation/                                             │
│      └── intent_parser.py → Enhanced for all agents           │
│                                                                 │
│  ML SERVICES                                                   │
│  hospital-his-ml/                                              │
│  ├── predictive_analytics/                                     │
│  │   └── [Add] patient_risk_forecaster.py                     │
│  └── [Add] personalization_engine/                            │
│      ├── federated_aggregator.py                              │
│      ├── nudge_optimizer.py                                   │
│      └── health_twin.py                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Migration Strategy

### 8.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION PHASES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: FOUNDATION (Weeks 1-6)                               │
│  ────────────────────────────────                              │
│  • Set up Agent Orchestration infrastructure                   │
│  • Implement Supervisor Agent                                  │
│  • Add event bus (Kafka/EventBridge)                          │
│  • Create agent state store (Redis)                           │
│  • Build agent communication protocols                         │
│                                                                 │
│  PHASE 2: INTAKE AGENT (Weeks 7-10)                           │
│  ────────────────────────────────────                          │
│  • Build Intake Agent with NLP triage                         │
│  • Integrate with existing Voice Agent                        │
│  • Implement urgency classifier                               │
│  • Add routing logic to Care Coordinator                      │
│  • Deploy triage UI in patient portal                         │
│                                                                 │
│  PHASE 3: WELLNESS AGENT (Weeks 11-16)                        │
│  ──────────────────────────────────────                        │
│  • Build device sync layer                                    │
│  • Implement vital streaming                                  │
│  • Create trend analysis models                               │
│  • Deploy on-device TensorFlow.js models                      │
│  • Build adaptive nudge system                                │
│  • Launch ambient companion dashboard                         │
│                                                                 │
│  PHASE 4: CARE COORDINATOR (Weeks 17-20)                      │
│  ─────────────────────────────────────────                     │
│  • Build no-show prediction model                             │
│  • Implement RL appointment optimizer                         │
│  • Add refill orchestration                                   │
│  • Integrate kiosk flow                                       │
│  • Deploy predictive scheduling UI                            │
│                                                                 │
│  PHASE 5: INSIGHTS AGENT (Weeks 21-26)                        │
│  ──────────────────────────────────────                        │
│  • Build multimodal fusion model                              │
│  • Implement virtual health twin                              │
│  • Add explainable AI layer (SHAP)                           │
│  • Create what-if simulation engine                           │
│  • Deploy patient + clinician dashboards                      │
│                                                                 │
│  PHASE 6: INTEGRATION & OPTIMIZATION (Weeks 27-30)            │
│  ─────────────────────────────────────────────────             │
│  • Full agent collaboration testing                           │
│  • ML model fine-tuning                                       │
│  • Performance optimization                                    │
│  • Security audit                                             │
│  • Staged rollout                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Detailed Phase 1: Foundation

#### Week 1-2: Infrastructure Setup

```yaml
Tasks:
  - name: Set up Agent Orchestrator Service
    description: Create new Python service for agent management
    deliverables:
      - agent-orchestrator/ directory structure
      - Base agent class with common interfaces
      - Supervisor agent skeleton
      - Health check endpoints
    
  - name: Deploy Redis for Agent State
    description: Add Redis for real-time agent state management
    deliverables:
      - Redis deployment (local dev + staging)
      - Connection configuration
      - State schema design
      
  - name: Initialize Event Bus
    description: Set up Kafka or AWS EventBridge
    deliverables:
      - Event bus deployment
      - Topic definitions
      - Producer/consumer libraries
```

#### Week 3-4: Agent Communication Framework

```yaml
Tasks:
  - name: Implement Handoff Protocol
    description: Define how agents transfer control
    deliverables:
      - Handoff message schema
      - Context preservation logic
      - Escalation rules
      
  - name: Build HIS Integration Tools
    description: Agent tools for backend communication
    deliverables:
      - REST API client for agents
      - Authentication handling
      - Error recovery logic
      
  - name: Create Memory System
    description: Conversation and context memory
    deliverables:
      - Short-term conversation memory
      - Long-term patient context
      - Memory retrieval APIs
```

#### Week 5-6: Integration Testing

```yaml
Tasks:
  - name: Supervisor Agent Testing
    description: Test task routing and orchestration
    deliverables:
      - Unit tests for routing logic
      - Integration tests with backend
      - Load testing results
      
  - name: Event Bus Integration
    description: Connect backend to event bus
    deliverables:
      - Event producers in HIS backend
      - Event consumers in Agent Orchestrator
      - End-to-end event flow testing
```

### 8.3 Detailed Phase 2: Intake Agent

#### Week 7-8: NLP & Classification

```yaml
Tasks:
  - name: Symptom NLP Model
    description: Train medical entity extraction model
    model_spec:
      architecture: BioBERT / ClinicalBERT fine-tuned
      entities:
        - symptom_type
        - body_location
        - severity
        - duration
        - associated_factors
      training_data: Synthetic + de-identified notes
      
  - name: Urgency Classifier
    description: Multi-class severity classifier
    model_spec:
      architecture: XGBoost / Neural Network
      classes:
        - emergency (8-10)
        - urgent (6-7)
        - standard (3-5)
        - self_care (0-2)
      features:
        - extracted symptoms
        - patient history
        - vital signs (if available)
        - red flag patterns
```

#### Week 9-10: Integration & UI

```yaml
Tasks:
  - name: Voice Agent Integration
    description: Connect Intake Agent to existing voice workflows
    deliverables:
      - New triage workflow in voice-agent
      - Streaming response handling
      - Voice-to-agent message bridge
      
  - name: Triage UI Components
    description: Frontend for Intake Agent interaction
    deliverables:
      - AgentTriageChat.jsx component
      - Voice input integration
      - Urgency score display
      - Routing result presentation
```

### 8.4 Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| ML model accuracy insufficient | Medium | High | Start with rule-based fallback, iterate |
| Device integration complexity | High | Medium | Focus on top 3 devices first |
| Performance degradation | Medium | High | Comprehensive load testing, caching |
| User adoption resistance | Medium | Medium | Gradual rollout, feedback loops |
| HIPAA compliance gaps | Low | Critical | Security audit at each phase |

---

## 9. API Specifications

### 9.1 Agent Orchestration APIs

```yaml
# ============================================
# SUPERVISOR AGENT APIs
# ============================================

POST /api/v5/orchestrator/session/start
  Description: Start new patient interaction session
  Request:
    patient_id: string
    channel: enum[voice, text, kiosk, ambient]
    initial_context: object (optional)
  Response:
    session_id: string
    assigned_agent: enum[intake, wellness, coordinator, insights]
    agent_greeting: string

POST /api/v5/orchestrator/message
  Description: Send message to current agent
  Request:
    session_id: string
    message: string
    message_type: enum[text, voice_transcript, action]
    metadata: object (optional)
  Response:
    agent_response: string
    suggested_actions: array[Action]
    handoff_pending: boolean
    current_agent: string

POST /api/v5/orchestrator/handoff
  Description: Request agent handoff
  Request:
    session_id: string
    target_agent: enum[intake, wellness, coordinator, insights]
    reason: string
    context_to_transfer: object
  Response:
    handoff_status: enum[success, pending, rejected]
    new_agent: string
    transition_message: string

GET /api/v5/orchestrator/session/{session_id}
  Description: Get session status and history
  Response:
    session_id: string
    patient_id: string
    current_agent: string
    agent_history: array[AgentInteraction]
    context: object
    created_at: timestamp
    last_activity: timestamp

POST /api/v5/orchestrator/session/{session_id}/end
  Description: End session and generate summary
  Response:
    summary: SessionSummary
    outcomes: array[Outcome]
    follow_up_tasks: array[Task]

# ============================================
# AGENT STATE APIs
# ============================================

GET /api/v5/orchestrator/agents/status
  Description: Get all agent operational status
  Response:
    agents:
      - id: "intake"
        status: enum[active, degraded, offline]
        active_sessions: integer
        avg_response_time_ms: integer
      - id: "wellness"
        status: ...
      - ...

POST /api/v5/orchestrator/agents/{agent_id}/health
  Description: Agent health reporting (internal)
  Request:
    agent_id: string
    metrics:
      memory_usage: float
      active_tasks: integer
      error_rate: float
```

### 9.2 Event Bus Topics

```yaml
# ============================================
# KAFKA TOPICS / EVENT SCHEMAS
# ============================================

Topic: patient.signal.created
Schema:
  patient_id: string
  signal_type: enum[symptom, mood, lifestyle, vital]
  signal_data: object
  source: enum[manual, device, inferred]
  timestamp: timestamp
  
Topic: patient.vital.updated
Schema:
  patient_id: string
  vital_type: enum[heart_rate, blood_pressure, glucose, spo2, weight, temperature]
  value: float
  unit: string
  source: string
  timestamp: timestamp
  is_anomaly: boolean (optional)

Topic: agent.task.assigned
Schema:
  task_id: string
  agent_id: string
  task_type: string
  patient_id: string
  priority: enum[low, medium, high, critical]
  payload: object
  deadline: timestamp (optional)

Topic: agent.escalation.triggered
Schema:
  escalation_id: string
  source_agent: string
  target: enum[agent, clinician, emergency]
  patient_id: string
  severity: enum[low, medium, high, critical]
  reason: string
  context: object
  timestamp: timestamp

Topic: care.appointment.updated
Schema:
  appointment_id: string
  patient_id: string
  event_type: enum[created, confirmed, cancelled, rescheduled, completed, no_show]
  details: object
  timestamp: timestamp

Topic: ml.prediction.generated
Schema:
  prediction_id: string
  patient_id: string
  model: string
  prediction_type: enum[risk_score, no_show, trend, recommendation]
  result: object
  confidence: float
  timestamp: timestamp
```

---

## 10. Data Models

### 10.1 Agent Session Model

```javascript
// MongoDB Schema: AgentSession
const AgentSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  channel: { type: String, enum: ['voice', 'text', 'kiosk', 'ambient'], required: true },
  
  currentAgent: { 
    type: String, 
    enum: ['intake', 'wellness', 'coordinator', 'insights', 'supervisor'],
    required: true 
  },
  
  agentHistory: [{
    agent: String,
    startedAt: Date,
    endedAt: Date,
    handoffReason: String,
    messageCount: Number
  }],
  
  context: {
    symptoms: [{ type: String, severity: String, onset: String }],
    triageScore: Number,
    activeConditions: [String],
    recentVitals: mongoose.Schema.Types.Mixed,
    preferences: mongoose.Schema.Types.Mixed
  },
  
  messages: [{
    role: { type: String, enum: ['user', 'agent', 'system'] },
    content: String,
    agent: String,
    timestamp: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  outcomes: [{
    type: { type: String },
    result: mongoose.Schema.Types.Mixed,
    timestamp: Date
  }],
  
  status: { type: String, enum: ['active', 'paused', 'completed', 'abandoned'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date
});
```

### 10.2 Wellness Context Model

```javascript
// MongoDB Schema: WellnessContext
const WellnessContextSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true },
  
  deviceConnections: [{
    deviceType: { type: String, enum: ['apple_health', 'fitbit', 'garmin', 'samsung', 'cgm', 'bp_monitor', 'pulse_ox', 'scale'] },
    connectionStatus: { type: String, enum: ['connected', 'disconnected', 'error'] },
    lastSync: Date,
    syncFrequency: String, // cron expression
    oauthToken: String, // encrypted
    refreshToken: String // encrypted
  }],
  
  vitalBaselines: {
    heartRate: { min: Number, max: Number, avg: Number },
    bloodPressure: { systolicAvg: Number, diastolicAvg: Number },
    glucose: { fastingAvg: Number, postMealAvg: Number },
    weight: { current: Number, trend: String },
    spo2: { avg: Number }
  },
  
  behaviorPatterns: {
    sleepSchedule: { avgBedtime: String, avgWakeTime: String, avgDuration: Number },
    activityLevel: { avgSteps: Number, avgActiveMinutes: Number },
    medicationAdherence: { rate: Number, missedDoses: [{ medication: String, date: Date }] }
  },
  
  activeNudges: [{
    nudgeId: String,
    type: String,
    content: String,
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    createdAt: Date,
    expiresAt: Date,
    status: { type: String, enum: ['pending', 'viewed', 'acted', 'dismissed'] }
  }],
  
  healthQuests: [{
    questId: String,
    title: String,
    description: String,
    type: { type: String, enum: ['daily', 'weekly', 'challenge'] },
    target: mongoose.Schema.Types.Mixed,
    progress: mongoose.Schema.Types.Mixed,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['active', 'completed', 'failed', 'skipped'] }
  }],
  
  wellnessScore: {
    current: Number,
    trend: { type: String, enum: ['improving', 'stable', 'declining'] },
    lastCalculated: Date,
    components: {
      vitals: Number,
      activity: Number,
      sleep: Number,
      medication: Number,
      mood: Number
    }
  },
  
  updatedAt: { type: Date, default: Date.now }
});
```

### 10.3 Prediction Model

```javascript
// MongoDB Schema: PatientPrediction
const PatientPredictionSchema = new mongoose.Schema({
  predictionId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  predictionType: {
    type: String,
    enum: ['risk_forecast', 'no_show', 'adherence', 'decline_alert', 'recommendation'],
    required: true
  },
  
  modelId: { type: String, required: true }, // Model version identifier
  modelVersion: String,
  
  input: {
    features: mongoose.Schema.Types.Mixed,
    timeWindow: { start: Date, end: Date }
  },
  
  output: {
    prediction: mongoose.Schema.Types.Mixed,
    probability: Number,
    confidence: Number,
    confidenceInterval: { lower: Number, upper: Number }
  },
  
  explanation: {
    type: { type: String, enum: ['feature_importance', 'causal', 'rule_based'] },
    topFactors: [{
      factor: String,
      contribution: Number,
      direction: { type: String, enum: ['positive', 'negative'] },
      evidence: String
    }],
    narrative: String
  },
  
  actions: [{
    actionType: String,
    description: String,
    priority: { type: String, enum: ['suggested', 'recommended', 'required'] },
    status: { type: String, enum: ['pending', 'taken', 'skipped'] }
  }],
  
  validation: {
    actualOutcome: mongoose.Schema.Types.Mixed,
    outcomeDate: Date,
    wasAccurate: Boolean
  },
  
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});
```

---

## 11. Integration Requirements

### 11.1 EHR/FHIR Integration

```yaml
# FHIR Resources to Support
Resources:
  - Patient: Demographics, identifiers
  - Observation: Vitals, lab results, device readings
  - Condition: Active diagnoses, problems
  - MedicationStatement: Current medications
  - Appointment: Scheduling data
  - DiagnosticReport: Lab panels, imaging
  - CarePlan: Treatment plans, goals
  
# Integration Endpoints
FHIR Server:
  base_url: ${HIS_FHIR_URL}/fhir/R4
  auth: OAuth2 + SMART on FHIR
  
Operations:
  - GET /Patient/{id}
  - GET /Observation?patient={id}&category=vital-signs
  - POST /Observation (for device sync data)
  - GET /Condition?patient={id}&clinical-status=active
  - GET /MedicationStatement?patient={id}&status=active
  - POST /Appointment
  - GET /DiagnosticReport?patient={id}
```

### 11.2 Wearable Device Integration

```yaml
# Apple HealthKit
Integration:
  type: OAuth2 + HealthKit API
  data_types:
    - HKQuantityTypeIdentifierHeartRate
    - HKQuantityTypeIdentifierBloodPressureSystolic
    - HKQuantityTypeIdentifierBloodPressureDiastolic
    - HKQuantityTypeIdentifierBloodGlucose
    - HKQuantityTypeIdentifierStepCount
    - HKCategoryTypeIdentifierSleepAnalysis
  sync_mode: background + real-time (when available)

# Fitbit
Integration:
  type: OAuth2 + Fitbit Web API
  endpoints:
    - GET /1/user/-/activities/heart/date/{date}/1d.json
    - GET /1/user/-/sleep/date/{date}.json
    - GET /1/user/-/activities/date/{date}.json
  webhook: true (for real-time updates)

# Garmin Connect
Integration:
  type: OAuth1 + Garmin Health API
  data_types:
    - Daily summaries
    - Activity details
    - Sleep data
    - Stress data
  
# Generic Bluetooth (CGM, BP, Pulse Ox)
Integration:
  type: Web Bluetooth API + manufacturer SDKs
  supported_devices:
    - Dexcom CGM
    - Omron BP monitors
    - Withings scales
    - Nonin pulse oximeters
```

---

## 12. Security & Compliance

### 12.1 Zero-Trust Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 ZERO-TRUST SECURITY MODEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  IDENTITY VERIFICATION                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Multi-factor authentication (MFA)                      │  │
│  │  • Biometric options (fingerprint, face)                 │  │
│  │  • Session-based re-authentication for sensitive ops     │  │
│  │  • Device binding and trust scoring                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  REQUEST VALIDATION                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Every request authenticated (JWT + refresh)           │  │
│  │  • Context-aware authorization (location, time, device)  │  │
│  │  • Rate limiting per user/IP/endpoint                    │  │
│  │  • Request signing for sensitive operations              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  DATA PROTECTION                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Encryption at rest (AES-256)                          │  │
│  │  • Encryption in transit (TLS 1.3)                       │  │
│  │  • Field-level encryption for PII/PHI                    │  │
│  │  • Data minimization (collect only necessary)            │  │
│  │  • Automatic PII masking in logs                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  AGENT-SPECIFIC SECURITY                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Agent authentication with service accounts            │  │
│  │  • Inter-agent communication encryption                  │  │
│  │  • Audit trail for all agent actions                     │  │
│  │  • Sandboxed agent execution                             │  │
│  │  • Human-in-the-loop for critical decisions              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 HIPAA Compliance Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Access Controls | Role-based access, MFA, session management | Existing ✅ |
| Audit Controls | Comprehensive logging, tamper-proof audit trail | Existing ✅ |
| Integrity Controls | Checksums, digital signatures, encryption | Existing ✅ |
| Transmission Security | TLS 1.3, certificate pinning | Existing ✅ |
| Privacy Rule | Data minimization, consent management | Enhance 🔄 |
| Breach Notification | Automated detection, notification workflows | Add 📋 |
| BAA Compliance | Agent services under BAA | Add 📋 |
| Risk Assessment | Regular security audits | Existing ✅ |
| Training | Staff training on PHI handling | Existing ✅ |

### 12.3 Privacy-Preserving ML

```yaml
Federated Learning Implementation:
  framework: TensorFlow Federated (TFF)
  
  process:
    1. Global model distributed to patient devices
    2. Local training on device with patient data
    3. Only model gradients sent to server (differential privacy)
    4. Server aggregates gradients (secure aggregation)
    5. Updated global model distributed
    
  privacy_guarantees:
    - Raw patient data never leaves device
    - Gradients noised with Gaussian mechanism
    - Secure aggregation prevents server from seeing individual updates
    - Differential privacy budget tracked (ε < 1)
    
  on_device_models:
    - Anomaly detection (vitals)
    - Mood inference
    - Activity classification
    - Sleep quality scoring
```

---

## 13. UI/UX Transformation

### 13.1 Design System Updates

```yaml
Design Principles (v5.0):
  - Voice-First: Every action accessible via voice
  - Ambient: Non-intrusive, always-available companion feel
  - Calm: Clinical without being cold, reassuring without alarmism
  - Explainable: Every AI decision transparently explained
  - Accessible: WCAG 2.1 AA compliance minimum

Color System Update:
  Primary: Teal (#0D9488) - Trust, health
  Secondary: Warm Amber (#F59E0B) - Attention, warmth
  Success: Green (#10B981) - Positive trends
  Warning: Orange (#F97316) - Needs attention
  Error: Red (#EF4444) - Critical only
  Neutral: Stone (#78716C) - Backgrounds, text
  
Component Updates:
  - VoiceInputButton: Floating action button for voice activation
  - AgentAvatar: Animated agent presence indicator
  - InsightCard: Explainable AI result display
  - TrendChart: Interactive health trend visualization
  - QuestProgress: Gamified health goal tracker
  - PredictiveAlert: Proactive insight notification
```

### 13.2 New UI Components

```jsx
// AgentInterface.jsx - Central voice/text interaction hub
<AgentInterface>
  <AgentAvatar agent="wellness" status="listening" />
  <ConversationArea messages={messages} />
  <InputArea>
    <VoiceInput onTranscript={handleVoice} />
    <TextInput onSubmit={handleText} placeholder="Ask me anything..." />
  </InputArea>
  <QuickActions>
    <Action icon="calendar" label="Book Appointment" />
    <Action icon="pill" label="Refill Meds" />
    <Action icon="chart" label="View Trends" />
  </QuickActions>
</AgentInterface>

// WellnessHub.jsx - Ambient companion dashboard
<WellnessHub>
  <WellnessScore score={82} trend="improving" />
  <VitalGrid>
    <VitalCard type="heart_rate" value={72} trend={data} />
    <VitalCard type="glucose" value={118} trend={data} />
    <VitalCard type="bp" value="128/82" trend={data} />
  </VitalGrid>
  <InsightsPanel>
    <InsightCard 
      type="prediction" 
      title="Glucose Trend Alert"
      explanation={explanationData}
      actions={suggestedActions}
    />
  </InsightsPanel>
  <ActiveQuests quests={quests} />
</WellnessHub>

// ExplainerModal.jsx - AI decision transparency
<ExplainerModal prediction={prediction}>
  <ConfidenceIndicator score={0.85} />
  <FactorList factors={prediction.factors} />
  <Narrative>{prediction.explanation.narrative}</Narrative>
  <SimilarCases cases={anonymizedCases} />
  <FeedbackButtons onFeedback={handleFeedback} />
</ExplainerModal>
```

### 13.3 Voice-First Interface

```yaml
Voice Activation:
  trigger: "Hey LifelineX" or microphone button
  
Voice Commands:
  - "How am I doing today?" → Wellness summary
  - "I'm not feeling well" → Intake Agent triage
  - "Book an appointment with Dr. [Name]" → Scheduling flow
  - "What's my glucose trend?" → Insights visualization
  - "Refill my [medication]" → Refill workflow
  - "Explain my risk score" → Explainer modal
  
Voice Response:
  - Text-to-speech for agent responses
  - Visual confirmation of understood intent
  - Fallback to text input on misunderstanding
  - Privacy mode (voice commands without speaking PHI)
```

---

## 14. Testing Strategy

### 14.1 Test Categories

```yaml
Unit Tests:
  coverage_target: 80%
  frameworks:
    frontend: Jest + React Testing Library
    backend: Jest + Supertest
    python: pytest
  focus:
    - Agent logic and state transitions
    - ML model input/output validation
    - API endpoint behavior
    - Component rendering

Integration Tests:
  frameworks:
    api: Postman / Newman collections
    e2e: Playwright
  focus:
    - Agent handoff flows
    - Event bus message delivery
    - Backend-ML service communication
    - Device sync flows

ML Model Tests:
  focus:
    - Model accuracy metrics (precision, recall, F1)
    - Bias detection across demographics
    - Edge case handling
    - Performance benchmarks
  validation:
    - Cross-validation on held-out data
    - A/B testing in production

Load Tests:
  tool: k6 / Artillery
  scenarios:
    - 1000 concurrent patient sessions
    - 100 simultaneous triage workflows
    - Peak vital stream ingestion (10K events/sec)
    - Device sync burst (1K syncs/minute)

Security Tests:
  focus:
    - Penetration testing (OWASP Top 10)
    - Authentication bypass attempts
    - PHI exposure audit
    - Agent permission boundaries
```

### 14.2 Agent-Specific Testing

```yaml
Intake Agent Tests:
  - Symptom extraction accuracy (NER benchmark)
  - Urgency classification accuracy
  - Red flag detection sensitivity
  - Multi-turn conversation coherence
  - Handoff correctness

Wellness Agent Tests:
  - Vital anomaly detection accuracy
  - Nudge relevance scoring
  - Device sync reliability
  - Trend prediction accuracy
  - Context awareness

Care Coordinator Tests:
  - No-show prediction accuracy
  - Slot optimization effectiveness
  - Refill workflow completion rate
  - Intervention impact measurement

Insights Agent Tests:
  - Risk forecasting calibration
  - Explanation consistency
  - What-if simulation accuracy
  - Virtual twin model fidelity
```

---

## 15. Rollout Plan

### 15.1 Staged Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLLOUT STAGES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: INTERNAL TESTING (2 weeks)                           │
│  ─────────────────────────────────────                         │
│  • Deploy to staging environment                               │
│  • Internal staff testing                                      │
│  • Bug fixes and refinements                                   │
│  • Performance baseline establishment                          │
│                                                                 │
│  STAGE 2: PILOT COHORT (4 weeks)                               │
│  ──────────────────────────────────                            │
│  • 100 selected patients (opt-in)                              │
│  • High-touch support and feedback collection                  │
│  • Daily monitoring and iteration                              │
│  • Success criteria validation                                 │
│                                                                 │
│  STAGE 3: EXPANDED PILOT (4 weeks)                             │
│  ─────────────────────────────────────                         │
│  • 1000 patients                                               │
│  • Reduced support intensity                                   │
│  • A/B testing vs legacy portal                               │
│  • ML model retraining with real data                         │
│                                                                 │
│  STAGE 4: GENERAL AVAILABILITY (ongoing)                       │
│  ─────────────────────────────────────────                     │
│  • All patients (opt-in migration)                             │
│  • Legacy portal maintained for transition                     │
│  • Continuous improvement cycle                                │
│  • Feature flag controlled rollout of new capabilities         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 15.2 Feature Flags

```yaml
Feature Flags:
  agent_intake_enabled:
    default: false
    rollout: percentage_based
    description: Enable Intake Agent triage
    
  agent_wellness_enabled:
    default: false
    rollout: user_segment
    description: Enable Wellness Agent monitoring
    
  device_sync_enabled:
    default: false
    rollout: feature_gate
    description: Enable wearable device sync
    
  predictive_scheduling:
    default: false
    rollout: percentage_based
    description: Enable ML-based appointment scheduling
    
  health_twin_enabled:
    default: false
    rollout: user_segment
    description: Enable virtual health twin visualizations
    
  voice_first_mode:
    default: false
    rollout: user_preference
    description: Enable voice-first interface
```

### 15.3 Rollback Plan

```yaml
Rollback Triggers:
  - Critical security vulnerability discovered
  - Error rate > 5% for any agent
  - Patient safety incident reported
  - >10% negative feedback from pilot users
  - System availability < 99%

Rollback Procedure:
  1. Disable agent feature flags
  2. Route all traffic to legacy portal
  3. Preserve session data for investigation
  4. Notify affected patients
  5. Root cause analysis
  6. Fix and re-deploy with enhanced testing

Data Preservation:
  - All agent sessions logged
  - ML predictions preserved with validation data
  - Event bus replay capability
  - Database point-in-time recovery
```

---

## 16. Success Metrics

### 16.1 Key Performance Indicators (KPIs)

```yaml
# Patient Engagement Metrics
engagement:
  - metric: Daily Active Users (DAU)
    baseline: Current portal usage
    target: +50%
    
  - metric: Session Duration
    baseline: 3 min average
    target: 5 min (quality interaction)
    
  - metric: Voice Interaction Rate
    baseline: 0%
    target: 40% of sessions include voice
    
  - metric: Agent Interaction Completion
    baseline: N/A
    target: 90% of triage sessions complete successfully

# Health Outcomes Metrics  
outcomes:
  - metric: Appointment No-Show Rate
    baseline: ~25%
    target: 15% (40% reduction)
    
  - metric: Medication Adherence Rate
    baseline: ~55%
    target: 72% (30% improvement)
    
  - metric: 30-Day Readmission Rate
    baseline: ~12%
    target: 9% (25% reduction)
    
  - metric: Preventable ER Visits
    baseline: Benchmark needed
    target: 20% reduction

# Operational Metrics
operations:
  - metric: Triage Time
    baseline: 10-15 min (manual)
    target: 5-7 min (agent-assisted)
    
  - metric: Front Desk Call Volume
    baseline: Current volume
    target: 30% reduction
    
  - metric: Provider Pre-Visit Prep Time
    baseline: 5 min per patient
    target: 2 min (with agent summaries)

# System Performance
technical:
  - metric: Agent Response Latency
    target: <2s for 95th percentile
    
  - metric: System Uptime
    target: 99.9%
    
  - metric: ML Model Accuracy
    target: >85% for all classification tasks
    
  - metric: Event Processing Latency
    target: <500ms end-to-end
```

### 16.2 Measurement Framework

```yaml
Data Collection:
  - Telemetry SDK in frontend (Mixpanel / Amplitude)
  - Structured logging in backend
  - ML model metrics (MLflow)
  - Patient surveys (NPS, satisfaction)
  - Clinician feedback forms

Dashboards:
  - Real-time operational dashboard (Grafana)
  - Patient engagement analytics (custom)
  - ML model performance (MLflow + TensorBoard)
  - Business outcome tracking (BI tool)

Reporting Cadence:
  - Daily: System health, error rates
  - Weekly: Engagement metrics, agent performance
  - Monthly: Outcome metrics, ML accuracy
  - Quarterly: Business impact, ROI analysis
```

---

## 17. Risk Assessment

### 17.1 Risk Matrix

| Risk | Probability | Impact | Score | Mitigation |
|------|-------------|--------|-------|------------|
| ML model produces incorrect triage | Medium | Critical | High | Human-in-loop for high-risk, confidence thresholds |
| Patient data breach | Low | Critical | High | Zero-trust, encryption, audit, penetration testing |
| System downtime during critical use | Low | High | Medium | Multi-region deployment, failover, monitoring |
| Device integration reliability | High | Medium | Medium | Graceful degradation, manual entry fallback |
| User adoption resistance | Medium | Medium | Medium | Gradual rollout, training, feedback loops |
| Agent "hallucination" | Medium | High | High | Guardrails, fact-checking, source attribution |
| Regulatory/HIPAA non-compliance | Low | Critical | High | Compliance-first design, legal review, audits |
| Scalability bottlenecks | Medium | Medium | Medium | Load testing, auto-scaling, performance monitoring |
| Vendor lock-in (cloud, ML) | Medium | Medium | Medium | Abstraction layers, multi-cloud strategy |
| Model bias | Medium | High | High | Fairness testing, diverse training data, monitoring |

### 17.2 Clinical Safety Guardrails

```yaml
Safety Mechanisms:
  Triage Safety:
    - Red flag symptoms always escalate to human review
    - Emergency detection bypasses all normal flows
    - Confidence threshold: <80% confidence → human routing
    - Uncertainty acknowledgment in agent responses
    
  Medication Safety:
    - No dosage recommendations from agents
    - Refill requests validated against current prescriptions
    - Drug interaction warnings from existing system
    - Pharmacist review for non-routine requests
    
  Prediction Safety:
    - Predictions marked as "observational, not diagnostic"
    - Clear confidence intervals displayed
    - Disclaimer on all health recommendations
    - Easy path to contact healthcare provider
    
  Alert Safety:
    - Tiered escalation with response deadlines
    - Backup channels (SMS, phone) for critical alerts
    - Alert fatigue management (priority tuning)
    - False positive monitoring and model adjustment
```

---

## 18. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| Agent | AI system with defined role, tools, and reasoning capability |
| Handoff | Transfer of conversation/task between agents |
| Nudge | Personalized health recommendation or reminder |
| Health Twin | Patient-specific digital simulation model |
| Federated Learning | ML training without centralizing patient data |
| RLHF | Reinforcement Learning from Human Feedback |
| FHIR | Fast Healthcare Interoperability Resources standard |
| Zero-Trust | Security model that verifies every request |
| NEWS2 | National Early Warning Score (clinical severity metric) |

### Appendix B: Related Documents

- [LifelineX_Patient_Portal_PRD_v1.0.md](LifelineX_Patient_Portal_PRD_v1.0.md) - Current system PRD
- [HEALTH_SCORE_README.md](patient-portal/HEALTH_SCORE_README.md) - Health score calculation
- [Voice Agent README](voice-agent/README.md) - Current voice agent documentation
- [HIS PRD](his-project-prd.md) - Hospital Information System PRD

### Appendix C: Technology Decision Records

```yaml
ADR-001: Agent Orchestration Framework
  Decision: LangGraph over AutoGen
  Rationale: Better state management, visualization, easier debugging
  Status: Proposed

ADR-002: Event Bus Technology
  Decision: AWS EventBridge (if AWS) or Kafka (if multi-cloud)
  Rationale: Native integration vs. portability trade-off
  Status: Pending infrastructure decision

ADR-003: On-Device ML Framework
  Decision: TensorFlow.js
  Rationale: Cross-platform, PWA support, model conversion ecosystem
  Status: Approved

ADR-004: Voice Technology
  Decision: Extend existing Web Speech API + Google Cloud STT/TTS
  Rationale: Leverage existing investment, proven reliability
  Status: Approved
```

### Appendix D: Project Team

| Role | Responsibility |
|------|----------------|
| Product Owner | Requirements, prioritization, stakeholder management |
| Tech Lead | Architecture, technical decisions, code review |
| ML Engineer | Model development, training, deployment |
| Frontend Developer | PWA, voice UI, component development |
| Backend Developer | API development, event bus, integrations |
| DevOps | Infrastructure, CI/CD, monitoring |
| QA Engineer | Test strategy, automation, quality assurance |
| Security Engineer | Security review, penetration testing, compliance |
| Clinical Advisor | Medical accuracy, safety review, clinical workflows |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 5.0 | Feb 2026 | LifelineX Team | Initial migration PRD |

---

*End of Document*
