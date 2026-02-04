/**
 * Patient Signals Routes
 * Routes for health signal logging (symptoms, mood, lifestyle, vitals)
 */

const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    logSignal,
    getSignals,
    getSignalById,
    deleteSignal,
    getSignalSummary,
    getSignalOptions,
    batchLogSignals,
} = require('../../controllers/patient/signals.controller');

// All routes require patient authentication
router.use(authenticatePatient);

// Static routes (must be before dynamic :id routes)
router.get('/options', getSignalOptions);
router.get('/summary', getSignalSummary);
router.post('/batch', batchLogSignals);

// CRUD routes
router.route('/')
    .get(getSignals)
    .post(logSignal);

router.route('/:id')
    .get(getSignalById)
    .delete(deleteSignal);

module.exports = router;
