/**
 * Doctor Sentinel Routes
 * Routes for doctors to monitor patient health status
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getPatientSentinelReport, getAtRiskPatients } = require('../../controllers/doctor/doctorSentinel.controller');

// All routes require Staff Authentication (Doctor/Admin)
router.use(authenticate);
router.use(authorize('doctor', 'admin', 'head_nurse'));

router.get('/patient/:patientId', getPatientSentinelReport);
router.get('/alerts', getAtRiskPatients);

module.exports = router;
