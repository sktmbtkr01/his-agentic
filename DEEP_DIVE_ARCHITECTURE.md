# LifelineX: Deep Dive Architecture Guide

This document explains the *why* and *how* of the LifelineX architecture, bridging the gap between high-level diagrams and code execution.

---

## 1. End-to-End Request Flow
**Scenario**: A doctor opens the "Patient Dashboard" to see if a patient needs a wellness nudge.

### Step 1: The Client Request
*   **User Action**: Doctor clicks "Analyze Patient".
*   **Frontend**: React component `HealthScoreCard.jsx` executes an async Redux action.
*   **Network**: Browser sends `POST https://api.lifelinex.com/api/v1/patient/nudge` with a JSON body (`{ patientId: "123" }`).

### Step 2: The Egress (Nginx)
*   **Role**: The Gatekeeper.
*   **Action**: Nginx receives the request on port 443 (HTTPS), terminates SSL (decrypts it), and forwards it to `localhost:5001`.
*   **Latency Impact**: < 1ms. Negligible unless under DDoS.

### Step 3: Node.js Entry (The Event Loop)
*   **File**: `server.js` -> `middleware/`
*   **Action**: 
    1.  `helmet` adds security headers.
    2.  `express.json()` parses the body string into a JS Object.
    3.  `auth.middleware.js` verifies the JWT token. **(Latency: ~2ms for crypto check)**.
    4.  Router sends it to `controllers/ai.controller.js`.

### Step 4: The Logic (Service Layer)
*   **File**: `services/agentic/WellnessAgentOrchestrator.js`
*   **Action**: The Orchestrator "thinks". It needs data.
    1.  **Database Read**: Queries MongoDB (`Patient` collection, `Vitals` collection).
    2.  Wait for Mongo to return documents (JSON-like). **(Latency: ~20-50ms)**.

### Step 5: The "Sidecar" Call (ML Integration)
*   **Constraint**: Node.js is bad at heavy math. Python is good at it.
*   **Action**: `NudgeSelectionTool.js` uses `axios` to send an HTTP POST to `http://localhost:8000/predict`.
*   **Serialization**: Node stringifies the patient data -> JSON.
*   **Latency**: The "Bridge Tax" (Network hop + Serialization) ~10ms.

### Step 6: The Python Brain
*   **File**: `scripts/ml_nudge_service.py`
*   **Action**: 
    1.  FastAPI receives JSON.
    2.  Pandas converts JSON to a DataFrame.
    3.  Scikit-Learn (`model.predict_proba`) performs matrix multiplication.
    4.  Returns `{ "nudge": "Increase Exercise", "probability": 0.85 }`.
*   **Latency**: ~50ms (inference is fast, overhead is the main cost).

### Step 7: The Response
*   Node receives the prediction, saves a `CareNudge` to MongoDB, and sends a `200 OK` JSON response to the Frontend.

---

## 2. Technology Specifics

### 2.1 WebSockets (Socket.io)
**Where**: Used in `emergency.controller.js` and `opd.controller.js`.
**Why**: 
*   **HTTP is Pull**: The client has to ask "Is there an emergency?" (Polling). This is slow and wasteful.
*   **WebSockets are Push**: The server says "HEY! Emergency!" immediately.
**Flow**:
1.  Nurse Station connects (`socket.on('join', 'emergency-room')`).
2.  Ambulance API hits `POST /emergency`.
3.  Controller saves data, then calls `io.to('emergency-room').emit('alert', data)`.
4.  Nurse screen flashes red instantly.

### 2.2 Redis (Planned)
**Where**: 
1.  **Caching**: Storing `HealthScore` results. Since health scores don't change every second, we can calculate it once, store in Redis for 10 mins, and serve subsequent requests in 1ms instead of 100ms.
2.  **Socket.io Adapter**: Crucial for scaling (see Section 4).
**When NOT to use**:
*   **Source of Truth**: Never store primary patient records purely in Redis. If power fails, RAM is wiped.
*   **Complex Queries**: Redis key-value lookup is fast but cannot do "Find all patients where age > 50".

### 2.3 Polyglot Persistence (Mongo + Postgres)
**The Concept**: Use the right tool for the right job.
*   **MongoDB (Clinical)**: Medical records are messy. One patient has 5 fields, another has 50. JSON documents map perfectly to this chaos.
*   **PostgreSQL (Billing - Planned)**: Money requires strict rules. You cannot charge a patient if the item doesn't exist. SQL enforces relationships (Foreign Keys) and Transactions (ACID) so you never lose money.

**Consistency Challenge**:
If you delete a Patient in Mongo, their Billing in Postgres must also be archived. 
*   **Solution**: "Service-Based delete". The `deletePatient` service function must: 
    1. `await mongo.delete()` 
    2. `await pg.query('DELETE...')`. 
    If step 2 fails, roll back step 1.

---

## 3. Scaling & Performance

### 3.1 Scaling Node.js
If 10,000 doctors use the app, one Node process will choke (CPU maxed out).
*   **Solution**: Run multiple copies (Instances) of the Node app behind Nginx.
*   **The Problem**: A user connects via WebSocket to Instance A. An emergency happens on Instance B. Instance B emits an alert, but the user on A sees nothing.
*   **The Fix (Redis Adapter)**: Instance B publishes a message to Redis. Redis pushes it to Instance A. Instance A tells the user.

### 3.2 Latency Breakdown (The "Budget")
| Layer | Typical Latency | Cause |
| :--- | :--- | :--- |
| **Nginx** | < 1 ms | SSL Handshake |
| **Node (Logic)** | 5-10 ms | Event Loop "ticks" |
| **MongoDB** | 10-50 ms | Disk I/O & Network |
| **ML Inference** | 50-200 ms | Python overhead + Math |
| **Redis** | < 2 ms | In-Memory (Ram) |
| **WebSocket** | Real-time | Uses TCP connection directly |

*   **Bottleneck #1**: **Database**. Poor indexing (e.g., searching by Name without an index) scans millions of docs.
*   **Bottleneck #2**: **Python Bridge**. Moving large datasets between Node and Python via HTTP is slow. Send only IDs/features, not full records.

---

## 4. Recommended Learning Path

To master this architecture, study these concepts in order:

1.  **The Event Loop**: Understand why `await` yields control in Node.js. If you block the loop (e.g., `while(true)`), the whole server dies.
2.  **Database Indexing**: Learn B-Trees. An un-indexed query is the #1 cause of slow apps.
3.  **Rest vs RPC**: Understand that calling Python from Node is effectively RPC (Remote Procedure Call).
4.  **ACID vs BASE**: Why Banking needs ACID (Postgres) and Social Feeds (or Logs) are okay with BASE (Mongo).
5.  **Docker Networking**: How `localhost` changes when you put services in containers (it becomes the service name, e.g., `http://ml-service:8000`).
