const mongoose = require('mongoose');

/**
 * CareNudge Model - Smart Nudges with LLM Generation & Effectiveness Tracking
 * Phase 2 of Wellness Agent
 */
const careNudgeSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    // LLM-generated explanation of why this nudge was created
    reasoning: {
        type: String,
        default: null,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
    },
    type: {
        type: String,
        enum: ['reminder', 'suggestion', 'observation', 'alert', 'celebration', 'insight'],
        default: 'suggestion',
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'done', 'dismissed', 'expired'],
        default: 'pending',
    },
    // What triggered this nudge
    generatedTrigger: {
        type: String,
        enum: [
            'missing_log', 'low_hydration', 'declining_score', 'improving_score',
            'mood_pattern', 'symptom_pattern', 'symptom_followup', 'sleep_deficit', 'activity_low',
            'appointment_reminder', 'medication_reminder', 'goal_progress',
            'streak_celebration', 'wellness_checkin', 'custom'
        ],
        required: false
    },
    // Meta information for debugging/display
    meta: {
        modelVersion: String,
        selectionMode: String,
        confidenceScore: Number,
    },
    // Generation source
    generationSource: {
        type: String,
        enum: ['rule_based', 'llm_generated', 'hybrid'],
        default: 'rule_based',
    },
    // Context snapshot at generation time (for LLM)
    contextSnapshot: {
        healthScore: Number,
        healthTrend: String,
        recentSymptoms: [String],
        recentMoods: [String],
        daysSinceLastLog: Number,
    },
    // Action configuration
    actionLink: {
        type: String, // internal route link e.g., '/log-mood'
        required: false
    },
    actionLabel: {
        type: String,
        default: 'Take Action',
    },
    // Effectiveness tracking
    effectiveness: {
        // When user first saw this nudge
        viewedAt: Date,
        // How long user looked at it (if trackable)
        viewDurationMs: Number,
        // What action was taken
        actionTaken: {
            type: String,
            enum: ['clicked_action', 'marked_done', 'dismissed', 'expired', 'ignored', null],
            default: null,
        },
        // Did they complete the intended action after clicking?
        actionCompleted: {
            type: Boolean,
            default: false,
        },
        // Time from viewing to responding
        responseTimeMs: Number,
        // User feedback (optional)
        feedback: {
            helpful: Boolean,
            comment: String,
        },
    },
    // Scheduling
    scheduledFor: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    respondedAt: {
        type: Date
    }
});

// Indexes for efficient querying
careNudgeSchema.index({ patient: 1, status: 1 });
careNudgeSchema.index({ patient: 1, generatedTrigger: 1, status: 1 });
careNudgeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for auto-expiry
careNudgeSchema.index({ scheduledFor: 1 });

// Virtual for calculating effectiveness score
careNudgeSchema.virtual('effectivenessScore').get(function() {
    if (!this.effectiveness?.actionTaken) return null;
    
    let score = 0;
    if (this.effectiveness.actionTaken === 'clicked_action') score += 30;
    if (this.effectiveness.actionTaken === 'marked_done') score += 20;
    if (this.effectiveness.actionCompleted) score += 40;
    if (this.effectiveness.feedback?.helpful) score += 10;
    
    // Penalize slow response (over 1 hour)
    if (this.effectiveness.responseTimeMs && this.effectiveness.responseTimeMs < 3600000) {
        score += 10;
    }
    
    return score;
});

const CareNudge = mongoose.model('CareNudge', careNudgeSchema);

module.exports = CareNudge;
