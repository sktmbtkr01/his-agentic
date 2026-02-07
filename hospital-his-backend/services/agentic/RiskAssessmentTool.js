/**
 * RiskAssessmentTool - The Agent's "Analyst"
 * 
 * PURPOSE: Analyze patient features and identify areas of concern.
 * This generates a list of CANDIDATE nudge types that might be relevant.
 * 
 * KEY INSIGHT: Not every patient needs every nudge type.
 * A patient with great sleep doesn't need sleep nudges.
 * This tool figures out WHICH nudge types are even worth considering.
 * 
 * The ML model then scores these candidates to pick the BEST one.
 */

// Risk thresholds (tunable parameters)
const THRESHOLDS = {
    SLEEP_DEFICIT: 6.0,           // Hours - below this is concern
    SLEEP_CRITICAL: 5.0,          // Hours - below this is critical
    MOOD_LOW: 2.5,                // 1-5 scale - below this is concern
    MOOD_CRITICAL: 2.0,           // Below this is critical
    HEALTH_SCORE_LOW: 60,         // Below this is concern
    HEALTH_SCORE_CRITICAL: 40,    // Below this is critical
    DAYS_INACTIVE: 2,             // Days without log = engagement risk
    DAYS_INACTIVE_CRITICAL: 5,    // Days = critical disengagement
    LOGGING_CONSISTENCY_LOW: 0.3, // Below 30% = inconsistent
    APPOINTMENT_SOON: 2,          // Days - reminder if within
};

class RiskAssessmentTool {
    constructor() {
        this.name = 'RiskAssessmentTool';
        this.description = 'Identifies behavioral risk areas and candidate nudge types';
    }

