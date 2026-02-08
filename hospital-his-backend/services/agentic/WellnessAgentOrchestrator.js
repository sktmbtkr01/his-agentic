/**
 * WellnessAgentOrchestrator - The Agent's "Brain"
 * 
 * PURPOSE: Coordinate all tools to run the agentic nudge flow.
 * This is the main entry point for the system.
 * 
 * FLOW:
 * ┌────────────────────────────────────────────────────────────────┐
 * │                                                                │
 * │   1. OBSERVE    →  ContextTool extracts patient data          │
 * │                                                                │
 * │   2. ASSESS     →  RiskAssessmentTool identifies concerns     │
 * │                                                                │
 * │   3. SELECT     →  NudgeSelectionTool (ML) picks best nudge   │
 * │                                                                │
 * │   4. GENERATE   →  MessageGenerationTool (LLM) writes message │
 * │                                                                │
 * │   5. SEND       →  Create CareNudge in database               │
 * │                                                                │
 * │   6. TRACK      →  OutcomeTrackingTool logs for learning      │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 * 
 * The orchestrator is the "brain" that decides IF and WHEN to nudge,
 * while the tools are specialists that handle specific tasks.
 */

const ContextTool = require('./ContextTool');
const RiskAssessmentTool = require('./RiskAssessmentTool');
const NudgeSelectionTool = require('./NudgeSelectionTool');
const MessageGenerationTool = require('./MessageGenerationTool');
const OutcomeTrackingTool = require('./OutcomeTrackingTool');
const CareNudge = require('../../models/CareNudge');

// Configuration
const FEATURE_FLAG = process.env.WELLNESS_AGENT_NUDGE_V2 === 'true';
const MIN_HOURS_BETWEEN_NUDGES = parseInt(process.env.MIN_HOURS_BETWEEN_NUDGES || '4');
const MAX_NUDGES_PER_DAY = parseInt(process.env.MAX_NUDGES_PER_DAY || '3');

class WellnessAgentOrchestrator {
    constructor() {
        this.name = 'WellnessAgentOrchestrator';
        this.version = 'v2_agentic';
        this.enabled = FEATURE_FLAG;
        
        // Tool references
        this.contextTool = ContextTool;
        this.riskTool = RiskAssessmentTool;
        this.selectionTool = NudgeSelectionTool;
        this.messageTool = MessageGenerationTool;
        this.trackingTool = OutcomeTrackingTool;
    }

    /**
     * Run the full nudge agent for a patient
     * 
     * @param {string} patientId - MongoDB ObjectId
     * @param {Object} options - { forceRun: boolean, forceExplore: boolean }
     * @returns {Object} Result with nudge or reason for skip
     */
    async runNudgeAgent(patientId, options = {}) {
        console.log(`\n========== WELLNESS AGENT V2 ==========`);
        console.log(`[Orchestrator] Running for patient: ${patientId}`);
        console.log(`[Orchestrator] Options:`, options);

        // Check feature flag (unless forcing)
        if (!this.enabled && !options.forceRun) {
            console.log(`[Orchestrator] Feature flag disabled, skipping`);
            return { success: false, reason: 'feature_disabled' };
        }

        try {
            // ===== STEP 1: OBSERVE =====
            console.log(`\n----- Step 1: OBSERVE -----`);
            const context = await this.contextTool.execute(patientId);
            console.log(`[Orchestrator] Features extracted`);

            // ===== RATE LIMITING CHECK =====
            const canNudge = await this._checkRateLimits(patientId, context.features);
            if (!canNudge.allowed) {
                console.log(`[Orchestrator] Rate limited: ${canNudge.reason}`);
                return { success: false, reason: canNudge.reason };
            }

            // ===== STEP 2: ASSESS =====
            console.log(`\n----- Step 2: ASSESS -----`);
            const assessment = this.riskTool.execute(context.features);
            console.log(`[Orchestrator] Overall risk: ${assessment.overallRiskLevel}`);
            console.log(`[Orchestrator] Candidates: ${assessment.candidateNudges.map(c => c.type).join(', ')}`);

            // No candidates? No nudge needed.
            if (assessment.candidateNudges.length === 0) {
                console.log(`[Orchestrator] No candidates, patient is doing well`);
                return { success: false, reason: 'no_nudge_needed' };
            }

            // ===== STEP 3: SELECT (ML) =====
            console.log(`\n----- Step 3: SELECT -----`);
            const selection = await this.selectionTool.execute(
                context.features,
                assessment.candidateNudges,
                { forceExplore: options.forceExplore }
            );

            if (!selection) {
                console.log(`[Orchestrator] Selection failed`);
                return { success: false, reason: 'selection_failed' };
            }

            console.log(`[Orchestrator] Selected: ${selection.selectedNudge.type} (P=${selection.selectedNudge.probability.toFixed(3)})`);

            // Check for duplicate (same type still active)
            const isDuplicate = await this._checkDuplicate(patientId, selection.selectedNudge.type);
            if (isDuplicate) {
                console.log(`[Orchestrator] Duplicate nudge, skipping`);
                return { success: false, reason: 'duplicate_nudge' };
            }

            // ===== STEP 4: GENERATE =====
            console.log(`\n----- Step 4: GENERATE -----`);
            const relevantRisks = this.riskTool.getRelevantRisks(assessment, selection.selectedNudge.type);
            const message = await this.messageTool.execute(
                context,
                context.features,
                selection.selectedNudge,
                relevantRisks
            );

            // Validate message quality
            const validation = this.messageTool.validateMessage(message);
            if (!validation.isValid) {
                console.warn(`[Orchestrator] Message validation issues:`, validation.issues);
            }

            // ===== STEP 5: SEND (Create CareNudge) =====
            console.log(`\n----- Step 5: SEND -----`);
            const nudge = await CareNudge.create({
                patient: patientId,
                title: message.title,
                message: message.message,
                reasoning: message.reasoning,
                priority: selection.selectedNudge.priority || 'medium',
                type: this._mapNudgeTypeToCategory(selection.selectedNudge.type),
                status: 'active',
                generatedTrigger: selection.selectedNudge.type,
                generationSource: message.generationSource === 'llm_generated' ? 'llm_generated' : 'rule_based',
                actionLink: message.actionLink,
                actionLabel: message.actionLabel,
                meta: {
                    modelVersion: selection.modelVersion || 'v1.0-rules',
                    selectionMode: selection.selectionMode || 'rules',
                    confidenceScore: selection.selectedNudge.probability,
                },
                contextSnapshot: {
                    healthScore: context.features.healthScore,
                    healthTrend: context.features.healthScoreTrend,
                    recentSymptoms: context.raw.recentSymptoms?.slice(0, 3).map(s => s.symptom?.type),
                    recentMoods: context.raw.recentMoods?.slice(0, 3).map(m => m.mood?.type),
                    daysSinceLastLog: context.features.daysSinceLastLog,
                },
            });

            console.log(`[Orchestrator] Nudge created: ${nudge._id}`);

            // ===== STEP 6: TRACK =====
            console.log(`\n----- Step 6: TRACK -----`);
            const event = await this.trackingTool.recordNudgeSent(
                patientId,
                context.features,
                selection,
                nudge._id
            );

            console.log(`[Orchestrator] Event logged: ${event._id}`);
            console.log(`========== AGENT COMPLETE ==========\n`);

            return {
                success: true,
                nudge: {
                    id: nudge._id,
                    type: selection.selectedNudge.type,
                    title: message.title,
                    message: message.message,
                    probability: selection.selectedNudge.probability,
                },
                event: {
                    id: event._id,
                    selectionMode: selection.selectionMode,
                    modelVersion: selection.modelVersion,
                },
                assessment: {
                    overallRisk: assessment.overallRiskLevel,
                    risks: assessment.risks.length,
                },
            };

        } catch (error) {
            console.error(`[Orchestrator] Error:`, error);
            return { success: false, reason: 'error', error: error.message };
        }
    }

