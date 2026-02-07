import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('patientAccessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const nudgeService = {
    /**
     * Get active nudges for the patient
     * Note: This automatically marks nudges as viewed on the backend
     */
    getActiveNudges: async () => {
        const response = await axios.get(`${API_URL}/patient/nudges`, getAuthHeader());
        return response.data;
    },

    /**
     * Mark a nudge as done or dismissed with optional feedback
     * @param {string} nudgeId 
     * @param {string} status 'done' | 'dismissed'
     * @param {string} feedback Optional feedback text
     */
    respondToNudge: async (nudgeId, status, feedback = null) => {
        const response = await axios.put(
            `${API_URL}/patient/nudges/${nudgeId}/respond`,
            { status, feedback },
            getAuthHeader()
        );
        return response.data;
    },

    /**
     * Track when user clicks the action button on a nudge
     * @param {string} nudgeId 
     */
    trackActionClick: async (nudgeId) => {
        const response = await axios.put(
            `${API_URL}/patient/nudges/${nudgeId}/action-click`,
            {},
            getAuthHeader()
        );
        return response.data;
    },

    /**
     * Track when user completes the intended action
     * @param {string} nudgeId 
     */
    trackActionCompleted: async (nudgeId) => {
        const response = await axios.put(
            `${API_URL}/patient/nudges/${nudgeId}/action-completed`,
            {},
            getAuthHeader()
        );
        return response.data;
    },

    /**
     * Submit feedback on a nudge (helpful/not helpful)
     * @param {string} nudgeId 
     * @param {string} feedback 'helpful' | 'not_helpful'
     */
    submitFeedback: async (nudgeId, feedback) => {
        const response = await axios.put(
            `${API_URL}/patient/nudges/${nudgeId}/feedback`,
            { feedback },
            getAuthHeader()
        );
        return response.data;
    },

    /**
     * Get nudge effectiveness analytics
     */
    getAnalytics: async () => {
        const response = await axios.get(`${API_URL}/patient/nudges/analytics`, getAuthHeader());
        return response.data;
    },
};

export default nudgeService;
