/**
 * Health Score Routes
 * Routes for retrieving patient health scores
 */

const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const { getLatestScore, getScoreHistory } = require('../../controllers/patient/healthScore.controller');

// All routes require patient authentication
router.use(authenticatePatient);

router.get('/', getLatestScore);
router.get('/history', getScoreHistory);

module.exports = router;
