# LifelineX Wellness Agent

## Product Requirements Document (PRD)

**Version:** 1.1  
**Last Updated:** February 7, 2026  
**Status:** In Development

---

## Implementation Progress Tracker

| Phase | Component | Status | Completion Date |
|-------|-----------|--------|-----------------|
| **Phase 1: Core Chat** | | | |
| 1.1 | Wellness Agent Backend Service | Complete | Feb 7, 2026 |
| 1.2 | Chat API Endpoint | Complete | Feb 7, 2026 |
| 1.3 | Patient Context Service | Complete | Feb 7, 2026 |
| 1.4 | WellnessAgentChat UI Component | Complete | Feb 7, 2026 |
| 1.5 | Dashboard Integration | Complete | Feb 7, 2026 |
| 1.6 | End-to-End Testing | Complete | Feb 7, 2026 |
| **Phase 2: Smart Nudges (V1)** | | | |
| 2.1 | LLM-Powered Nudge Generation | Complete | Feb 7, 2026 |
| 2.2 | Nudge Effectiveness Tracking | Complete | Feb 7, 2026 |
| 2.3 | SmartNudgeCard Component | Complete | Feb 7, 2026 |
| **Phase 2.5: Agentic Nudges (V2-ML)** | | | |
| 2.5.1 | NudgeEvent Schema (ML Training Data) | Complete | Feb 7, 2026 |
| 2.5.2 | ContextTool (Feature Extraction) | Complete | Feb 7, 2026 |
| 2.5.3 | RiskAssessmentTool (Risk Detection) | Complete | Feb 7, 2026 |
| 2.5.4 | NudgeSelectionTool (ML Scoring) | Complete | Feb 7, 2026 |
| 2.5.5 | MessageGenerationTool (LLM) | Complete | Feb 7, 2026 |
| 2.5.6 | OutcomeTrackingTool (Learning) | Complete | Feb 7, 2026 |
| 2.5.7 | WellnessAgentOrchestrator | Complete | Feb 7, 2026 |
| 2.5.8 | Feature Flag Integration | Complete | Feb 7, 2026 |
| 2.5.9 | ML Microservice (Python) | Complete | Feb 7, 2026 |
| **Phase 3: Device Sync** | | | |
| 3.1 | Device Sync Service | Complete | Feb 7, 2026 |
| 3.2 | Fitbit Integration | Complete | Feb 7, 2026 |
| 3.3 | Real-time Vitals Display | Complete | Feb 7, 2026 |
| **Phase 4: Predictive** | | | |
| 4.1 | Trend Analysis Service | Complete | Feb 8, 2026 |
| 4.2 | Anomaly Detection | Complete | Feb 8, 2026 |
| 4.3 | Proactive Alerts UI | Complete | Feb 8, 2026 |

**Legend:** Not Started | In Progress | Complete

---

## 1. Executive Summary

The Wellness Agent is an AI-powered continuous health monitoring companion that transforms the patient portal from a passive data logging tool into a proactive health partner. It provides 24/7 conversational support, personalized nudges, and contextual health insights.

### 1.1 Core Value Proposition

| Aspect | Before (Current) | After (Wellness Agent) |
|--------|------------------|------------------------|
| Interaction | Manual form logging | Conversational AI chat |
| Insights | Static health score | Dynamic contextual guidance |
| Nudges | Rule-based reminders | LLM-personalized recommendations |
| Monitoring | On-demand | Continuous ambient awareness |
| Tone | Clinical/impersonal | Warm, supportive companion |

### 1.2 Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Daily Active Engagement | ~15% | 40% | Sessions with agent interaction |
| Nudge Action Rate | ~20% | 50% | Nudges acted upon vs dismissed |
| Signal Logging Frequency | 2x/week | 5x/week | Avg logs per patient |
| Patient Satisfaction | N/A | 4.2/5 | In-app feedback |

---

## 2. Product Vision

Create a trusted AI wellness companion that patients want to talk to daily - not because they have to, but because it genuinely helps them feel better and stay healthier.

### 2.1 Persona: "Wellness"

- **Name:** Wellness (or customizable by patient)
- **Personality:** Warm, calm, knowledgeable but not preachy
- **Tone:** Supportive friend who happens to be a health expert
- **Communication Style:** 
  - Short, conversational messages
  - Asks clarifying questions naturally
  - Celebrates small wins
  - Never alarmist, always reassuring

### 2.2 Design Principles

