/**
 * OutcomeTrackingTool - The Agent's "Memory"
 * 
 * PURPOSE: Record every nudge sent with full feature snapshot, then track outcomes.
 * This creates the training data that makes the ML model smarter over time.
 * 
 * THE LEARNING LOOP:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                                                             │
 * │  1. Nudge Sent ────► Features Logged ────► Outcome Tracked │
 * │         │                   │                    │          │
 * │         └───────────────────┴────────────────────┘          │
 * │                             │                               │
 * │                   Training Data for ML                      │
 * │                             │                               │
 * │                    Better Predictions                       │
 * │                             │                               │
 * │                    Higher Action Rates                      │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * This is how the system gets smarter: by remembering what worked.
 */

const NudgeEvent = require('../../models/NudgeEvent');
const HealthScore = require('../../models/HealthScore');

class OutcomeTrackingTool {
    constructor() {
        this.name = 'OutcomeTrackingTool';
        this.description = 'Records and tracks nudge outcomes for ML learning';
    }

    /**
     * Record a nudge being sent (creates NudgeEvent)
     * 
     * @param {string} patientId - Patient ObjectId
     * @param {Object} features - ML features at send time
     * @param {Object} selection - The ML selection result
     * @param {ObjectId} nudgeId - The CareNudge that was created
     * @returns {NudgeEvent} The created event
     */
    async recordNudgeSent(patientId, features, selection, nudgeId = null) {
        console.log(`[OutcomeTrackingTool] Recording nudge: ${selection.selectedNudge.type}`);

        const event = await NudgeEvent.create({
            patient: patientId,
            nudgeId: nudgeId,
            nudgeType: selection.selectedNudge.type,
            
            // Full feature snapshot - this is key for ML
            features: {
                healthScore: features.healthScore,
                healthScoreTrend: features.healthScoreTrend,
                avgSleep7d: features.avgSleep7d,
                avgMood7d: features.avgMood7d,
                activityFrequency: features.activityFrequency,
                loggingConsistency: features.loggingConsistency,
                daysSinceLastInteraction: features.daysSinceLastInteraction,
                daysSinceLastLog: features.daysSinceLastLog,
                previousNudgeSuccessRate: features.previousNudgeSuccessRate,
                totalNudgesReceived: features.totalNudgesReceived,
                totalNudgesActedOn: features.totalNudgesActedOn,
                hourOfDay: features.hourOfDay,
                dayOfWeek: features.dayOfWeek,
                isWeekend: features.isWeekend,
                hasActiveSymptoms: features.hasActiveSymptoms,
                daysUntilNextAppointment: features.daysUntilNextAppointment,
            },
            
            // ML prediction metadata
            prediction: {
                actionProbability: selection.selectedNudge.probability,
                allCandidateScores: selection.allCandidateScores,
                modelVersion: selection.modelVersion,
                selectionMode: selection.selectionMode,
            },
            
            isExploration: selection.selectionMode === 'explore',
        });

        console.log(`[OutcomeTrackingTool] Event created: ${event._id}`);
        return event;
    }

    /**
     * Record that patient viewed the nudge
     * 
     * @param {string} eventId - NudgeEvent ObjectId
     */
    async recordView(eventId) {
        return await NudgeEvent.findByIdAndUpdate(
            eventId,
            { 'outcome.viewedAt': new Date() },
            { new: true }
        );
    }

    /**
     * Record patient response to nudge
     * 
     * @param {string} eventId - NudgeEvent ObjectId or nudgeId
     * @param {string} action - 'clicked' | 'marked_done' | 'dismissed' | 'ignored'
     */
    async recordAction(eventIdOrNudgeId, action) {
        console.log(`[OutcomeTrackingTool] Recording action: ${action}`);

        // Try to find by eventId first, then by nudgeId
        let event = await NudgeEvent.findById(eventIdOrNudgeId);
        if (!event) {
            event = await NudgeEvent.findOne({ nudgeId: eventIdOrNudgeId });
        }
        
        if (!event) {
            console.log(`[OutcomeTrackingTool] Event not found: ${eventIdOrNudgeId}`);
            return null;
        }

        const acted = ['clicked', 'marked_done'].includes(action);
        const responseTimeMs = event.sentAt 
            ? new Date() - event.sentAt 
            : null;

        return await NudgeEvent.findByIdAndUpdate(
            event._id,
            {
                'outcome.acted': acted,
                'outcome.actionType': action,
                'outcome.actionTimestamp': new Date(),
                'outcome.responseTimeMs': responseTimeMs,
            },
            { new: true }
        );
    }

