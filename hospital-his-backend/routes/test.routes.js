/**
 * Test Routes - For manual testing of agentic nudge system
 * 
 * WARNING: These routes bypass authentication for testing purposes.
 * Remove or protect in production!
 */

const express = require('express');
const router = express.Router();

// Import agentic tools (note: these export singletons/instances, not classes)
const contextTool = require('../services/agentic/ContextTool');
const riskTool = require('../services/agentic/RiskAssessmentTool');
const selectionTool = require('../services/agentic/NudgeSelectionTool');
const messageTool = require('../services/agentic/MessageGenerationTool');
const trackingTool = require('../services/agentic/OutcomeTrackingTool');
const orchestrator = require('../services/agentic/WellnessAgentOrchestrator');

// Models
const CareNudge = require('../models/CareNudge');
const NudgeEvent = require('../models/NudgeEvent');
const Patient = require('../models/Patient');
const mongoose = require('mongoose');

/**
 * Helper: Resolve patient ObjectId from string ID or ObjectId
 */
async function resolvePatientId(input) {
    // If it's already a valid ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(input) && input.length === 24) {
        return input;
    }
    
    // Otherwise, lookup by patient_id field (e.g., "PAT000062")
    const patient = await Patient.findOne({ patient_id: input }).select('_id');
    if (!patient) {
        throw new Error(`Patient not found: ${input}`);
    }
    return patient._id.toString();
}

/**
 * GET /api/v1/test/health
 * Simple health check for test routes
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Test routes are active',
        timestamp: new Date().toISOString(),
        warning: 'These routes bypass auth - disable in production!'
    });
});

/**
 * GET /api/v1/test/demo-setup
 * Creates a test nudge and returns login credentials for visual demo
 */