1. **Conversational First** - Every action possible through chat
2. **Context-Aware** - Knows patient history, recent signals, trends
3. **Proactive but Not Pushy** - Reaches out at right moments
4. **Explainable** - Always explains "why" behind suggestions
5. **Privacy-Respecting** - Transparent about data usage

---

## 3. Phase 1: Core Chat Service (Current Focus)

### 3.1 Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    WELLNESS AGENT PHASE 1                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                 â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  Patient Portal  â”‚        â”‚   HIS Backend (Node.js)    â”‚    â”‚
â”‚  â”‚    Frontend      â”‚        â”‚                            â”‚    â”‚
â”‚  â”‚                  â”‚        â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚    â”‚
â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚   API  â”‚  â”‚ Wellness Controller  â”‚  â”‚    â”‚
â”‚  â”‚ â”‚WellnessAgent â”‚ â”‚â—„â”€â”€â”€â”€â”€â”€â–ºâ”‚  â”‚                      â”‚  â”‚    â”‚
â”‚  â”‚ â”‚   Chat.jsx   â”‚ â”‚        â”‚  â”‚ â€¢ Chat endpoint      â”‚  â”‚    â”‚
â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚        â”‚  â”‚ â€¢ Context builder    â”‚  â”‚    â”‚
â”‚  â”‚                  â”‚        â”‚  â”‚ â€¢ LLM integration    â”‚  â”‚    â”‚
â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚        â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚    â”‚
â”‚  â”‚ â”‚  Dashboard   â”‚ â”‚        â”‚             â”‚              â”‚    â”‚
â”‚  â”‚ â”‚ (Chat FAB)   â”‚ â”‚        â”‚             â–¼              â”‚    â”‚
â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚        â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚    â”‚
â”‚  â”‚                  â”‚        â”‚  â”‚  Wellness Service    â”‚  â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â”‚  â”‚                      â”‚  â”‚    â”‚
â”‚                              â”‚  â”‚ â€¢ Patient context    â”‚  â”‚    â”‚
â”‚                              â”‚  â”‚ â€¢ Health score       â”‚  â”‚    â”‚
â”‚                              â”‚  â”‚ â€¢ Recent signals     â”‚  â”‚    â”‚
â”‚                              â”‚  â”‚ â€¢ Active nudges      â”‚  â”‚    â”‚
â”‚                              â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚    â”‚
â”‚                              â”‚             â”‚              â”‚    â”‚
â”‚                              â”‚             â–¼              â”‚    â”‚
â”‚                              â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚    â”‚
â”‚                              â”‚  â”‚   AI Service (LLM)   â”‚  â”‚    â”‚
â”‚                              â”‚  â”‚   (OpenRouter API)   â”‚  â”‚    â”‚
â”‚                              â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚    â”‚
â”‚                              â”‚                            â”‚    â”‚
â”‚                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.2 API Specification

#### 3.2.1 Chat Endpoint

```yaml
POST /api/v1/patient/wellness/chat
  
Request:
  Headers:
    Authorization: Bearer <patient_token>
  Body:
    message: string          # Patient's message
    conversationId: string   # Optional, for continuity
    
Response:
  success: boolean
  data:
    response: string         # Agent's response
    conversationId: string   # For follow-up messages
    suggestedActions:        # Optional quick actions
      - type: string         # 'log_symptom', 'log_mood', etc.
        label: string
        route: string
    sentiment: string        # 'positive', 'neutral', 'concerned'
```

#### 3.2.2 Context Endpoint (Internal)

```yaml
GET /api/v1/patient/wellness/context

Response:
  success: boolean
  data:
    patient:
      firstName: string
      age: number
      conditions: string[]   # Active conditions
    healthScore:
      current: number
      trend: string
      summary: string
    recentSignals:
      symptoms: array        # Last 7 days
      moods: array
      lifestyle: array
    activeNudges: array
    lastInteraction: timestamp
```

### 3.3 Data Models

#### 3.3.1 WellnessConversation Schema

```javascript
// MongoDB Schema
const WellnessConversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: String,
    timestamp: { type: Date, default: Date.now },
    metadata: {
      sentiment: String,
      suggestedActions: Array
    }
  }],
  
  context: {
    healthScoreAtStart: Number,
    triggeredBy: String,  // 'user_initiated', 'nudge', 'alert'
  },
  
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 3.4 LLM System Prompt

```markdown
You are "Wellness", a caring AI health companion in the LifelineX patient portal.

## Your Role
- You help patients understand and improve their health
- You provide supportive, non-judgmental guidance
- You encourage healthy behaviors without being preachy
- You NEVER diagnose or prescribe - always defer to doctors for medical decisions

