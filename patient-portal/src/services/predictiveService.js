/**
 * Predictive Intelligence Service
 * API client for trend analysis and proactive alerts
 */

import api from './api';

const predictiveService = {
    /**
     * Run full predictive analysis
     */
    runAnalysis: async () => {
        const response = await api.post('/patient/predictive/analyze');
        return response.data;
    },

    /**
     * Get analysis summary for dashboard
     */
    getSummary: async () => {
        const response = await api.get('/patient/predictive/summary');
        return response.data;
    },

    /**
     * Get active alerts
     * @param {Object} options - { limit, types, severity }
     */
    getActiveAlerts: async (options = {}) => {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.types) params.append('types', options.types.join(','));
        if (options.severity) params.append('severity', options.severity);

        const response = await api.get(`/patient/predictive/alerts?${params.toString()}`);
        return response.data;
    },

    /**
     * Get alert history
     * @param {Object} options - { limit, page, status }
     */
    getAlertHistory: async (options = {}) => {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);
        if (options.status) params.append('status', options.status);

        const response = await api.get(`/patient/predictive/alerts/history?${params.toString()}`);
        return response.data;
    },

    /**
     * Acknowledge an alert
     * @param {string} alertId - Alert ID
     */
    acknowledgeAlert: async (alertId) => {
        const response = await api.put(`/patient/predictive/alerts/${alertId}/acknowledge`);
        return response.data;
    },

    /**
     * Dismiss an alert with optional feedback
     * @param {string} alertId - Alert ID
     * @param {Object} feedback - { helpful: boolean, comment: string }
     */
    dismissAlert: async (alertId, feedback = null) => {
        const response = await api.put(`/patient/predictive/alerts/${alertId}/dismiss`, feedback);
        return response.data;
    },

    /**
     * Get vital trends
     * @param {number} days - Number of days to analyze
     */
    getVitalTrends: async (days = 7) => {
        const response = await api.get(`/patient/predictive/trends/vitals?days=${days}`);
        return response.data;
    },

    /**
     * Get symptom patterns
     * @param {number} days - Number of days to analyze
     */
    getSymptomPatterns: async (days = 14) => {
        const response = await api.get(`/patient/predictive/trends/symptoms?days=${days}`);
        return response.data;
    },

    /**
     * Get mood trends
     * @param {number} days - Number of days to analyze
     */
    getMoodTrends: async (days = 7) => {
        const response = await api.get(`/patient/predictive/trends/mood?days=${days}`);
        return response.data;
    },

    /**
     * Get health score trends
     * @param {number} days - Number of days to analyze
     */
    getHealthScoreTrends: async (days = 7) => {
        const response = await api.get(`/patient/predictive/trends/score?days=${days}`);
        return response.data;
    },

    /**
     * Get available alert types and severities
     */
    getAlertTypes: async () => {
        const response = await api.get('/patient/predictive/alert-types');
        return response.data;
    },
};

export default predictiveService;
