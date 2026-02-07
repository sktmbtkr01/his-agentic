const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    getNudges,
    respondToNudge,
    trackActionClick,
    trackActionCompleted,
    submitFeedback,
    getEffectivenessAnalytics,
} = require('../../controllers/patient/careNudge.controller');

router.use(authenticatePatient);

// Get active nudges
router.get('/', getNudges);

// Get effectiveness analytics
router.get('/analytics', getEffectivenessAnalytics);

// Respond to a nudge (done/dismissed)
router.put('/:id/respond', respondToNudge);

// Track action button click
router.put('/:id/action-click', trackActionClick);

// Track action completed
router.put('/:id/action-completed', trackActionCompleted);

// Submit feedback (helpful/not helpful)
router.put('/:id/feedback', submitFeedback);

module.exports = router;
