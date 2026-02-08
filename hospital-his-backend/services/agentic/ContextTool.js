/**
 * ContextTool - The Agent's "Eyes"
 * 
 * PURPOSE: Gather patient data and transform it into ML-ready features.
 * This is the foundation of the agentic system - without good context,
 * the agent can't make good decisions.
 * 
 * KEY PRINCIPLE: Raw data → Normalized features
 * 
 * Example transformation:
 *   Raw: [{ mood: 'happy' }, { mood: 'sad' }, { mood: 'neutral' }]
 *   Feature: avgMood7d = 3.0 (on 1-5 scale)
 */

const Patient = require('../../models/Patient');
const { Signal, SIGNAL_CATEGORIES } = require('../../models/Signal');
const HealthScore = require('../../models/HealthScore');
const Appointment = require('../../models/Appointment');
const NudgeEvent = require('../../models/NudgeEvent');
const CareNudge = require('../../models/CareNudge');

// Mood type to numeric score mapping
const MOOD_SCORES = {
    'happy': 5,
    'calm': 4,
    'neutral': 3,
    'anxious': 2,
    'stressed': 2,
    'sad': 1,
};

class ContextTool {
    constructor() {
        this.name = 'ContextTool';
        this.description = 'Extracts patient context and computes ML features';
    }

    /**
     * Main method: Get full patient context with computed features
     * 
     * @param {string} patientId - MongoDB ObjectId
     * @returns {Object} Context with raw data + computed features
     */
    async execute(patientId) {
        console.log(`[ContextTool] Extracting context for patient: ${patientId}`);

        // Parallel data fetching for performance
        const [
            patient,
            healthScore,
            signals7d,
            signals30d,
            lastInteraction,
            nudgeHistory,
            upcomingAppointments,
        ] = await Promise.all([
            this._getPatient(patientId),
            this._getLatestHealthScore(patientId),
            this._getSignals(patientId, 7),
            this._getSignals(patientId, 30),
            this._getLastInteraction(patientId),
            this._getNudgeHistory(patientId),
            this._getUpcomingAppointments(patientId),
        ]);

        // Compute ML features from raw data
        const features = this._computeFeatures({
            healthScore,
            signals7d,
            signals30d,
            lastInteraction,
            nudgeHistory,
            upcomingAppointments,
        });

        return {
            // Raw data (for LLM message generation)
            raw: {
                patient,
                healthScore,
                recentSymptoms: this._filterByCategory(signals7d, SIGNAL_CATEGORIES.SYMPTOM),
                recentMoods: this._filterByCategory(signals7d, SIGNAL_CATEGORIES.MOOD),
                recentLifestyle: this._filterByCategory(signals7d, SIGNAL_CATEGORIES.LIFESTYLE),
                upcomingAppointments,
            },
            // ML-ready features (for nudge selection)
            features,
            // Metadata
            extractedAt: new Date(),
        };
    }

    // === PRIVATE DATA FETCHERS ===

    async _getPatient(patientId) {
        return await Patient.findById(patientId)
            .select('firstName lastName dateOfBirth gender email');
    }

    async _getLatestHealthScore(patientId) {
        return await HealthScore.findOne({ patient: patientId })
            .sort({ calculatedAt: -1 });
    }