    /**
     * Check rate limits to avoid nudge fatigue
     */
    async _checkRateLimits(patientId, features) {
        // Check time since last nudge
        const lastNudge = await CareNudge.findOne({ patient: patientId })
            .sort({ createdAt: -1 });

        if (lastNudge) {
            const hoursSinceLast = (Date.now() - lastNudge.createdAt) / (1000 * 60 * 60);
            if (hoursSinceLast < MIN_HOURS_BETWEEN_NUDGES) {
                return {
                    allowed: false,
                    reason: `too_soon (${hoursSinceLast.toFixed(1)}h < ${MIN_HOURS_BETWEEN_NUDGES}h)`,
                };
            }
        }

        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nudgesToday = await CareNudge.countDocuments({
            patient: patientId,
            createdAt: { $gte: today },
        });

        if (nudgesToday >= MAX_NUDGES_PER_DAY) {
            return {
                allowed: false,
                reason: `daily_limit (${nudgesToday} >= ${MAX_NUDGES_PER_DAY})`,
            };
        }

        return { allowed: true };
    }

    /**
     * Check if a similar nudge is already active
     */
    async _checkDuplicate(patientId, nudgeType) {
        const existing = await CareNudge.findOne({
            patient: patientId,
            generatedTrigger: nudgeType,
            status: { $in: ['pending', 'active'] },
        });

        return !!existing;
    }

    /**
     * Map specific nudge type to general category
     */
    _mapNudgeTypeToCategory(nudgeType) {
        const categoryMap = {
            'missing_log': 'reminder',
            'declining_score': 'alert',
            'improving_score': 'celebration',
            'sleep_deficit': 'suggestion',
            'mood_pattern': 'insight',
            'streak_celebration': 'celebration',
            'appointment_reminder': 'reminder',
            'symptom_followup': 'reminder',
            'wellness_checkin': 'suggestion',
        };
        return categoryMap[nudgeType] || 'suggestion';
    }

    /**
     * Get system health metrics
     */
    async getSystemMetrics() {
        return {
            orchestrator: {
                version: this.version,
                enabled: this.enabled,
            },
            learning: await this.trackingTool.getLearningMetrics(),
            config: {
                minHoursBetweenNudges: MIN_HOURS_BETWEEN_NUDGES,
                maxNudgesPerDay: MAX_NUDGES_PER_DAY,
                explorationRate: process.env.NUDGE_EXPLORATION_RATE || '0.1',
            },
        };
    }

    /**
     * Manual trigger for testing/admin
     */
    async debugRun(patientId) {
        return await this.runNudgeAgent(patientId, { forceRun: true, forceExplore: false });
    }
}

// Export singleton
module.exports = new WellnessAgentOrchestrator();
