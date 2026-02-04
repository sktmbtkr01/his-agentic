import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('patientAccessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const analyticsService = {
    /**
     * Get aggregated health trends
     * @param {string} range - '7d', '30d', '3m'
     */
    getHealthTrends: async (range = '30d') => {
        const response = await axios.get(`${API_URL}/patient/analytics/trends`, {
            ...getAuthHeader(),
            params: { range }
        });
        return response.data;
    }
};

export default analyticsService;
