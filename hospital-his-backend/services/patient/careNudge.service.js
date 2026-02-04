/**
 * Care Nudge Logic Service
 * Generates personalized nudges based on patient signals and health score
 */
const CareNudge = require('../../models/CareNudge');
const { Signal } = require('../../models/Signal');
const HealthScore = require('../../models/HealthScore');

const careNudgeService = {
    /**
     * Generate nudges for a patient based on recent activity
     * @param {string} patientId 
     */
    generateNudges: async (patientId) => {
        const nudges = [];
        console.log(`[CareNudge] Generating for patient: ${patientId}`);


        // 1. Check for Missing Logs (Engagement Nudge)
        const lastSignal = await Signal.findOne({ patient: patientId }).sort({ recordedAt: -1 });
        const hoursSinceLastLog = lastSignal ? (new Date() - lastSignal.recordedAt) / (1000 * 60 * 60) : 999;

        if (hoursSinceLastLog > 24) {
            nudges.push({
                title: 'Time to Check In',
                message: 'You haven\'t logged your health stats in a while. How are you feeling today?',
                priority: 'medium',
                type: 'reminder',
                generatedTrigger: 'missing_log',
                actionLink: '/log-symptom'
            });
        }

        // 2. Hydration Check (Lifestyle Nudge)
        // Find today's water intake
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hydrationLog = await Signal.findOne({
            patient: patientId,
            type: 'lifestyle',
            category: 'hydration',
            recordedAt: { $gte: today }
        });

        if (!hydrationLog) {
            nudges.push({
                title: 'Stay Hydrated',
                message: 'You haven\'t logged water intake today. Try to drink at least 8 glasses.',
                priority: 'low',
                type: 'suggestion',
                generatedTrigger: 'low_hydration',
                actionLink: '/log-lifestyle'
            });
        }

        // 3. Declining Score Alert (Critical Nudge)
        const latestScore = await HealthScore.findOne({ patient: patientId }).sort({ calculatedAt: -1 });
        console.log(`[CareNudge] Latest score: ${latestScore?.score}, Trend: ${latestScore?.trend?.direction}`);

        // Alert if declining OR simply if score is critical (< 40)
        if (latestScore && (latestScore.trend?.direction === 'declining' || latestScore.score < 40)) {
            console.log(`[CareNudge] Triggering critical alert`);
            nudges.push({
                title: 'Health Trend Alert',
                message: 'Your health score is trending down. Please review your recent symptoms or contact a doctor.',
                priority: 'high',
                type: 'alert',
                generatedTrigger: 'declining_score',
                actionLink: '/health-details'
            });
        }

        // Save Nudges (Avoiding duplicates for same day/trigger)
        for (const nudgeData of nudges) {
            // Check if active nudge with same trigger exists
            const exists = await CareNudge.findOne({
                patient: patientId,
                status: 'active',
                generatedTrigger: nudgeData.generatedTrigger
            });

            if (!exists) {
                await CareNudge.create({
                    patient: patientId,
                    ...nudgeData
                });
            }
        }
    },

    /**
     * Get active nudges for a patient
     */
    getActiveNudges: async (patientId) => {
        // Trigger generation first (lazy generation)
        await careNudgeService.generateNudges(patientId);

        return await CareNudge.find({
            patient: patientId,
            status: 'active'
        }).sort({ priority: -1, createdAt: -1 }); // High priority first
    },

    /**
     * Respond to a nudge (mark done/dismissed)
     */
    respondToNudge: async (nudgeId, status) => {
        return await CareNudge.findByIdAndUpdate(
            nudgeId,
            {
                status: status,
                respondedAt: new Date()
            },
            { new: true }
        );
    }
};

module.exports = careNudgeService;
