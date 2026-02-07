"""
Nudge ML Inference Microservice

A FastAPI service that scores nudge candidates using a trained ML model.
The Node.js backend calls this service via HTTP.

REQUIREMENTS:
    pip install fastapi uvicorn joblib numpy pandas scikit-learn

RUN:
    uvicorn ml_nudge_service:app --host 0.0.0.0 --port 8000

USAGE FROM NODE.JS:
    POST http://localhost:8000/predict
    {
        "features": {
            "health_score": 65,
            "avg_sleep_7d": 5.5,
            ...
        },
        "candidate_types": ["missing_log", "sleep_deficit", "mood_pattern"]
    }
    
    Response:
    {
        "success": true,
        "probabilities": {
            "missing_log": 0.72,
            "sleep_deficit": 0.58,
            "mood_pattern": 0.45
        },
        "recommended": "missing_log"
    }
"""

import os
import json
import numpy as np
from typing import Dict, List, Optional, Union, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import joblib

app = FastAPI(
    title="Nudge ML Service",
    description="ML-based nudge selection for LifelineX Wellness Agent",
    version="1.0.0"
)

# Model paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
JOBLIB_PATH = os.path.join(MODEL_DIR, 'nudge_model_v1.joblib')
JSON_PATH = os.path.join(MODEL_DIR, 'nudge_weights.json')

# Global model (loaded on startup)
model_data = None


class Features(BaseModel):
    """Patient features for ML scoring. Accepts flexible types."""
    health_score: float = 50
    health_score_trend: Union[int, str] = 0  # -1/declining, 0/stable, 1/improving
    avg_sleep_7d: float = 7
    avg_mood_7d: float = 3
    activity_frequency: float = 0.5
    logging_consistency: float = 0.5
    days_since_last_interaction: float = 3
    days_since_last_log: float = 2
    previous_nudge_success_rate: float = 0.5
    hour_of_day: int = 12
    day_of_week: int = 3
    is_weekend: Union[int, bool] = 0

    @validator('health_score_trend', pre=True)
    def convert_trend(cls, v):
        """Convert string trend to int."""
        if isinstance(v, str):
            mapping = {'improving': 1, 'stable': 0, 'declining': -1, 'unknown': 0}
            return mapping.get(v.lower(), 0)
        return int(v) if v is not None else 0

    @validator('is_weekend', pre=True)
    def convert_weekend(cls, v):
        """Convert bool to int."""
        if isinstance(v, bool):
            return 1 if v else 0
        return int(v) if v is not None else 0

    class Config:
        # Allow extra fields to be ignored
        extra = 'ignore'


class PredictRequest(BaseModel):
    """Request body for prediction endpoint."""
    features: Features
    candidate_types: List[str]

    class Config:
        extra = 'ignore'


class PredictResponse(BaseModel):
    """Response body for prediction endpoint."""
    success: bool
    probabilities: Dict[str, float]
    recommended: str
    model_version: str


@app.post("/debug")
async def debug_request(body: Any = None):
    """Debug endpoint to see raw request body."""
    return {"received": body}


@app.on_event("startup")
async def load_model():
    """Load the trained model on startup."""
    global model_data
    
    if os.path.exists(JOBLIB_PATH):
        print(f"Loading model from {JOBLIB_PATH}")
        model_data = joblib.load(JOBLIB_PATH)
        model_data['type'] = 'sklearn'
        if 'version' not in model_data:
            model_data['version'] = 'v1_learned'
        print("Model loaded successfully!")
        
    elif os.path.exists(JSON_PATH):
        print(f"Loading weights from {JSON_PATH}")
        with open(JSON_PATH, 'r') as f:
            model_data = json.load(f)
        model_data['type'] = 'json'
        print("Weights loaded successfully!")
        
    else:
        print("WARNING: No trained model found. Using heuristic fallback.")
        model_data = {'type': 'heuristic'}


def sigmoid(x):
    """Sigmoid activation function."""
    return 1 / (1 + np.exp(-np.clip(x, -500, 500)))


