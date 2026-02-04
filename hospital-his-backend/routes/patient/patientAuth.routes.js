/**
 * Patient Authentication Routes
 * Routes for patient login, logout, and profile management
 */

const express = require('express');
const router = express.Router();

const {
    login,
    refresh,
    logout,
    getProfile,
    updateProfile,
} = require('../../controllers/patient/patientAuth.controller');

const { authenticatePatient } = require('../../middleware/patientAuth.middleware');

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes (require patient authentication)
router.post('/logout', authenticatePatient, logout);
router.get('/profile', authenticatePatient, getProfile);
router.put('/profile', authenticatePatient, updateProfile);

module.exports = router;
