import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('patientAccessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const nudgeService = {
    /**
     * Get active nudges for value
     */
    getActiveNudges: async () => {
        const response = await axios.get(`${API_URL}/patient/nudges`, getAuthHeader());
        return response.data;
    },

    /**
     * Mark a nudge as done or dismissed
     * @param {string} nudgeId 
     * @param {string} status 'done' | 'dismissed'
     */
    respondToNudge: async (nudgeId, status) => {
        const response = await axios.put(
            `${API_URL}/patient/nudges/${nudgeId}/respond`,
            { status },
            getAuthHeader()
        );
        return response.data;
    }
};

export default nudgeService;
