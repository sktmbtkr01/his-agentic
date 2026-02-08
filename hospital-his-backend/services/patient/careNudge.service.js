/**
 * Smart Care Nudge Service - Phase 2 + Agentic V2
 * 
 * MODES:
 * - V1 (default): LLM-powered with rule-based triggers
 * - V2 (feature flag): Full agentic orchestration with ML selection
 * 
 * Set WELLNESS_AGENT_NUDGE_V2=true in .env to enable V2
 */
const axios = require('axios');
const CareNudge = require('../../models/CareNudge');
const { Signal, SIGNAL_CATEGORIES } = require('../../models/Signal');
const HealthScore = require('../../models/HealthScore');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');

// Feature flag for V2 agentic system
const USE_V2_AGENTIC = process.env.WELLNESS_AGENT_NUDGE_V2 === 'true';

// Lazy load V2 to avoid circular dependencies
let V2Orchestrator = null;
const getV2Orchestrator = () => {
    if (!V2Orchestrator) {
        V2Orchestrator = require('../agentic/WellnessAgentOrchestrator');
    }
    return V2Orchestrator;
};

// Gemini Configuration (same as wellness service)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Build patient context for nudge generation
 */
const buildNudgeContext = async (patientId) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [patient, latestScore, recentSignals, lastSignal, upcomingAppointments] = await Promise.all([
        Patient.findById(patientId).select('firstName lastName dateOfBirth gender'),
        HealthScore.findOne({ patient: patientId }).sort({ calculatedAt: -1 }),
        Signal.find({
            patient: patientId,
            isActive: true,
            recordedAt: { $gte: sevenDaysAgo },
        }).sort({ recordedAt: -1 }).limit(20),
        Signal.findOne({ patient: patientId }).sort({ recordedAt: -1 }),
        Appointment.find({
            patient: patientId,
            scheduledDate: { $gte: new Date(), $lte: tomorrow },
            status: { $regex: /^(scheduled|confirmed)$/i },
        }).populate('doctor', 'name firstName lastName').limit(3),
    ]);

    const hoursSinceLastLog = lastSignal 
        ? (new Date() - lastSignal.recordedAt) / (1000 * 60 * 60) 
        : 999;

    const symptoms = recentSignals.filter(s => s.category === SIGNAL_CATEGORIES.SYMPTOM);
    const moods = recentSignals.filter(s => s.category === SIGNAL_CATEGORIES.MOOD);
    const lifestyle = recentSignals.filter(s => s.category === SIGNAL_CATEGORIES.LIFESTYLE);

    // Calculate sleep average
    const sleepLogs = lifestyle.filter(l => l.lifestyle?.sleep?.duration);
    const avgSleep = sleepLogs.length > 0
        ? sleepLogs.reduce((sum, l) => sum + l.lifestyle.sleep.duration, 0) / sleepLogs.length
        : null;

    // Calculate mood trend
    const moodScores = moods.map(m => {
        const moodMap = { happy: 5, calm: 4, neutral: 3, anxious: 2, sad: 1, stressed: 1 };
        return moodMap[m.mood?.type] || 3;
    });
    const avgMood = moodScores.length > 0
        ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
        : null;

    return {
        patient: {
            firstName: patient?.firstName || 'there',
            age: patient?.dateOfBirth 
                ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                : null,
        },
        healthScore: latestScore?.score || null,
        healthTrend: latestScore?.trend?.direction || 'stable',
        hoursSinceLastLog,
        daysSinceLastLog: Math.floor(hoursSinceLastLog / 24),
        recentSymptoms: symptoms.slice(0, 5).map(s => s.symptom?.type).filter(Boolean),
        recentMoods: moods.slice(0, 5).map(m => m.mood?.type).filter(Boolean),
        avgSleepHours: avgSleep,
        avgMoodScore: avgMood,
        totalLogsThisWeek: recentSignals.length,
        upcomingAppointments: upcomingAppointments.map(apt => ({
            date: apt.scheduledDate,
            doctor: apt.doctor?.name || apt.doctor?.firstName,
        })),
    };
};

/**
 * Generate LLM-powered personalized nudge
 */
