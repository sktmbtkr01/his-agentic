const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const { getHealthTrends } = require('../../controllers/patient/analytics.controller');

// All routes require patient authentication
router.use(authenticatePatient);

/**
 * @route   GET /api/v1/patient/analytics/trends
 * @desc    Get aggregated health trends (Vitals, Mood, Sleep)
 */
router.get('/trends', getHealthTrends);

module.exports = router;
