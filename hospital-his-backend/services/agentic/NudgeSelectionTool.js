/**
 * NudgeSelectionTool - The Agent's "Decision Maker" (ML)
 * 
 * PURPOSE: Score candidate nudge types and select the optimal one.
 * This is where the ML magic happens.
 * 
 * ARCHITECTURE: Pluggable model system with 3 levels:
 * 
 * 1. HEURISTIC MODEL (Cold Start)
 *    - Uses hand-crafted weights based on domain knowledge
 *    - Works immediately with no training data
 *    - Provides reasonable baseline
 * 
 * 2. TRAINED MODEL (After ~100 events)
 *    - Logistic Regression trained on NudgeEvent data
 *    - Can be loaded from file (trained offline)
 *    - Learns patient-specific patterns
 * 
 * 3. ML MICROSERVICE (Production)
 *    - Calls external Python service
 *    - Supports XGBoost, Neural Networks, etc.
 *    - Can do real-time retraining
 * 
 * EXPLORATION: Uses epsilon-greedy strategy to balance:
 * - EXPLOIT: Pick the nudge with highest P(action) [most of the time]
 * - EXPLORE: Pick random nudge [sometimes, to learn new patterns]
 */

const axios = require('axios');

// Configuration
const ML_SERVICE_URL = process.env.ML_NUDGE_SERVICE_URL || null;
const EXPLORATION_RATE = parseFloat(process.env.NUDGE_EXPLORATION_RATE || '0.1'); // 10% exploration
const MODEL_VERSION = 'v1_heuristic';

class NudgeSelectionTool {
    constructor() {
        this.name = 'NudgeSelectionTool';
        this.description = 'ML-based nudge selection with probability scoring';
        
        // Trained model weights (loaded from file or default heuristic)
        this.modelWeights = null;
        this.modelVersion = MODEL_VERSION;
    }

    /**
     * Main method: Select optimal nudge from candidates
     * 
     * @param {Object} features - ML features from ContextTool
     * @param {Array} candidates - Candidate nudges from RiskAssessmentTool
     * @param {Object} options - { explore: boolean, patientId: string }
     * @returns {Object} Selected nudge with probability score
     */
    async execute(features, candidates, options = {}) {
        console.log(`[NudgeSelectionTool] Scoring ${candidates.length} candidates...`);

        if (candidates.length === 0) {
            return null;
        }

        // Score all candidates
        const scoredCandidates = await this._scoreAllCandidates(features, candidates);

        // Decide: Explore or Exploit?
        const shouldExplore = options.forceExplore || Math.random() < EXPLORATION_RATE;
        
        let selected;
        let selectionMode;

        if (shouldExplore && scoredCandidates.length > 1) {
            // EXPLORATION: Pick random (but not the best) to learn
            const nonBestCandidates = scoredCandidates.slice(1);
            selected = nonBestCandidates[Math.floor(Math.random() * nonBestCandidates.length)];
            selectionMode = 'explore';
            console.log(`[NudgeSelectionTool] EXPLORE: Selected ${selected.type} (random)`);
        } else {
            // EXPLOITATION: Pick the best
            selected = scoredCandidates[0];
            selectionMode = 'exploit';
            console.log(`[NudgeSelectionTool] EXPLOIT: Selected ${selected.type} (P=${selected.probability.toFixed(3)})`);
        }

        return {
            selectedNudge: {
                type: selected.type,
                priority: selected.priority,
                probability: selected.probability,
            },
            allCandidateScores: scoredCandidates.map(c => ({
                nudgeType: c.type,
                probability: c.probability,
            })),
            selectionMode,
            modelVersion: this.modelVersion,
        };
    }

    /**
     * Score all candidate nudges
     */
    async _scoreAllCandidates(features, candidates) {
        // Try ML service first (most accurate)
        if (ML_SERVICE_URL) {
            try {
                const mlScores = await this._callMLService(features, candidates);
                if (mlScores) return mlScores;
            } catch (error) {
                console.error('[NudgeSelectionTool] ML service failed:', error.message);
                if (error.response) {
                    console.error('[NudgeSelectionTool] Response status:', error.response.status);
                    console.error('[NudgeSelectionTool] Response data:', JSON.stringify(error.response.data, null, 2));
                }
                console.log('[NudgeSelectionTool] Falling back to heuristic model');
            }
        }

        // Fallback to local model
        const scores = candidates.map(candidate => ({
            ...candidate,
            probability: this._heuristicScore(features, candidate.type),
        }));

        // Sort by probability (highest first)
        return scores.sort((a, b) => b.probability - a.probability);
    }

