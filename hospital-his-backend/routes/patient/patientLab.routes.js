const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    getLabTests,
    getLabTestById
} = require('../../controllers/patient/patientLab.controller');

// All routes require patient authentication
router.use(authenticatePatient);

/**
 * @route   GET /api/v1/patient/labs
 * @desc    Get patient's lab tests (orders and results)
 */
router.get('/', getLabTests);

/**
 * @route   GET /api/v1/patient/labs/:id
 * @desc    Get single lab test details
 */
router.get('/:id', getLabTestById);

module.exports = router;