## Patient Context
Name: {{patient.firstName}}
Current Health Score: {{healthScore.current}}/100 ({{healthScore.trend}})
Recent Symptoms: {{recentSignals.symptoms}}
Recent Mood: {{recentSignals.moods}}
Active Nudges: {{activeNudges}}

## Communication Guidelines
1. Keep responses SHORT (2-3 sentences max unless asked for detail)
2. Use warm, conversational tone
3. Ask clarifying questions when needed
4. Celebrate small wins ("Great job logging today!")
5. When concerned, suggest talking to doctor without alarming
6. Suggest relevant actions when appropriate

## Response Format
- Be conversational, not clinical
- Use simple language, avoid medical jargon
- Include one suggested action when relevant
- Never start with "As an AI..." or similar

## Safety Rules
- Never provide specific dosage recommendations
- Never diagnose conditions
- If patient describes emergency symptoms (chest pain, difficulty breathing, etc.), 
  immediately advise calling emergency services
- Always encourage consulting healthcare providers for medical questions
```

### 3.5 Frontend Component Specification

#### 3.5.1 WellnessAgentChat.jsx

```jsx
// Component Structure
<WellnessAgentChat>
  â”œâ”€â”€ <ChatHeader>           // Agent name, status, minimize button
  â”œâ”€â”€ <MessageList>          // Scrollable message history
  â”‚   â”œâ”€â”€ <AgentMessage>     // Agent responses with avatar
  â”‚   â””â”€â”€ <UserMessage>      // Patient messages
  â”œâ”€â”€ <SuggestedActions>     // Quick action buttons
  â””â”€â”€ <InputArea>            // Text input + send button
      â”œâ”€â”€ <TextInput>
      â”œâ”€â”€ <VoiceButton>      // Optional voice input
      â””â”€â”€ <SendButton>