def predict_with_sklearn(features: Features, nudge_type: str) -> float:
    """Score using sklearn model."""
    model = model_data['model']
    scaler = model_data['scaler']
    feature_names = model_data['feature_names']
    
    # Build feature vector
    feature_dict = features.dict()
    X = []
    
    for name in feature_names:
        if name.startswith('nudge_'):
            # One-hot encoded nudge type
            expected_type = name.replace('nudge_', '')
            X.append(1 if nudge_type == expected_type else 0)
        else:
            X.append(feature_dict.get(name, 0))
    
    X = np.array(X).reshape(1, -1)
    X_scaled = scaler.transform(X)
    
    prob = model.predict_proba(X_scaled)[0][1]
    return float(prob)


def predict_with_json(features: Features, nudge_type: str) -> float:
    """Score using JSON weights (manual logistic regression)."""
    weights = np.array(model_data['weights'])
    bias = model_data['bias']
    scaler_mean = np.array(model_data['scaler_mean'])
    scaler_std = np.array(model_data['scaler_std'])
    feature_names = model_data['feature_names']
    
    # Build feature vector
    feature_dict = features.dict()
    X = []
    
    for name in feature_names:
        if name.startswith('nudge_'):
            expected_type = name.replace('nudge_', '')
            X.append(1 if nudge_type == expected_type else 0)
        else:
            X.append(feature_dict.get(name, 0))
    
    X = np.array(X)
    
    # Normalize
    X_scaled = (X - scaler_mean) / scaler_std
    
    # Logistic regression: sigmoid(w·x + b)
    logit = np.dot(weights, X_scaled) + bias
    prob = sigmoid(logit)
    
    return float(prob)


def predict_heuristic(features: Features, nudge_type: str) -> float:
    """Fallback heuristic scoring (same as NudgeSelectionTool.js)."""
    feature_weights = {
        'previous_nudge_success_rate': 2.0,
        'logging_consistency': 1.5,
        'days_since_last_interaction': -0.15,
        'days_since_last_log': -0.1,
    }
    
    nudge_biases = {
        'appointment_reminder': 0.8,
        'missing_log': 0.5,
        'sleep_deficit': 0.3,
        'declining_score': 0.4,
        'mood_pattern': 0.2,
        'improving_score': 0.6,
        'streak_celebration': 0.7,
        'wellness_checkin': 0.3,
    }
    
    f = features.dict()
    score = 0
    
    score += f['previous_nudge_success_rate'] * feature_weights['previous_nudge_success_rate']
    score += f['logging_consistency'] * feature_weights['logging_consistency']
    score += f['days_since_last_interaction'] * feature_weights['days_since_last_interaction']
    score += f['days_since_last_log'] * feature_weights['days_since_last_log']
    score += (100 - f['health_score']) / 100 * 0.02
    
    if f['is_weekend']:
        score -= 0.3
    if 6 <= f['hour_of_day'] <= 10:
        score += 0.2
    if 18 <= f['hour_of_day'] <= 21:
        score += 0.1
    
    score += nudge_biases.get(nudge_type, 0)
    
    return sigmoid(score)


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Score candidate nudge types and return probabilities.
    
    This is the main endpoint called by Node.js NudgeSelectionTool.
    """
    if not request.candidate_types:
        raise HTTPException(status_code=400, detail="candidate_types cannot be empty")
    
    probabilities = {}
    
    for nudge_type in request.candidate_types:
        if model_data['type'] == 'sklearn':
            prob = predict_with_sklearn(request.features, nudge_type)
        elif model_data['type'] == 'json':
            prob = predict_with_json(request.features, nudge_type)
        else:
            prob = predict_heuristic(request.features, nudge_type)
        
        probabilities[nudge_type] = round(prob, 4)
    
    # Find recommended (highest probability)
    recommended = max(probabilities, key=probabilities.get)
    
    return PredictResponse(
        success=True,
        probabilities=probabilities,
        recommended=recommended,
        model_version=model_data.get('version', 'heuristic')
    )


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model_data is not None,
        "model_type": model_data.get('type', 'none') if model_data else 'none'
    }


@app.get("/model-info")
async def model_info():
    """Get information about the loaded model."""
    if not model_data:
        return {"loaded": False}
    
    info = {
        "loaded": True,
        "type": model_data.get('type'),
        "version": model_data.get('version', 'unknown'),
    }
    
    if model_data['type'] == 'json':
        info['feature_count'] = len(model_data.get('feature_names', []))
        info['trained_at'] = model_data.get('trained_at')
    
    return info


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
