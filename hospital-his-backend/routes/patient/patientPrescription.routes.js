const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    getPrescriptions,
    getPrescriptionById,
    getPrescriptionHistory,
    requestRefill
} = require('../../controllers/patient/patientPrescription.controller');

// All routes require patient authentication
router.use(authenticatePatient);

/**
 * @route   GET /api/v1/patient/prescriptions
 * @desc    Get patient's active prescriptions
 */
router.get('/', getPrescriptions);

/**
 * @route   GET /api/v1/patient/prescriptions/history
 * @desc    Get patient's prescription history (all prescriptions)
 */
router.get('/history', getPrescriptionHistory);

/**
 * @route   GET /api/v1/patient/prescriptions/:id
 * @desc    Get single prescription details
 */
router.get('/:id', getPrescriptionById);

/**
 * @route   POST /api/v1/patient/prescriptions/:id/refill
 * @desc    Request a prescription refill
 */
router.post('/:id/refill', requestRefill);

module.exports = router;