router.get('/demo-setup', async (req, res) => {
    try {
        // Find a patient with email (more likely to be a real test patient)
        let patient = await Patient.findOne({ email: { $exists: true, $ne: null } })
            .select('_id patient_id patientId name email dateOfBirth firstName lastName')
            .lean();
        
        if (!patient) {
            // Fallback: just get any patient
            patient = await Patient.findOne({})
                .select('_id patient_id patientId name email dateOfBirth firstName lastName')
                .lean();
        }

        if (!patient) {
            return res.status(404).json({ success: false, error: 'No patients found in database' });
        }

        const patientObjectId = patient._id.toString();
        const patientIdString = patient.patient_id || patient.patientId;

        // Cleanup old nudges for demo purposes so we can generate a fresh one
        await CareNudge.deleteMany({ patient: patientObjectId, status: { $in: ['pending', 'active'] } });

        // Run the nudge agent to create a fresh nudge
        const result = await orchestrator.runNudgeAgent(patientObjectId, { forceRun: true });

        const dob = patient.dateOfBirth 
            ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
            : null;

        res.json({
            success: true,
            message: 'Demo setup complete! Use these credentials to login to Patient Portal:',
            login: {
                patientId: patientIdString,
                dateOfBirth: dob,
                url: 'http://localhost:5174'
            },
            patient: {
                objectId: patientObjectId,
                name: patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
                email: patient.email
            },
            nudgeResult: result
        });

    } catch (error) {
        console.error('[TEST] Demo setup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/test/patients
 * List available patients for testing (includes login credentials)
 */
router.get('/patients', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const patients = await Patient.find({})
            .select('_id patient_id patientId name email dateOfBirth firstName lastName')
            .limit(limit)
            .lean();
        
        res.json({
            success: true,
            count: patients.length,
            patients: patients.map(p => ({
                objectId: p._id,
                patientId: p.patient_id || p.patientId,
                name: p.name || `${p.firstName} ${p.lastName}`,
                email: p.email,
                dateOfBirth: p.dateOfBirth,
                loginHelp: `Login with PatientID: ${p.patient_id || p.patientId} and DOB: ${p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : 'N/A'}`
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/test/nudge-selection
 * Test the NudgeSelectionTool directly
 * 
 * Body: { patientId: string }
 */
router.post('/nudge-selection', async (req, res) => {
    try {
        const { patientId: inputId } = req.body;
        
        if (!inputId) {
            return res.status(400).json({ error: 'patientId is required' });
        }

        // Resolve patientId (supports both ObjectId and PAT000XXX format)
        const patientId = await resolvePatientId(inputId);
        console.log(`[TEST] Running NudgeSelectionTool for patient: ${patientId} (input: ${inputId})`);

        // Step 1: Extract features
        const context = await contextTool.execute(patientId);

        // Step 2: Assess risks and get candidates
        const riskAssessment = await riskTool.execute(context.features, context.raw);

        // Step 3: Score and select nudge
        const selection = await selectionTool.execute(
            context.features,
            riskAssessment.candidateNudges,
            { patientId }
        );

        res.json({
            success: true,
            patientId,
            features: context.features,
            riskLevel: riskAssessment.overallRiskLevel,
            candidates: riskAssessment.candidateNudges,
            selection: selection,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[TEST] NudgeSelectionTool error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * POST /api/v1/test/full-nudge-agent
 * Run the complete orchestrator (end-to-end test)
 * 
 * Body: { patientId: string, dryRun?: boolean }
 */
router.post('/full-nudge-agent', async (req, res) => {
    try {
        const { patientId: inputId, dryRun = false } = req.body;
        
        if (!inputId) {
            return res.status(400).json({ error: 'patientId is required' });
        }

        // Resolve patientId (supports both ObjectId and PAT000XXX format)
        const patientId = await resolvePatientId(inputId);
        console.log(`[TEST] Running full nudge agent for patient: ${patientId} (input: ${inputId}), dryRun: ${dryRun}`);
        
        if (dryRun) {
            // Debug run - doesn't save to DB
            const result = await orchestrator.debugRun(patientId);
            return res.json({
                success: true,
                mode: 'dryRun',
                result,
                timestamp: new Date().toISOString()
            });
        }

        // Full run - saves nudge to DB
        const result = await orchestrator.runNudgeAgent(patientId);

        res.json({
            success: true,
            mode: 'live',
            result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[TEST] Full nudge agent error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /api/v1/test/latest-nudge/:patientId
 * Get the most recent nudge for a patient (for UI testing)
 */
router.get('/latest-nudge/:patientId', async (req, res) => {
    try {
        const resolvedId = await resolvePatientId(req.params.patientId);

        const latestNudge = await CareNudge.findOne({ 
            patient: resolvedId,
            status: { $in: ['active', 'pending'] }
        })
        .sort({ createdAt: -1 })
        .lean();

        if (!latestNudge) {
            return res.json({
                success: true,
                nudge: null,
                message: 'No pending nudges found'
            });
        }

        res.json({
            success: true,
            nudge: latestNudge
        });

    } catch (error) {
        console.error('[TEST] Latest nudge error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/test/nudge-events/:patientId
 * Get recent NudgeEvents for ML training data inspection
 */
router.get('/nudge-events/:patientId', async (req, res) => {
    try {
        const resolvedId = await resolvePatientId(req.params.patientId);
        const limit = parseInt(req.query.limit) || 10;

        const events = await NudgeEvent.find({ patient: resolvedId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.json({
            success: true,
            count: events.length,
            events
        });

    } catch (error) {
        console.error('[TEST] NudgeEvents error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/v1/test/simulate-action
 * Simulate a user action on a nudge (for testing feedback loop)
 * 
 * Body: { nudgeId: string, action: 'clicked'|'dismissed'|'snoozed' }
 */
router.post('/simulate-action', async (req, res) => {
    try {
        const { nudgeId, action } = req.body;

        if (!nudgeId || !action) {
            return res.status(400).json({ error: 'nudgeId and action are required' });
        }

        const result = await trackingTool.recordAction(nudgeId, action);

        res.json({
            success: true,
            action,
            result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[TEST] Simulate action error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/test/ml-metrics
 * Get learning metrics from OutcomeTrackingTool
 */
router.get('/ml-metrics', async (req, res) => {
    try {
        const metrics = await trackingTool.getLearningMetrics();

        res.json({
            success: true,
            metrics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[TEST] ML metrics error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
