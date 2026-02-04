import api from './api';

const SCORE_BASE = '/patient/score';

/**
 * Health Score API Service
 */
export const healthScoreService = {
    /**
     * Get the latest health score (calculates if necessary)
     */
    getLatestScore: async () => {
        const response = await api.get(SCORE_BASE);
        return response.data.data;
    },

    /**
     * Get score history for charts
     */
    getHistory: async () => {
        const response = await api.get(`${SCORE_BASE}/history`);
        return response.data;
    },
};

export default healthScoreService;