    async _getSignals(patientId, daysBack) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysBack);
        
        return await Signal.find({
            patient: patientId,
            recordedAt: { $gte: cutoff },
            isActive: true,
        }).sort({ recordedAt: -1 });
    }

    async _getLastInteraction(patientId) {
        // Last nudge or conversation
        const lastNudge = await CareNudge.findOne({ patient: patientId })
            .sort({ createdAt: -1 })
            .select('createdAt');
        
        return lastNudge?.createdAt || null;
    }

    async _getNudgeHistory(patientId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const events = await NudgeEvent.find({
            patient: patientId,
            sentAt: { $gte: thirtyDaysAgo },
        });

        return {
            total: events.length,
            actedOn: events.filter(e => e.outcome?.acted).length,
            successRate: events.length > 0 
                ? events.filter(e => e.outcome?.acted).length / events.length 
                : 0.5,  // Default 50% if no history
        };
    }

    async _getUpcomingAppointments(patientId) {
        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        return await Appointment.find({
            patient: patientId,
            scheduledDate: { $gte: now, $lte: thirtyDaysLater },
            status: { $regex: /^(scheduled|confirmed)$/i },
        })
        .populate('doctor', 'name firstName lastName')
        .sort({ scheduledDate: 1 })
        .limit(5);
    }

    // === FEATURE COMPUTATION ===

    _filterByCategory(signals, category) {
        return signals.filter(s => s.category === category);
    }

    /**
     * THE CORE ML FEATURE ENGINEERING
     * 
     * This transforms raw patient data into normalized features.
     * Each feature is designed to be meaningful for predicting nudge effectiveness.
     */
    _computeFeatures({ healthScore, signals7d, signals30d, lastInteraction, nudgeHistory, upcomingAppointments }) {
        const now = new Date();
        
        // === Health Features ===
        const currentScore = healthScore?.score || 50;
        const trendDirection = healthScore?.trend?.direction || 'stable';
        
        // === Sleep Feature (7-day average) ===
        const sleepSignals = signals7d.filter(s => s.lifestyle?.sleep?.duration);
        const avgSleep7d = sleepSignals.length > 0
            ? sleepSignals.reduce((sum, s) => sum + s.lifestyle.sleep.duration, 0) / sleepSignals.length
            : 7;  // Default to healthy 7 hours
        
        // === Mood Feature (7-day average, normalized 1-5) ===
        const moodSignals = signals7d.filter(s => s.category === SIGNAL_CATEGORIES.MOOD);
        const moodScores = moodSignals.map(s => MOOD_SCORES[s.mood?.type] || 3);
        const avgMood7d = moodScores.length > 0
            ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
            : 3;  // Default neutral
        
        // === Activity Features ===
        const uniqueDays7d = new Set(signals7d.map(s => 
            s.recordedAt.toISOString().split('T')[0]
        )).size;
        const activityFrequency = signals7d.length / 7;  // Logs per day
        const loggingConsistency = uniqueDays7d / 7;  // % of days with logs
        
        // === Engagement Features ===
        const daysSinceLastInteraction = lastInteraction
            ? Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24))
            : 7;  // Default week if no history
        
        const lastSignal = signals30d[0];
        const daysSinceLastLog = lastSignal
            ? Math.floor((now - lastSignal.recordedAt) / (1000 * 60 * 60 * 24))
            : 3;
        
        // === Temporal Features (important for timing!) ===
        const hourOfDay = now.getHours();
        const dayOfWeek = now.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // === Risk Signals ===
        const symptoms7d = signals7d.filter(s => s.category === SIGNAL_CATEGORIES.SYMPTOM);
        const hasActiveSymptoms = symptoms7d.length > 0;
        
        const nextAppointment = upcomingAppointments[0];
        const daysUntilNextAppointment = nextAppointment
            ? Math.ceil((new Date(nextAppointment.scheduledDate) - now) / (1000 * 60 * 60 * 24))
            : 999;

        return {
            // Health
            healthScore: currentScore,
            healthScoreTrend: trendDirection,
            
            // Behavioral (7-day)
            avgSleep7d: Math.round(avgSleep7d * 10) / 10,
            avgMood7d: Math.round(avgMood7d * 10) / 10,
            activityFrequency: Math.round(activityFrequency * 100) / 100,
            loggingConsistency: Math.round(loggingConsistency * 100) / 100,
            
            // Engagement
            daysSinceLastInteraction,
            daysSinceLastLog,
            previousNudgeSuccessRate: Math.round(nudgeHistory.successRate * 100) / 100,
            totalNudgesReceived: nudgeHistory.total,
            totalNudgesActedOn: nudgeHistory.actedOn,
            
            // Temporal
            hourOfDay,
            dayOfWeek,
            isWeekend,
            
            // Risk
            hasActiveSymptoms,
            hasMissedAppointment: false,  // TODO: Implement
            daysUntilNextAppointment,
        };
    }
}

module.exports = new ContextTool();
