/**
 * Device Routes
 * API routes for device management and sync
 */

const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    getProviders,
    getDevices,
    connectDevice,
    handleCallback,
    disconnectDevice,
    triggerSync,
    getLatestVitals,
    getSchedulerStatus,
} = require('../../controllers/patient/device.controller');

// OAuth callback doesn't require authentication (state contains patient info)
router.get('/callback/:provider', handleCallback);

// All other routes require patient authentication
router.use(authenticatePatient);

// Get available device providers
router.get('/providers', getProviders);

// Get patient's connected devices
router.get('/', getDevices);

// Get latest synced vitals
router.get('/vitals', getLatestVitals);

// Get scheduler status
router.get('/scheduler/status', getSchedulerStatus);

// Connect a new device
router.post('/connect', connectDevice);

// Trigger manual sync
router.post('/:deviceId/sync', triggerSync);

// Disconnect a device
router.delete('/:deviceId', disconnectDevice);

module.exports = router;