const generateLLMNudge = async (context, triggerType) => {
    if (!GOOGLE_API_KEY) {
        console.log('[SmartNudge] No API key, falling back to rule-based');
        return null;
    }

    const systemPrompt = `You are a health nudge generator for a patient wellness app. Generate a short, personalized nudge message.

## Patient Context
Name: ${context.patient.firstName}
Health Score: ${context.healthScore !== null ? `${context.healthScore}/100` : 'Not calculated'}
Score Trend: ${context.healthTrend}
Days Since Last Log: ${context.daysSinceLastLog}
Recent Symptoms: ${context.recentSymptoms.join(', ') || 'None logged'}
Recent Moods: ${context.recentMoods.join(', ') || 'None logged'}
Avg Sleep: ${context.avgSleepHours ? `${context.avgSleepHours.toFixed(1)} hours` : 'Not logged'}
Logs This Week: ${context.totalLogsThisWeek}
${context.upcomingAppointments.length > 0 ? `Upcoming Appointments: ${context.upcomingAppointments.map(a => a.doctor).join(', ')}` : ''}

## Trigger Type: ${triggerType}

## Guidelines
1. Keep the message SHORT (1-2 sentences max)
2. Be warm, encouraging, never preachy
3. Reference specific patient data when relevant
4. Include a clear call-to-action
5. Use occasional emoji (1 max)
6. Never diagnose or give medical advice

## Output Format (JSON only, no markdown)
{
  "title": "Short catchy title (3-5 words)",
  "message": "Personalized nudge message",
  "reasoning": "Brief explanation of why this nudge was generated (for internal tracking)",
  "priority": "low|medium|high",
  "actionLabel": "Button text for CTA"
}`;

    try {
        const response = await axios.post(
            `${GEMINI_BASE_URL}?key=${GOOGLE_API_KEY}`,
            {
                contents: [{
                    role: 'user',
                    parts: [{ text: `Generate a ${triggerType} nudge for this patient.` }],
                }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }],
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300,
                },
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) return null;

        // Parse JSON response (handle potential markdown wrapping)
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        const nudgeData = JSON.parse(jsonStr);

        console.log(`[SmartNudge] LLM generated nudge: ${nudgeData.title}`);
        return nudgeData;

    } catch (error) {
        console.error('[SmartNudge] LLM Error:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Rule-based nudge templates (fallback)
 */
const RULE_BASED_NUDGES = {
    missing_log: {
        title: 'Time to Check In',
        message: "You haven't logged your health stats in a while. How are you feeling today?",
        priority: 'medium',
        actionLabel: 'Log Now',
        actionLink: '/log-symptom',
    },
    low_hydration: {
        title: 'Stay Hydrated',
        message: "You haven't logged water intake today. Try to drink at least 8 glasses.",
        priority: 'low',
        actionLabel: 'Log Water',
        actionLink: '/log-lifestyle',
    },
    declining_score: {
        title: 'Health Trend Alert',
        message: 'Your health score is trending down. Please review your recent symptoms.',
        priority: 'high',
        actionLabel: 'Review',
        actionLink: '/dashboard',
    },
    improving_score: {
        title: 'Great Progress! 🎉',
        message: 'Your health score is improving! Keep up the good work.',
        priority: 'low',
        actionLabel: 'View Score',
        actionLink: '/dashboard',
    },
    sleep_deficit: {
        title: 'Rest Up',
        message: 'Your sleep has been below average this week. Rest is key to recovery.',
        priority: 'medium',
        actionLabel: 'Log Sleep',
        actionLink: '/log-lifestyle',
    },
    mood_pattern: {
        title: 'Mood Check',
        message: "I noticed some stress in your recent logs. Would you like to talk about it?",
        priority: 'medium',
        actionLabel: 'Log Mood',
        actionLink: '/log-mood',
    },
    streak_celebration: {
        title: 'Amazing Streak! 🔥',
        message: "You've been logging consistently. That's fantastic for your health journey!",
        priority: 'low',
        actionLabel: 'Keep Going',
        actionLink: '/dashboard',
    },
    appointment_reminder: {
        title: 'Appointment Tomorrow',
        message: "Don't forget your appointment tomorrow. Any questions to ask your doctor?",
        priority: 'high',
        actionLabel: 'View Details',
        actionLink: '/appointments',
    },
};

/**
 * Determine which nudges to generate based on context
 */
const determineNudgeTriggers = (context) => {
    const triggers = [];

    // Missing log check
    if (context.daysSinceLastLog >= 2) {
        triggers.push('missing_log');
    }

    // Health score checks
    if (context.healthTrend === 'declining' || (context.healthScore && context.healthScore < 40)) {
        triggers.push('declining_score');
    } else if (context.healthTrend === 'improving' && context.healthScore > 70) {
        triggers.push('improving_score');
    }

    // Sleep check
    if (context.avgSleepHours && context.avgSleepHours < 6) {
        triggers.push('sleep_deficit');
    }

    // Mood check (low mood average)
    if (context.avgMoodScore && context.avgMoodScore < 2.5) {
        triggers.push('mood_pattern');
    }

    // Streak celebration (7+ logs this week)
    if (context.totalLogsThisWeek >= 7) {
        triggers.push('streak_celebration');
    }

    // Appointment reminder
    if (context.upcomingAppointments.length > 0) {
        triggers.push('appointment_reminder');
    }

    return triggers;
};

const careNudgeService = {
    /**
     * Generate smart nudges for a patient
     * 
     * V1: Rule-based triggers + LLM message generation
     * V2: Full agentic orchestration with ML selection
     */
    generateNudges: async (patientId, useLLM = true) => {
        // ===== V2 AGENTIC SYSTEM =====
        if (USE_V2_AGENTIC) {
            console.log(`[SmartNudge] Using V2 Agentic System`);
            const orchestrator = getV2Orchestrator();
            const result = await orchestrator.runNudgeAgent(patientId);
            
            if (result.success) {
                // Return the created nudge in array form for compatibility
                const nudge = await CareNudge.findById(result.nudge.id);
                return nudge ? [nudge] : [];
            }
            
            console.log(`[SmartNudge] V2 skipped: ${result.reason}`);
            return [];
        }

        // ===== V1 RULE-BASED SYSTEM =====
        console.log(`[SmartNudge] Using V1 Rule-based System`);
        console.log(`[SmartNudge] Generating for patient: ${patientId}`);

        const context = await buildNudgeContext(patientId);
        const triggers = determineNudgeTriggers(context);

        console.log(`[SmartNudge] Triggers detected: ${triggers.join(', ') || 'none'}`);

        const createdNudges = [];

        for (const trigger of triggers) {
            // Check if active nudge with same trigger exists
            const exists = await CareNudge.findOne({
                patient: patientId,
                status: { $in: ['pending', 'active'] },
                generatedTrigger: trigger,
            });

            if (exists) {
                console.log(`[SmartNudge] Skipping ${trigger} - already exists`);
                continue;
            }

            let nudgeData;
            let generationSource = 'rule_based';

            // Try LLM generation first
            if (useLLM && GOOGLE_API_KEY) {
                nudgeData = await generateLLMNudge(context, trigger);
                if (nudgeData) {
                    generationSource = 'llm_generated';
                }
            }

            // Fallback to rule-based
            if (!nudgeData) {
                nudgeData = RULE_BASED_NUDGES[trigger];
                if (!nudgeData) continue;
            }

            // Create the nudge
            const nudge = await CareNudge.create({
                patient: patientId,
                title: nudgeData.title,
                message: nudgeData.message,
                reasoning: nudgeData.reasoning || null,
                priority: nudgeData.priority || 'low',
                type: trigger.includes('celebration') ? 'celebration' 
                    : trigger.includes('alert') || trigger.includes('declining') ? 'alert'
                    : trigger.includes('reminder') ? 'reminder'
                    : 'suggestion',
                status: 'active',
                generatedTrigger: trigger,
                generationSource: generationSource,
                actionLink: nudgeData.actionLink || RULE_BASED_NUDGES[trigger]?.actionLink,
                actionLabel: nudgeData.actionLabel || 'Take Action',
                contextSnapshot: {
                    healthScore: context.healthScore,
                    healthTrend: context.healthTrend,
                    recentSymptoms: context.recentSymptoms,
                    recentMoods: context.recentMoods,
                    daysSinceLastLog: context.daysSinceLastLog,
                },
            });

            createdNudges.push(nudge);
            console.log(`[SmartNudge] Created ${generationSource} nudge: ${nudge.title}`);
        }

        return createdNudges;
    },

    /**
     * Get active nudges for a patient
     */
    getActiveNudges: async (patientId) => {
        // Generate any new nudges first
        await careNudgeService.generateNudges(patientId);

        // Mark expired nudges
        await CareNudge.updateMany(
            { patient: patientId, status: 'active', expiresAt: { $lt: new Date() } },
            { status: 'expired', 'effectiveness.actionTaken': 'expired' }
        );

        return await CareNudge.find({
            patient: patientId,
            status: 'active',
            scheduledFor: { $lte: new Date() },
        }).sort({ priority: -1, createdAt: -1 });
    },

    /**
     * Mark nudge as viewed (for effectiveness tracking)
     */
    markNudgeViewed: async (nudgeId) => {
        return await CareNudge.findByIdAndUpdate(
            nudgeId,
            { 'effectiveness.viewedAt': new Date() },
            { new: true }
        );
    },

    /**
     * Respond to a nudge with effectiveness tracking
     */
    respondToNudge: async (nudgeId, status, feedback = null) => {
        const nudge = await CareNudge.findById(nudgeId);
        if (!nudge) return null;

        const now = new Date();
        const responseTimeMs = nudge.effectiveness?.viewedAt
            ? now - nudge.effectiveness.viewedAt
            : null;

        const actionTaken = status === 'done' ? 'marked_done' 
            : status === 'dismissed' ? 'dismissed'
            : 'ignored';

        return await CareNudge.findByIdAndUpdate(
            nudgeId,
            {
                status: status,
                respondedAt: now,
                'effectiveness.actionTaken': actionTaken,
                'effectiveness.responseTimeMs': responseTimeMs,
                'effectiveness.feedback': feedback,
            },
            { new: true }
        );
    },

    /**
     * Track when user clicks the action button
     */
    trackActionClick: async (nudgeId) => {
        return await CareNudge.findByIdAndUpdate(
            nudgeId,
            { 'effectiveness.actionTaken': 'clicked_action' },
            { new: true }
        );
    },

    /**
     * Track when user completes the intended action
     */
    trackActionCompleted: async (nudgeId) => {
        return await CareNudge.findByIdAndUpdate(
            nudgeId,
            { 'effectiveness.actionCompleted': true },
            { new: true }
        );
    },

    /**
     * Get nudge effectiveness analytics for a patient
     */
    getEffectivenessStats: async (patientId) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const nudges = await CareNudge.find({
            patient: patientId,
            createdAt: { $gte: thirtyDaysAgo },
            status: { $in: ['done', 'dismissed', 'expired'] },
        });

        const total = nudges.length;
        const acted = nudges.filter(n => n.effectiveness?.actionTaken === 'clicked_action' || n.effectiveness?.actionTaken === 'marked_done').length;
        const dismissed = nudges.filter(n => n.effectiveness?.actionTaken === 'dismissed').length;
        const completed = nudges.filter(n => n.effectiveness?.actionCompleted).length;

        // By type breakdown
        const byTrigger = {};
        nudges.forEach(n => {
            const trigger = n.generatedTrigger || 'unknown';
            if (!byTrigger[trigger]) {
                byTrigger[trigger] = { total: 0, acted: 0, completed: 0 };
            }
            byTrigger[trigger].total++;
            if (n.effectiveness?.actionTaken === 'clicked_action' || n.effectiveness?.actionTaken === 'marked_done') {
                byTrigger[trigger].acted++;
            }
            if (n.effectiveness?.actionCompleted) {
                byTrigger[trigger].completed++;
            }
        });

        return {
            total,
            acted,
            dismissed,
            completed,
            actionRate: total > 0 ? Math.round((acted / total) * 100) : 0,
            completionRate: acted > 0 ? Math.round((completed / acted) * 100) : 0,
            byTrigger,
        };
    },
};

module.exports = careNudgeService;
