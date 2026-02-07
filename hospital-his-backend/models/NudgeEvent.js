/**
 * NudgeEvent Model
 * 
 * PURPOSE: Stores EVERY nudge sent to patients with full feature snapshot.
 * This is our ML training data - we use it to learn which nudge types
 * work best for which patient contexts.
 * 
 * LEARNING CYCLE:
 * 1. Extract features from patient context
 * 2. Score all nudge types with ML model
 * 3. Send highest-probability nudge
 * 4. Patient acts or ignores
 * 5. Log outcome → This becomes training data
 * 6. Retrain model periodically → Better predictions
 */

const mongoose = require('mongoose');

const NudgeEventSchema = new mongoose.Schema({
    // === IDENTIFIERS ===
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    
    // Link to the actual CareNudge if one was created
    nudgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareNudge',
    },

    // === WHAT WAS SENT ===
    nudgeType: {
        type: String,
        required: true,
        enum: [
            'missing_log',
            'low_hydration', 
            'declining_score',
            'improving_score',
            'sleep_deficit',
            'mood_pattern',
            'streak_celebration',
            'appointment_reminder',
            'medication_reminder',
            'symptom_followup',
            'wellness_checkin',
        ],
    },

    // === FEATURE SNAPSHOT (ML Input) ===
    // These are the features we use to predict P(action | features, nudge_type)
    features: {
        // Health metrics
        healthScore: { type: Number, min: 0, max: 100 },
        healthScoreTrend: { 
            type: String, 
            enum: ['improving', 'stable', 'declining', 'unknown'],
            default: 'unknown',
        },
        
        // Behavioral metrics (7-day averages)
        avgSleep7d: { type: Number },           // Hours
        avgMood7d: { type: Number, min: 1, max: 5 },  // 1=sad, 5=happy
        activityFrequency: { type: Number },    // Logs per day
        loggingConsistency: { type: Number, min: 0, max: 1 },  // % of days with logs
        
        // Engagement metrics
        daysSinceLastInteraction: { type: Number },
        daysSinceLastLog: { type: Number },
        previousNudgeSuccessRate: { type: Number, min: 0, max: 1 },  // Historical action rate
        totalNudgesReceived: { type: Number, default: 0 },
        totalNudgesActedOn: { type: Number, default: 0 },
        
        // Temporal features (important for timing optimization)
        hourOfDay: { type: Number, min: 0, max: 23 },
        dayOfWeek: { type: Number, min: 0, max: 6 },  // 0=Sunday
        isWeekend: { type: Boolean },
        
        // Risk signals
        hasActiveSymptoms: { type: Boolean },
        hasMissedAppointment: { type: Boolean },
        daysUntilNextAppointment: { type: Number },
    },

    // === ML MODEL OUTPUT ===
    prediction: {
        // The probability the model assigned to this nudge type
        actionProbability: { type: Number, min: 0, max: 1 },
        
        // All candidate scores for comparison
        allCandidateScores: [{
            nudgeType: String,
            probability: Number,
        }],
        
        // Which model version made this prediction
        modelVersion: { type: String, default: 'v1_logistic' },
        
        // Was this an exploration (random) or exploitation (best) choice?
        selectionMode: {
            type: String,
            enum: ['exploit', 'explore'],
            default: 'exploit',
        },
    },

    // === TIMING ===
    sentAt: { type: Date, default: Date.now, index: true },
    
    // === OUTCOME (Updated after patient responds) ===
    outcome: {
        // Did the patient take action?
        acted: { type: Boolean, default: false },
        
        // What action did they take?
        actionType: {
            type: String,
            enum: ['clicked', 'marked_done', 'dismissed', 'ignored', 'expired'],
        },
        
        // How long did it take them to respond?
        responseTimeMs: { type: Number },
        
        // When did they respond?
        actionTimestamp: { type: Date },
        
        // Health score after nudge (for measuring actual impact)
        healthScoreAfter: { type: Number },
        healthScoreDelta: { type: Number },  // Change from before
        
        // Did they complete the intended action? (e.g., actually logged something)
        completedIntendedAction: { type: Boolean, default: false },
        
        // Optional feedback
        feedback: { type: String, enum: ['helpful', 'not_helpful'] },
    },

    // === METADATA ===
    // Which version of the orchestrator sent this?
    orchestratorVersion: { type: String, default: 'v2_agentic' },
    
    // Any special flags
    isExploration: { type: Boolean, default: false },  // Random choice for learning
    wasOverridden: { type: Boolean, default: false },  // Manual intervention

}, { timestamps: true });

// === INDEXES ===
// For training data queries
NudgeEventSchema.index({ sentAt: -1 });
NudgeEventSchema.index({ 'outcome.acted': 1 });
NudgeEventSchema.index({ nudgeType: 1, 'outcome.acted': 1 });

// For patient history queries
NudgeEventSchema.index({ patient: 1, sentAt: -1 });

// === VIRTUAL: Compute reward signal for RL (future) ===
NudgeEventSchema.virtual('rewardSignal').get(function() {
    if (!this.outcome) return 0;
    
    let reward = 0;
    
    // Base reward for action
    if (this.outcome.acted) reward += 0.5;
    
    // Bonus for completing intended action
    if (this.outcome.completedIntendedAction) reward += 0.3;
    
    // Bonus for positive health impact
    if (this.outcome.healthScoreDelta > 0) {
        reward += Math.min(this.outcome.healthScoreDelta / 10, 0.2);
    }
    
    // Penalty for dismissal
    if (this.outcome.actionType === 'dismissed') reward -= 0.1;
    
    // Penalty for ignore/expire
    if (this.outcome.actionType === 'ignored' || this.outcome.actionType === 'expired') {
        reward -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, reward));  // Clamp to [-1, 1]
});

// === STATIC: Get training data for ML model ===
NudgeEventSchema.statics.getTrainingData = async function(options = {}) {
    const { minEvents = 100, daysBack = 90 } = options;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const events = await this.find({
        sentAt: { $gte: cutoffDate },
        'outcome.actionType': { $exists: true },  // Only completed outcomes
    }).select('features nudgeType outcome.acted outcome.completedIntendedAction');
    
    if (events.length < minEvents) {
        console.log(`[NudgeEvent] Only ${events.length} training samples, need ${minEvents}`);
        return null;
    }
    
    // Transform to ML-ready format
    return events.map(e => ({
        features: {
            health_score: e.features.healthScore || 50,
            health_score_trend: e.features.healthScoreTrend === 'improving' ? 1 : 
                               e.features.healthScoreTrend === 'declining' ? -1 : 0,
            avg_sleep_7d: e.features.avgSleep7d || 7,
            avg_mood_7d: e.features.avgMood7d || 3,
            activity_frequency: e.features.activityFrequency || 0,
            logging_consistency: e.features.loggingConsistency || 0,
            days_since_last_interaction: e.features.daysSinceLastInteraction || 7,
            previous_nudge_success_rate: e.features.previousNudgeSuccessRate || 0.5,
            hour_of_day: e.features.hourOfDay || 12,
            day_of_week: e.features.dayOfWeek || 3,
            is_weekend: e.features.isWeekend ? 1 : 0,
        },
        nudge_type: e.nudgeType,
        label: e.outcome.acted ? 1 : 0,
    }));
};

module.exports = mongoose.model('NudgeEvent', NudgeEventSchema);
