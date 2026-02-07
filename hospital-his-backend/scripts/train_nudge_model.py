"""
Nudge ML Model Training Pipeline

This script trains a machine learning model to predict P(action | features, nudge_type)
using historical NudgeEvent data from MongoDB.

REQUIREMENTS:
    pip install pymongo scikit-learn pandas numpy joblib xgboost

USAGE:
    1. Wait until you have 100+ NudgeEvents with outcomes
    2. Run: python train_nudge_model.py
    3. Model saved to: models/nudge_model_v1.joblib
    4. Weights exported to: models/nudge_weights.json (for Node.js)

WHAT THIS DOES:
    1. Connects to MongoDB and fetches NudgeEvent training data
    2. Preprocesses features (normalize, one-hot encode nudge types)
    3. Trains a Logistic Regression model (or XGBoost)
    4. Exports model weights for use in Node.js

THE MATH:
    Logistic Regression: P(action=1) = sigmoid(w · x + b)
    Where:
        x = feature vector [health_score, avg_sleep, ...]
        w = learned weights
        b = bias term
        sigmoid(z) = 1 / (1 + e^(-z))
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
import joblib

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/lifeline')
MIN_TRAINING_SAMPLES = 100
MODEL_OUTPUT_DIR = 'models'

# Feature columns (must match ContextTool.js)
FEATURE_COLUMNS = [
    'health_score',
    'health_score_trend',  # Will be encoded: improving=1, stable=0, declining=-1
    'avg_sleep_7d',
    'avg_mood_7d',
    'activity_frequency',
    'logging_consistency',
    'days_since_last_interaction',
    'days_since_last_log',
    'previous_nudge_success_rate',
    'hour_of_day',
    'day_of_week',
    'is_weekend',
]

# Nudge types (must match NudgeSelectionTool.js)
NUDGE_TYPES = [
    'missing_log',
    'low_hydration',
    'declining_score',
    'improving_score',
    'sleep_deficit',
    'mood_pattern',
    'streak_celebration',
    'appointment_reminder',
    'symptom_followup',
    'wellness_checkin',
]


def connect_to_mongodb():
    """Connect to MongoDB and return the database."""
    print(f"Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    print(f"Connected to database: {db.name}")
    return db


def fetch_training_data(db):
    """
    Fetch NudgeEvents with outcomes from MongoDB.
    
    Returns DataFrame with:
        - All feature columns
        - nudge_type column
        - label column (1 if acted, 0 if not)
    """
    print("Fetching training data...")
    
    # Query: Get events where outcome exists
    events = list(db.nudgeevents.find({
        'outcome.actionType': {'$exists': True}
    }))
    
    print(f"Found {len(events)} events with outcomes")
    
    if len(events) < MIN_TRAINING_SAMPLES:
        print(f"WARNING: Need at least {MIN_TRAINING_SAMPLES} samples, only have {len(events)}")
        print("Generating synthetic data for demonstration...")
        return generate_synthetic_data(500)
    
    # Transform to DataFrame
    rows = []
    for event in events:
        features = event.get('features', {})
        outcome = event.get('outcome', {})
        
        row = {
            'health_score': features.get('healthScore', 50),
            'health_score_trend': encode_trend(features.get('healthScoreTrend', 'stable')),
            'avg_sleep_7d': features.get('avgSleep7d', 7),
            'avg_mood_7d': features.get('avgMood7d', 3),
            'activity_frequency': features.get('activityFrequency', 0.5),
            'logging_consistency': features.get('loggingConsistency', 0.5),
            'days_since_last_interaction': features.get('daysSinceLastInteraction', 3),
            'days_since_last_log': features.get('daysSinceLastLog', 2),
            'previous_nudge_success_rate': features.get('previousNudgeSuccessRate', 0.5),
            'hour_of_day': features.get('hourOfDay', 12),
            'day_of_week': features.get('dayOfWeek', 3),
            'is_weekend': 1 if features.get('isWeekend', False) else 0,
            'nudge_type': event.get('nudgeType', 'wellness_checkin'),
            'label': 1 if outcome.get('acted', False) else 0,
        }
        rows.append(row)
    
    return pd.DataFrame(rows)


def encode_trend(trend):
    """Encode health score trend as numeric."""
    mapping = {'improving': 1, 'stable': 0, 'declining': -1, 'unknown': 0}
    return mapping.get(trend, 0)


def generate_synthetic_data(n_samples=500):
    """
    Generate synthetic training data for demonstration.
    
    This simulates realistic patterns:
    - Higher success rate with higher health scores
    - Morning nudges work better
    - Consistent users are more likely to act
    - Appointment reminders have high success rate
    """
    print(f"Generating {n_samples} synthetic training samples...")
    
    np.random.seed(42)
    
    rows = []
    for _ in range(n_samples):
        # Generate features
        health_score = np.random.normal(60, 20)
        health_score = np.clip(health_score, 0, 100)
        
        consistency = np.random.beta(2, 5)  # Most users are inconsistent
        avg_sleep = np.random.normal(6.5, 1.5)
        avg_mood = np.random.normal(3, 0.8)
        
        hour = np.random.choice(24)
        day = np.random.choice(7)
        is_weekend = day in [0, 6]
        
        success_rate = np.random.beta(2, 3)  # Historical success rate
        days_inactive = np.random.exponential(3)
        
        nudge_type = np.random.choice(NUDGE_TYPES)
        
        # Simulate outcome based on features (this is the "ground truth" we're learning)
        # These weights simulate what we WANT the model to learn
        prob = 0.3  # Base probability
        
        # Feature effects (simulated "true" relationship)
        prob += 0.002 * health_score
        prob += 0.15 * consistency
        prob += 0.3 * success_rate
        prob -= 0.02 * days_inactive
        
        # Time effects
        if 7 <= hour <= 10:  # Morning
            prob += 0.1
        if is_weekend:
            prob -= 0.05
            
        # Nudge type effects
        type_effects = {
            'appointment_reminder': 0.2,
            'streak_celebration': 0.15,
            'improving_score': 0.1,
            'missing_log': 0.05,
            'declining_score': 0.05,
            'mood_pattern': -0.05,
        }
        prob += type_effects.get(nudge_type, 0)
        
        # Clip and sample
        prob = np.clip(prob, 0.05, 0.95)
        acted = np.random.random() < prob
        
        rows.append({
            'health_score': health_score,
            'health_score_trend': np.random.choice([1, 0, -1], p=[0.3, 0.5, 0.2]),
            'avg_sleep_7d': np.clip(avg_sleep, 3, 10),
            'avg_mood_7d': np.clip(avg_mood, 1, 5),
            'activity_frequency': np.random.exponential(0.5),
            'logging_consistency': consistency,
            'days_since_last_interaction': days_inactive,
            'days_since_last_log': max(0, days_inactive - 1),
            'previous_nudge_success_rate': success_rate,
            'hour_of_day': hour,
            'day_of_week': day,
            'is_weekend': 1 if is_weekend else 0,
            'nudge_type': nudge_type,
            'label': 1 if acted else 0,
        })
    
    return pd.DataFrame(rows)


def prepare_features(df):
    """
    Prepare feature matrix for training.
    
    This does:
    1. One-hot encoding for nudge_type
    2. Normalization of continuous features
    """
    # Separate features and label
    X = df.drop(columns=['label'])
    y = df['label']
    
    # One-hot encode nudge_type
    nudge_dummies = pd.get_dummies(X['nudge_type'], prefix='nudge')
    X = X.drop(columns=['nudge_type'])
    X = pd.concat([X, nudge_dummies], axis=1)
    
    return X, y


def train_model(X, y):
    """
    Train a Logistic Regression model.
    
    WHY LOGISTIC REGRESSION:
    1. Outputs probabilities (not just yes/no)
    2. Coefficients are interpretable (we can see what features matter)
    3. Works well with small datasets
    4. Fast inference
    
    ALTERNATIVE: XGBoost for better accuracy with larger datasets
    """
    print("\n=== TRAINING MODEL ===")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Normalize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Logistic Regression
    model = LogisticRegression(
        penalty='l2',           # Regularization to prevent overfitting
        C=1.0,                  # Regularization strength
        max_iter=1000,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    print("\n=== MODEL PERFORMANCE ===")
    print(f"Accuracy:  {accuracy_score(y_test, y_pred):.3f}")
    print(f"Precision: {precision_score(y_test, y_pred):.3f}")
    print(f"Recall:    {recall_score(y_test, y_pred):.3f}")
    print(f"AUC-ROC:   {roc_auc_score(y_test, y_prob):.3f}")
    
    return model, scaler, X.columns.tolist()


def export_model(model, scaler, feature_names):
    """
    Export model in two formats:
    1. Joblib file (for Python inference)
    2. JSON weights (for Node.js inference)
    """
    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
    
    # Save Joblib (Python)
    joblib_path = os.path.join(MODEL_OUTPUT_DIR, 'nudge_model_v1.joblib')
    joblib.dump({
        'model': model,
        'scaler': scaler,
        'feature_names': feature_names
    }, joblib_path)
    print(f"\nSaved Python model: {joblib_path}")
    
    # Export weights to JSON (for Node.js)
    weights = {
        'version': 'v1_logistic',
        'trained_at': datetime.now().isoformat(),
        'feature_names': feature_names,
        'weights': model.coef_[0].tolist(),
        'bias': model.intercept_[0],
        'scaler_mean': scaler.mean_.tolist(),
        'scaler_std': scaler.scale_.tolist(),
    }
    
    json_path = os.path.join(MODEL_OUTPUT_DIR, 'nudge_weights.json')
    with open(json_path, 'w') as f:
        json.dump(weights, f, indent=2)
    print(f"Saved JSON weights: {json_path}")
    
    # Print top features
    print("\n=== TOP FEATURES BY IMPORTANCE ===")
    feature_importance = list(zip(feature_names, model.coef_[0]))
    feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)
    for name, weight in feature_importance[:10]:
        direction = "↑" if weight > 0 else "↓"
        print(f"  {direction} {name}: {weight:.4f}")


def main():
    """Main training pipeline."""
    print("=" * 60)
    print("NUDGE ML MODEL TRAINING PIPELINE")
    print("=" * 60)
    
    # 1. Connect to database
    try:
        db = connect_to_mongodb()
        df = fetch_training_data(db)
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        print("Using synthetic data for demonstration...")
        df = generate_synthetic_data(500)
    
    print(f"\nDataset shape: {df.shape}")
    print(f"Label distribution:\n{df['label'].value_counts()}")
    
    # 2. Prepare features
    X, y = prepare_features(df)
    print(f"\nFeature matrix shape: {X.shape}")
    
    # 3. Train model
    model, scaler, feature_names = train_model(X, y)
    
    # 4. Export model
    export_model(model, scaler, feature_names)
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print("""
NEXT STEPS:
1. In Node.js, load nudge_weights.json
2. Update NudgeSelectionTool.js to use learned weights
3. Or deploy as Python microservice for real-time inference
    """)


if __name__ == '__main__':
    main()