    /**
     * Record that patient completed the intended action
     * (e.g., actually logged symptoms after clicking nudge)
     * 
     * @param {string} eventId - NudgeEvent ObjectId
     */
    async recordActionCompleted(eventIdOrNudgeId) {
        let event = await NudgeEvent.findById(eventIdOrNudgeId);
        if (!event) {
            event = await NudgeEvent.findOne({ nudgeId: eventIdOrNudgeId });
        }
        
        if (!event) return null;

        return await NudgeEvent.findByIdAndUpdate(
            event._id,
            { 'outcome.completedIntendedAction': true },
            { new: true }
        );
    }

    /**
     * Record health score after nudge (for measuring real impact)
     * Should be called 24-48 hours after nudge
     * 
     * @param {string} eventId - NudgeEvent ObjectId
     */
    async recordHealthScoreImpact(eventIdOrNudgeId) {
        let event = await NudgeEvent.findById(eventIdOrNudgeId);
        if (!event) {
            event = await NudgeEvent.findOne({ nudgeId: eventIdOrNudgeId });
        }
        
        if (!event) return null;

        // Get current health score
        const currentScore = await HealthScore.findOne({ patient: event.patient })
            .sort({ calculatedAt: -1 });

        if (!currentScore) return event;

        const beforeScore = event.features?.healthScore || 50;
        const afterScore = currentScore.score;
        const delta = afterScore - beforeScore;

        return await NudgeEvent.findByIdAndUpdate(
            event._id,
            {
                'outcome.healthScoreAfter': afterScore,
                'outcome.healthScoreDelta': delta,
            },
            { new: true }
        );
    }

    /**
     * Record feedback from patient
     * 
     * @param {string} eventId - NudgeEvent ObjectId
     * @param {string} feedback - 'helpful' | 'not_helpful'
     */
    async recordFeedback(eventIdOrNudgeId, feedback) {
        let event = await NudgeEvent.findById(eventIdOrNudgeId);
        if (!event) {
            event = await NudgeEvent.findOne({ nudgeId: eventIdOrNudgeId });
        }
        
        if (!event) return null;

        return await NudgeEvent.findByIdAndUpdate(
            event._id,
            { 'outcome.feedback': feedback },
            { new: true }
        );
    }

    /**
     * Mark expired nudges (no response within 24 hours)
     * Should be run periodically by a cron job
     */
    async markExpiredNudges() {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 24);

        const result = await NudgeEvent.updateMany(
            {
                sentAt: { $lt: cutoff },
                'outcome.actionType': { $exists: false },
            },
            {
                'outcome.acted': false,
                'outcome.actionType': 'expired',
            }
        );

        console.log(`[OutcomeTrackingTool] Marked ${result.modifiedCount} expired nudges`);
        return result.modifiedCount;
    }

    /**
     * Get learning metrics for monitoring
     */
    async getLearningMetrics(daysBack = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysBack);

        const events = await NudgeEvent.find({
            sentAt: { $gte: cutoff },
            'outcome.actionType': { $exists: true },
        });

        const total = events.length;
        const acted = events.filter(e => e.outcome?.acted).length;
        const completed = events.filter(e => e.outcome?.completedIntendedAction).length;
        const positiveHealth = events.filter(e => (e.outcome?.healthScoreDelta || 0) > 0).length;

        // By selection mode
        const exploits = events.filter(e => e.prediction?.selectionMode === 'exploit');
        const explores = events.filter(e => e.prediction?.selectionMode === 'explore');

        return {
            total,
            acted,
            completed,
            positiveHealth,
            actionRate: total > 0 ? (acted / total * 100).toFixed(1) : 0,
            completionRate: acted > 0 ? (completed / acted * 100).toFixed(1) : 0,
            exploitActionRate: exploits.length > 0 
                ? (exploits.filter(e => e.outcome?.acted).length / exploits.length * 100).toFixed(1) 
                : 0,
            exploreActionRate: explores.length > 0 
                ? (explores.filter(e => e.outcome?.acted).length / explores.length * 100).toFixed(1) 
                : 0,
            trainingDataPoints: total,
        };
    }
}

module.exports = new OutcomeTrackingTool();
