/**
 * Device Controller
 * Handles API endpoints for device management and sync
 */

const deviceSyncService = require('../../services/deviceSync.service');
const deviceSyncScheduler = require('../../services/deviceSyncScheduler.service');
const { DEVICE_PROVIDERS } = require('../../models/DeviceConnection');
const logger = require('../../utils/logger');

/**
 * Get available device providers and connection status
 * GET /api/v1/patient/devices/providers
 */
const getProviders = async (req, res) => {
    try {
        const status = deviceSyncService.getProviderStatus();
        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        logger.error('Failed to get providers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get device providers',
        });
    }
};

/**
 * Get patient's connected devices
 * GET /api/v1/patient/devices
 */
const getDevices = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const result = await deviceSyncService.getPatientDevices(patientId);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('Failed to get devices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get connected devices',
        });
    }
};

/**
 * Connect a new device
 * POST /api/v1/patient/devices/connect
 */
const connectDevice = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { provider = DEVICE_PROVIDERS.DEMO, redirectUri } = req.body;

        const result = await deviceSyncService.connectDevice(patientId, provider, { redirectUri });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('Failed to connect device:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to connect device',
        });
    }
};

/**
 * Handle OAuth callback
 * GET /api/v1/patient/devices/callback/:provider
 */
const handleCallback = async (req, res) => {
    try {
        const { provider } = req.params;
        const { code, state, error: oauthError, error_description } = req.query;

        if (oauthError) {
            logger.error('OAuth error:', oauthError, error_description);
            return res.redirect(`${process.env.PATIENT_PORTAL_URL}/devices?error=${encodeURIComponent(error_description || oauthError)}`);
        }

        const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/patient/devices/oauth-redirect/${provider}`;
        const result = await deviceSyncService.handleOAuthCallback(provider, code, state, redirectUri);

        // Redirect back to patient portal
        res.redirect(`${process.env.PATIENT_PORTAL_URL}/devices?success=true&provider=${provider}`);
    } catch (error) {
        logger.error('OAuth callback failed:', error);
        res.redirect(`${process.env.PATIENT_PORTAL_URL}/devices?error=${encodeURIComponent(error.message)}`);
    }
};

/**
 * Disconnect a device
 * DELETE /api/v1/patient/devices/:deviceId
 */
const disconnectDevice = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { deviceId } = req.params;

        const result = await deviceSyncService.disconnectDevice(patientId, deviceId);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('Failed to disconnect device:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to disconnect device',
        });
    }
};

/**
 * Trigger manual sync for a device
 * POST /api/v1/patient/devices/:deviceId/sync
 */
const triggerSync = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { deviceId } = req.params;

        const result = await deviceSyncService.triggerManualSync(patientId, deviceId);

        res.json({
            success: true,
            message: 'Sync completed successfully',
            data: {
                recordsProcessed: result.recordsProcessed,
                syncedAt: result.data.syncedAt,
                isDemoMode: result.data.isDemoMode,
            },
        });
    } catch (error) {
        logger.error('Failed to trigger sync:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to sync device',
        });
    }
};

/**
 * Get latest synced vitals data
 * GET /api/v1/patient/devices/vitals
 */
const getLatestVitals = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const result = await deviceSyncService.getLatestSyncedData(patientId);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('Failed to get latest vitals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get latest vitals',
        });
    }
};

/**
 * Get sync scheduler status (for debugging/monitoring)
 * GET /api/v1/patient/devices/scheduler/status
 */
const getSchedulerStatus = async (req, res) => {
    try {
        const status = await deviceSyncScheduler.getSchedulerStatus();

        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        logger.error('Failed to get scheduler status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get scheduler status',
        });
    }
};

module.exports = {
    getProviders,
    getDevices,
    connectDevice,
    handleCallback,
    disconnectDevice,
    triggerSync,
    getLatestVitals,
    getSchedulerStatus,
};