    /**
     * Call external ML microservice for scoring
     * Connects to the Python FastAPI service (ml_nudge_service.py)
     * 
     * SETUP:
     * 1. pip install fastapi uvicorn joblib numpy pandas scikit-learn
     * 2. cd scripts && python train_nudge_model.py  (train the model)
     * 3. uvicorn ml_nudge_service:app --host 0.0.0.0 --port 8000
     * 4. Set ML_NUDGE_SERVICE_URL=http://localhost:8000
     */
    async _callMLService(features, candidates) {
        // Convert health score trend from string to int
        const trendMap = { 'improving': 1, 'stable': 0, 'declining': -1, 'unknown': 0 };
        const trendValue = typeof features.healthScoreTrend === 'string' 
            ? (trendMap[features.healthScoreTrend] || 0) 
            : (features.healthScoreTrend || 0);

        // Convert features to snake_case for Python service
        const pythonFeatures = {
            health_score: features.healthScore || 50,
            health_score_trend: trendValue,
            avg_sleep_7d: features.avgSleep7d || 7,
            avg_mood_7d: features.avgMood7d || 3,
            activity_frequency: features.activityFrequency || 0.5,
            logging_consistency: features.loggingConsistency || 0.5,
            days_since_last_interaction: features.daysSinceLastInteraction || 3,
            days_since_last_log: features.daysSinceLastLog || 2,
            previous_nudge_success_rate: features.previousNudgeSuccessRate || 0.5,
            hour_of_day: features.hourOfDay || 12,
            day_of_week: features.dayOfWeek || 3,
            is_weekend: features.isWeekend || 0,
        };

        const requestBody = {
            features: pythonFeatures,
            candidate_types: candidates.map(c => c.type),
        };
        
        console.log(`[NudgeSelectionTool] Calling ML service: ${ML_SERVICE_URL}/predict`);
        console.log(`[NudgeSelectionTool] Request body:`, JSON.stringify(requestBody, null, 2));

        const response = await axios.post(`${ML_SERVICE_URL}/predict`, requestBody, { timeout: 3000 });

        if (response.data.success) {
            this.modelVersion = response.data.model_version;
            console.log(`[NudgeSelectionTool] Using ML model: ${this.modelVersion}`);
            
            // Map probabilities from dict response
            const probabilities = response.data.probabilities;
            return candidates.map(candidate => ({
                ...candidate,
                probability: probabilities[candidate.type] || 0.5,
            })).sort((a, b) => b.probability - a.probability);
        }
        return null;
    }

    /**
     * HEURISTIC MODEL
     * 
     * This is a hand-crafted scoring function that works without training data.
     * It encodes domain knowledge about what makes nudges effective.
     * 
     * The formula: P(action) = sigmoid(Σ(feature_i * weight_i) + nudge_bias)
     */
    _heuristicScore(features, nudgeType) {
        // Feature weights (learned from domain knowledge)
        const featureWeights = {
            // Positive engagement signals → higher P(action)
            previousNudgeSuccessRate: 2.0,   // Past behavior predicts future
            loggingConsistency: 1.5,          // Consistent users more likely to act
            
            // Negative signals → lower P(action)
            daysSinceLastInteraction: -0.15,  // Disengaged users less likely
            daysSinceLastLog: -0.1,
            
            // Health urgency → some people act more when concerned
            healthScoreInverted: 0.02,        // Lower score → slightly higher action
            
            // Temporal factors
            isWeekend: -0.3,                  // People less engaged on weekends
            isMorning: 0.2,                   // Morning nudges work better
            isEvening: 0.1,                   // Evening also decent
        };

        // Nudge type biases (some nudge types inherently more actionable)
        const nudgeBiases = {
            'appointment_reminder': 0.8,      // High - concrete action
            'missing_log': 0.5,               // Medium-high - easy action
            'sleep_deficit': 0.3,             // Medium
            'declining_score': 0.4,           // Medium - concern drives action
            'mood_pattern': 0.2,              // Lower - more personal
            'improving_score': 0.6,           // High - positive reinforcement
            'streak_celebration': 0.7,        // High - feels good
            'wellness_checkin': 0.3,          // Medium-low
            'symptom_followup': 0.4,          // Medium
        };

        // Compute weighted sum
        let score = 0;
        
        // Feature contributions
        score += features.previousNudgeSuccessRate * featureWeights.previousNudgeSuccessRate;
        score += features.loggingConsistency * featureWeights.loggingConsistency;
        score += features.daysSinceLastInteraction * featureWeights.daysSinceLastInteraction;
        score += features.daysSinceLastLog * featureWeights.daysSinceLastLog;
        score += (100 - features.healthScore) / 100 * featureWeights.healthScoreInverted;
        
        // Temporal
        if (features.isWeekend) score += featureWeights.isWeekend;
        if (features.hourOfDay >= 6 && features.hourOfDay <= 10) score += featureWeights.isMorning;
        if (features.hourOfDay >= 18 && features.hourOfDay <= 21) score += featureWeights.isEvening;
        
        // Nudge type bias
        score += nudgeBiases[nudgeType] || 0;

        // Sigmoid to get probability [0, 1]
        return this._sigmoid(score);
    }

    /**
     * Sigmoid function: maps any real number to (0, 1)
     */
    _sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    /**
     * Convert features object to vector for ML service
     */
    _featuresToVector(features) {
        return [
            features.healthScore / 100,
            features.healthScoreTrend === 'improving' ? 1 : 
                features.healthScoreTrend === 'declining' ? -1 : 0,
            features.avgSleep7d / 10,
            features.avgMood7d / 5,
            features.activityFrequency,
            features.loggingConsistency,
            features.daysSinceLastInteraction / 10,
            features.previousNudgeSuccessRate,
            features.hourOfDay / 24,
            features.dayOfWeek / 7,
            features.isWeekend ? 1 : 0,
        ];
    }

    /**
     * Load trained model weights from file
     * This would be generated by a Python training pipeline
     */
    async loadTrainedModel(modelPath) {
        try {
            const fs = require('fs').promises;
            const modelData = JSON.parse(await fs.readFile(modelPath, 'utf8'));
            this.modelWeights = modelData.weights;
            this.modelVersion = modelData.version;
            console.log(`[NudgeSelectionTool] Loaded model ${this.modelVersion}`);
            return true;
        } catch (error) {
            console.log('[NudgeSelectionTool] No trained model found, using heuristic');
            return false;
        }
    }
}

module.exports = new NudgeSelectionTool();
