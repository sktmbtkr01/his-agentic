import api from './api';

const SIGNALS_BASE = '/patient/signals';

/**
 * Health Signals API Service
 */
export const signalsService = {
    /**
     * Get signal options (symptoms list, mood types, etc.)
     */
    getOptions: async () => {
        const response = await api.get(`${SIGNALS_BASE}/options`);
        return response.data.data;
    },

    /**
     * Log a new signal
     */
    logSignal: async (signalData) => {
        const response = await api.post(SIGNALS_BASE, signalData);
        return response.data;
    },

    /**
     * Get patient's signals with pagination
     */
    getSignals: async (params = {}) => {
        const response = await api.get(SIGNALS_BASE, { params });
        return response.data;
    },

    /**
     * Get signal by ID
     */
    getSignalById: async (id) => {
        const response = await api.get(`${SIGNALS_BASE}/${id}`);
        return response.data.data;
    },

    /**
     * Delete a signal
     */
    deleteSignal: async (id) => {
        const response = await api.delete(`${SIGNALS_BASE}/${id}`);
        return response.data;
    },

    /**
     * Get signal summary for dashboard
     */
    getSummary: async (days = 7) => {
        const response = await api.get(`${SIGNALS_BASE}/summary`, { params: { days } });
        return response.data.data;
    },

    /**
     * Batch log multiple signals
     */
    batchLog: async (signals) => {
        const response = await api.post(`${SIGNALS_BASE}/batch`, { signals });
        return response.data;
    },
};

export default signalsService;
