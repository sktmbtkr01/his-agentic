/**
 * Predictive Intelligence Controller
 * Phase 4: API endpoints for trend analysis and proactive alerts
 */

const predictiveService = require('../../services/predictive.service');
const { ALERT_SEVERITY, ALERT_TYPES } = require('../../models/HealthAlert');

/**
 * @desc    Run full predictive analysis and generate alerts
 * @route   POST /api/v1/patient/predictive/analyze
 * @access  Patient
 */
const runAnalysis = async (req, res) => {
    try {
        const patientId = req.patient._id;

        const result = await predictiveService.runAnalysis(patientId);

        res.status(200).json({
            success: true,
            message: `Analysis complete. Generated ${result.newAlerts} new alerts.`,
            data: {
                analysis: result.analysis,
                alerts: result.alerts,
                summary: {
                    totalAlerts: result.totalAlerts,
                    newAlerts: result.newAlerts,
                },
            },
        });
    } catch (error) {
        console.error('[Predictive] Analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run predictive analysis',
            error: error.message,
        });
    }
};

/**
 * @desc    Get analysis summary for dashboard
 * @route   GET /api/v1/patient/predictive/summary
 * @access  Patient
 */
const getSummary = async (req, res) => {
    try {
        const patientId = req.patient._id;

        const summary = await predictiveService.getAnalysisSummary(patientId);

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('[Predictive] Get summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get analysis summary',
            error: error.message,
        });
    }
};

/**
 * @desc    Get active alerts for patient
 * @route   GET /api/v1/patient/predictive/alerts
 * @access  Patient
 */
const getActiveAlerts = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { limit = 10, types, severity } = req.query;

        const options = {
            limit: parseInt(limit),
            types: types ? types.split(',') : undefined,
            severity,
        };

        const alerts = await predictiveService.getActiveAlerts(patientId, options);

        res.status(200).json({
            success: true,
            data: {
                alerts,
                count: alerts.length,
            },
        });
    } catch (error) {
        console.error('[Predictive] Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alerts',
            error: error.message,
        });
    }
};

/**
 * @desc    Get alert history
 * @route   GET /api/v1/patient/predictive/alerts/history
 * @access  Patient
 */
const getAlertHistory = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { limit = 20, page = 1, status } = req.query;

        const result = await predictiveService.getAlertHistory(patientId, {
            limit: parseInt(limit),
            page: parseInt(page),
            status,
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[Predictive] Get alert history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alert history',
            error: error.message,
        });
    }
};

/**
 * @desc    Acknowledge an alert
 * @route   PUT /api/v1/patient/predictive/alerts/:alertId/acknowledge
 * @access  Patient
 */
const acknowledgeAlert = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { alertId } = req.params;

        const alert = await predictiveService.acknowledgeAlert(alertId, patientId);

        res.status(200).json({
            success: true,
            message: 'Alert acknowledged',
            data: alert,
        });
    } catch (error) {
        console.error('[Predictive] Acknowledge alert error:', error);
        res.status(error.message === 'Alert not found' ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to acknowledge alert',
        });
    }
};

/**
 * @desc    Dismiss an alert
 * @route   PUT /api/v1/patient/predictive/alerts/:alertId/dismiss
 * @access  Patient
 */
const dismissAlert = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { alertId } = req.params;
        const { helpful, comment } = req.body;

        const feedback = helpful !== undefined ? { helpful, comment } : null;
        const alert = await predictiveService.dismissAlert(alertId, patientId, feedback);

        res.status(200).json({
            success: true,
            message: 'Alert dismissed',
            data: alert,
        });
    } catch (error) {
        console.error('[Predictive] Dismiss alert error:', error);
        res.status(error.message === 'Alert not found' ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to dismiss alert',
        });
    }
};

/**
 * @desc    Get vital trends
 * @route   GET /api/v1/patient/predictive/trends/vitals
 * @access  Patient
 */
const getVitalTrends = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { days = 7 } = req.query;

        const trends = await predictiveService.analyzeVitalTrends(patientId, parseInt(days));

        res.status(200).json({
            success: true,
            data: trends,
        });
    } catch (error) {
        console.error('[Predictive] Get vital trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get vital trends',
            error: error.message,
        });
    }
};

/**
 * @desc    Get symptom patterns
 * @route   GET /api/v1/patient/predictive/trends/symptoms
 * @access  Patient
 */
const getSymptomPatterns = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { days = 14 } = req.query;

        const patterns = await predictiveService.analyzeSymptomPatterns(patientId, parseInt(days));

        res.status(200).json({
            success: true,
            data: patterns,
        });
    } catch (error) {
        console.error('[Predictive] Get symptom patterns error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get symptom patterns',
            error: error.message,
        });
    }
};

/**
 * @desc    Get mood trends
 * @route   GET /api/v1/patient/predictive/trends/mood
 * @access  Patient
 */
const getMoodTrends = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { days = 7 } = req.query;

        const trends = await predictiveService.analyzeMoodTrends(patientId, parseInt(days));

        res.status(200).json({
            success: true,
            data: trends,
        });
    } catch (error) {
        console.error('[Predictive] Get mood trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get mood trends',
            error: error.message,
        });
    }
};

/**
 * @desc    Get health score trends
 * @route   GET /api/v1/patient/predictive/trends/score
 * @access  Patient
 */
const getHealthScoreTrends = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { days = 7 } = req.query;

        const trends = await predictiveService.analyzeHealthScoreTrends(patientId, parseInt(days));

        res.status(200).json({
            success: true,
            data: trends,
        });
    } catch (error) {
        console.error('[Predictive] Get health score trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get health score trends',
            error: error.message,
        });
    }
};

/**
 * @desc    Get available alert types and severities (for filtering)
 * @route   GET /api/v1/patient/predictive/alert-types
 * @access  Patient
 */
const getAlertTypes = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            types: Object.values(ALERT_TYPES),
            severities: Object.values(ALERT_SEVERITY),
        },
    });
};

module.exports = {
    runAnalysis,
    getSummary,
    getActiveAlerts,
    getAlertHistory,
    acknowledgeAlert,
    dismissAlert,
    getVitalTrends,
    getSymptomPatterns,
    getMoodTrends,
    getHealthScoreTrends,
    getAlertTypes,
};