</WellnessAgentChat>
```

#### 3.5.2 UI States

| State | Display |
|-------|---------|
| Collapsed | Floating action button (FAB) with agent icon |
| Expanded | Chat drawer/modal (~400px width) |
| Loading | Typing indicator animation |
| Error | Retry option with friendly message |

#### 3.5.3 Interaction Flows

**Flow 1: Patient Initiates**
```
1. Patient clicks FAB â†’ Chat expands
2. Agent: "Hi [Name]! How can I help you today?"
3. Patient types/speaks â†’ Message sent
4. Agent responds with context-aware answer
5. Suggest relevant action if applicable
```

**Flow 2: Agent Proactive (Future)**
```
1. Trigger: Low health score detected
2. Agent: "Hey [Name], I noticed your score dipped today. Want to chat about it?"
3. Patient responds or dismisses
```

---

## 4. Backend Implementation Details

### 4.1 File Structure

```
hospital-his-backend/
â”œâ”€â”€ controllers/
â”‚   â””â”€â”€ wellness.controller.js    # NEW - Chat endpoint handler
â”œâ”€â”€ services/
â”‚   â””â”€â”€ wellness.service.js       # NEW - Context & LLM orchestration
â”œâ”€â”€ routes/
â”‚   â””â”€â”€ wellness.routes.js        # NEW - API routes
â”œâ”€â”€ models/
â”‚   â””â”€â”€ WellnessConversation.js   # NEW - Conversation schema
```

### 4.2 Service Methods

```javascript
// wellness.service.js
module.exports = {
  // Build patient context for LLM
  getPatientContext(patientId),
  
  // Process chat message
  processMessage(patientId, message, conversationId),
  
  // Generate LLM response
  generateResponse(context, message, conversationHistory),
  
  // Extract suggested actions from response
  extractSuggestedActions(response, context),
  
  // Save conversation
  saveConversation(conversationId, messages),
};
```

### 4.3 Agentic Nudge System (V2)

The system now supports an autonomous agentic workflow for nudges, moving from basic rule-based triggers to ML-driven optimization.

#### 4.3.1 Architecture (Orchestrator Pattern)
- **WellnessAgentOrchestrator**: Central controller that manages the OODA loop (Observe -> Assess -> Decide -> Act).
- **Tools**:
    - `ContextTool`: Aggregates patient data (logs, history, trends).
    - `RiskAssessmentTool`: Identifies potential health risks.
    - `NudgeSelectionTool`: Scores candidates using Python ML service.
    - `MessageGenerationTool`: Uses LLM to craft personalized copy.
    - `OutcomeTrackingTool`: Closes the loop by recording engagement data.

#### 4.3.2 ML Microservice
- **Stack**: Python, FastAPI, Scikit-Learn.
- **Function**: Receives patient feature vector, returns probabilities for each nudge type.
- **Model**: Logistic Regression (v1_learned) trained on interaction history.
- **Fallback**: Heuristic rules engine when ML service is offline or cold-start.

---

## 5. Frontend Implementation Details

### 5.1 File Structure

```
patient-portal/src/
â”œâ”€â”€ components/
â”‚   â””â”€â”€ wellness/
â”‚       â”œâ”€â”€ WellnessAgentChat.jsx    # Main chat component
â”‚       â”œâ”€â”€ ChatMessage.jsx          # Message bubble component
â”‚       â”œâ”€â”€ ChatInput.jsx            # Input area component
â”‚       â””â”€â”€ WellnessFAB.jsx          # Floating action button
â”œâ”€â”€ services/
â”‚   â””â”€â”€ wellnessAgent.service.js     # API client
â”œâ”€â”€ hooks/
â”‚   â””â”€â”€ useWellnessChat.js           # Chat state management
```

### 5.2 State Management

```javascript
// useWellnessChat.js
const useWellnessChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = async (message) => { /* ... */ };
  const openChat = () => { /* ... */ };
  const closeChat = () => { /* ... */ };
  
  return { isOpen, messages, isLoading, sendMessage, openChat, closeChat };
};
```

---

## 6. Testing Plan

### 6.1 Backend Tests

| Test Case | Type | Status |
|-----------|------|--------|
| Chat endpoint returns response | Integration | ðŸ”´ |
| Context includes health score | Unit | ðŸ”´ |
| Context includes recent signals | Unit | ðŸ”´ |
| LLM prompt includes patient name | Unit | ðŸ”´ |
| Conversation saves correctly | Integration | ðŸ”´ |
| Emergency keywords trigger warning | Unit | ðŸ”´ |

### 6.2 Frontend Tests

| Test Case | Type | Status |
|-----------|------|--------|
| FAB opens chat drawer | Component | ✅ |
| Messages display correctly | Component | ✅ |
| Send message calls API | Integration | ✅ |
| Loading state shows indicator | Component | ✅ |
| Error state shows retry | Component | ✅ |
| Smart Nudge Card displays metadata | Component | ✅ |
| Smart Nudge Card feedback works | Integration | ✅ |

---

## 7. Rollout Plan

### 7.1 Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| PRD Complete | Feb 7, 2026 | ✅ Complete |
| Backend Service (Chat) | Feb 7, 2026 | ✅ Complete |
| Frontend Component (Chat) | Feb 7, 2026 | ✅ Complete |
| Agentic Nudge System (V2) | Feb 7, 2026 | ✅ Complete |
| ML Microservice Integration | Feb 7, 2026 | ✅ Complete |
| Integration Testing | Feb 7, 2026 | ✅ Complete |

### 7.2 Feature Flags

```javascript
// Feature flag for gradual rollout
WELLNESS_AGENT_ENABLED: true  // Live
WELLNESS_AGENT_NUDGE_V2: true // Enabled (ML-based)
```

---

## 8. Future Phases (Reference)

### Phase 2: Smart Nudges
- LLM-generated nudge content
- Personalized timing optimization
- Effectiveness feedback loop

### Phase 3: Device Sync
- Fitbit OAuth integration
- Real-time vital streaming
- Manual vital entry enhancement

### Phase 4: Predictive Intelligence
- Time-series trend analysis
- Anomaly detection
- Proactive alert generation

---

## Appendix A: Sample Conversations

### A.1 General Check-in
```
User: "How am I doing?"

Wellness: "You're doing well, Sarah! Your health score is 78 
and trending up ðŸ“ˆ. Your mood logs this week look positive. 
Keep it up! Want to log how you're feeling today?"

[Suggested Action: Log Mood]
```

### A.2 Health Question
```
User: "I've been feeling tired lately"

Wellness: "I hear you. Looking at your logs, I notice your sleep 
has been around 5 hours this week. That could definitely contribute 
to feeling tired. Have you been able to get to bed earlier?

If the fatigue continues, it might be worth mentioning to your 
doctor at your next visit."

[Suggested Action: Log Lifestyle]
```

### A.3 Emergency Detection
```
User: "I'm having chest pain and trouble breathing"

Wellness: "I'm concerned about those symptoms. Chest pain and 
difficulty breathing can be serious. 

âš ï¸ Please call 911 or go to the emergency room immediately.

Is there someone with you who can help?"
```

---

*End of Document*

