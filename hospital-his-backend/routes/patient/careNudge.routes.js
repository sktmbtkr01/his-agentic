const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const { getNudges, respondToNudge } = require('../../controllers/patient/careNudge.controller');

router.use(authenticatePatient);

router.get('/', getNudges);
router.put('/:id/respond', respondToNudge);

module.exports = router;