    /**
     * Analyze features and return risk assessment
     * 
     * @param {Object} features - ML features from ContextTool
     * @returns {Object} Risk assessment with severity and candidate nudges
     */
    execute(features) {
        console.log(`[RiskAssessmentTool] Analyzing risks...`);

        const risks = [];
        const candidateNudges = [];

        // === ENGAGEMENT RISK ===
        if (features.daysSinceLastLog >= THRESHOLDS.DAYS_INACTIVE_CRITICAL) {
            risks.push({
                area: 'engagement',
                severity: 'critical',
                reason: `No logs for ${features.daysSinceLastLog} days`,
            });
            candidateNudges.push({
                type: 'missing_log',
                priority: 'high',
                relevanceScore: 0.9,
            });
        } else if (features.daysSinceLastLog >= THRESHOLDS.DAYS_INACTIVE) {
            risks.push({
                area: 'engagement',
                severity: 'medium',
                reason: `No logs for ${features.daysSinceLastLog} days`,
            });
            candidateNudges.push({
                type: 'missing_log',
                priority: 'medium',
                relevanceScore: 0.7,
            });
        }

        // === HEALTH SCORE RISK ===
        if (features.healthScoreTrend === 'declining') {
            risks.push({
                area: 'health_trend',
                severity: features.healthScore < THRESHOLDS.HEALTH_SCORE_CRITICAL ? 'critical' : 'medium',
                reason: `Health score declining (${features.healthScore})`,
            });
            candidateNudges.push({
                type: 'declining_score',
                priority: features.healthScore < THRESHOLDS.HEALTH_SCORE_CRITICAL ? 'high' : 'medium',
                relevanceScore: 0.85,
            });
        } else if (features.healthScoreTrend === 'improving' && features.healthScore > 70) {
            // This is a POSITIVE signal - celebrate!
            risks.push({
                area: 'celebration',
                severity: 'positive',
                reason: `Health score improving (${features.healthScore})`,
            });
            candidateNudges.push({
                type: 'improving_score',
                priority: 'low',
                relevanceScore: 0.6,
            });
        }

        // === SLEEP RISK ===
        if (features.avgSleep7d < THRESHOLDS.SLEEP_CRITICAL) {
            risks.push({
                area: 'sleep',
                severity: 'critical',
                reason: `Severely low sleep (${features.avgSleep7d}h avg)`,
            });
            candidateNudges.push({
                type: 'sleep_deficit',
                priority: 'high',
                relevanceScore: 0.85,
            });
        } else if (features.avgSleep7d < THRESHOLDS.SLEEP_DEFICIT) {
            risks.push({
                area: 'sleep',
                severity: 'medium',
                reason: `Below optimal sleep (${features.avgSleep7d}h avg)`,
            });
            candidateNudges.push({
                type: 'sleep_deficit',
                priority: 'medium',
                relevanceScore: 0.65,
            });
        }

        // === MOOD RISK ===
        if (features.avgMood7d < THRESHOLDS.MOOD_CRITICAL) {
            risks.push({
                area: 'mood',
                severity: 'critical',
                reason: `Low mood detected (${features.avgMood7d}/5)`,
            });
            candidateNudges.push({
                type: 'mood_pattern',
                priority: 'high',
                relevanceScore: 0.8,
            });
        } else if (features.avgMood7d < THRESHOLDS.MOOD_LOW) {
            risks.push({
                area: 'mood',
                severity: 'medium',
                reason: `Below average mood (${features.avgMood7d}/5)`,
            });
            candidateNudges.push({
                type: 'mood_pattern',
                priority: 'medium',
                relevanceScore: 0.6,
            });
        }

        // === APPOINTMENT REMINDER ===
        if (features.daysUntilNextAppointment <= THRESHOLDS.APPOINTMENT_SOON && 
            features.daysUntilNextAppointment > 0) {
            risks.push({
                area: 'appointment',
                severity: 'info',
                reason: `Appointment in ${features.daysUntilNextAppointment} days`,
            });
            candidateNudges.push({
                type: 'appointment_reminder',
                priority: features.daysUntilNextAppointment === 1 ? 'high' : 'medium',
                relevanceScore: 0.75,
            });
        }

        // === CONSISTENCY REWARD (Streak) ===
        if (features.loggingConsistency >= 0.8 && features.activityFrequency >= 1) {
            risks.push({
                area: 'celebration',
                severity: 'positive',
                reason: `Excellent logging consistency (${Math.round(features.loggingConsistency * 100)}%)`,
            });
            candidateNudges.push({
                type: 'streak_celebration',
                priority: 'low',
                relevanceScore: 0.5,
            });
        }

        // === SYMPTOM FOLLOWUP ===
        if (features.hasActiveSymptoms) {
            risks.push({
                area: 'symptoms',
                severity: 'medium',
                reason: 'Active symptoms logged recently',
            });
            candidateNudges.push({
                type: 'symptom_followup',
                priority: 'medium',
                relevanceScore: 0.65,
            });
        }

        // === GENERAL WELLNESS CHECK-IN (Fallback) ===
        // If we have no specific risks but patient hasn't engaged, do wellness check
        if (candidateNudges.length === 0 && features.daysSinceLastInteraction >= 3) {
            candidateNudges.push({
                type: 'wellness_checkin',
                priority: 'low',
                relevanceScore: 0.4,
            });
        }

        // Compute overall risk level
        const overallRiskLevel = this._computeOverallRisk(risks);

        const assessment = {
            overallRiskLevel,
            risks,
            candidateNudges: candidateNudges.sort((a, b) => b.relevanceScore - a.relevanceScore),
            assessedAt: new Date(),
        };

        console.log(`[RiskAssessmentTool] Found ${risks.length} risks, ${candidateNudges.length} candidates`);
        return assessment;
    }

    /**
     * Compute overall risk level from individual risks
     */
    _computeOverallRisk(risks) {
        if (risks.some(r => r.severity === 'critical')) return 'critical';
        if (risks.filter(r => r.severity === 'medium').length >= 2) return 'high';
        if (risks.some(r => r.severity === 'medium')) return 'medium';
        if (risks.some(r => r.severity === 'positive')) return 'positive';
        return 'low';
    }

    /**
     * Get risk areas for a specific nudge type
     * Useful for explaining WHY a nudge was sent
     */
    getRelevantRisks(assessment, nudgeType) {
        const riskMap = {
            'missing_log': ['engagement'],
            'declining_score': ['health_trend'],
            'improving_score': ['celebration'],
            'sleep_deficit': ['sleep'],
            'mood_pattern': ['mood'],
            'appointment_reminder': ['appointment'],
            'streak_celebration': ['celebration'],
            'symptom_followup': ['symptoms'],
            'wellness_checkin': ['engagement'],
        };

        const relevantAreas = riskMap[nudgeType] || [];
        return assessment.risks.filter(r => relevantAreas.includes(r.area));
    }
}

module.exports = new RiskAssessmentTool();
