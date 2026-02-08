/**
 * Predictive Intelligence Routes
 * Phase 4: Routes for trend analysis and proactive alerts
 */

const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
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
} = require('../../controllers/patient/predictive.controller');

// All routes require patient authentication
router.use(authenticatePatient);

// Analysis endpoints
router.post('/analyze', runAnalysis);           // Run full analysis
router.get('/summary', getSummary);             // Get dashboard summary

// Alert endpoints
router.get('/alerts', getActiveAlerts);                        // Get active alerts
router.get('/alerts/history', getAlertHistory);                // Get alert history
router.get('/alert-types', getAlertTypes);                     // Get available types/severities
router.put('/alerts/:alertId/acknowledge', acknowledgeAlert);  // Acknowledge alert
router.put('/alerts/:alertId/dismiss', dismissAlert);          // Dismiss alert

// Trend endpoints
router.get('/trends/vitals', getVitalTrends);       // Vital sign trends
router.get('/trends/symptoms', getSymptomPatterns); // Symptom patterns
router.get('/trends/mood', getMoodTrends);          // Mood trends
router.get('/trends/score', getHealthScoreTrends);  // Health score trends

module.exports = router;
