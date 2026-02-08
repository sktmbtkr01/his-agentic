/**
 * Device Service
 * API client for device management and sync
 */

import api from './api';

const deviceService = {
    /**
     * Get available device providers
     */
    getProviders: async () => {
        const response = await api.get('/patient/devices/providers');
        return response.data;
    },

    /**
     * Get patient's connected devices
     */
    getDevices: async () => {
        const response = await api.get('/patient/devices');
        return response.data;
    },

    /**
     * Get latest synced vitals data
     */
    getLatestVitals: async () => {
        const response = await api.get('/patient/devices/vitals');
        return response.data;
    },

    /**
     * Connect a new device
     * @param {string} provider - Provider type ('demo', 'fitbit', etc.)
     * @param {string} redirectUri - OAuth redirect URI (for real providers)
     */
    connectDevice: async (provider = 'demo', redirectUri = null) => {
        const response = await api.post('/patient/devices/connect', {
            provider,
            redirectUri,
        });
        return response.data;
    },

    /**
     * Disconnect a device
     * @param {string} deviceId - Device ID to disconnect
     */
    disconnectDevice: async (deviceId) => {
        const response = await api.delete(`/patient/devices/${deviceId}`);
        return response.data;
    },

    /**
     * Trigger manual sync for a device
     * @param {string} deviceId - Device ID to sync
     */
    syncDevice: async (deviceId) => {
        const response = await api.post(`/patient/devices/${deviceId}/sync`);
        return response.data;
    },

    /**
     * Get scheduler status
     */
    getSchedulerStatus: async () => {
        const response = await api.get('/patient/devices/scheduler/status');
        return response.data;
    },
};

export default deviceService;
