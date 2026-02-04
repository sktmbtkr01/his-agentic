import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return { headers: { Authorization: `Bearer ${user?.token}` } };
};

const sentinelService = {
    /**
     * Get Sentinel Report for a specific patient
     * Includes: Health Score, Trend, Component Breakdown, Recent Activity
     */
    getPatientReport: async (patientId) => {
        const response = await axios.get(
            `${API_URL}/doctor/sentinel/patient/${patientId}`,
            getAuthHeader()
        );
        return response.data;
    },

    /**
     * Get list of patients with declining scores
     */
    getAtRiskPatients: async () => {
        const response = await axios.get(
            `${API_URL}/doctor/sentinel/alerts`,
            getAuthHeader()
        );
        return response.data;
    }
};

export default sentinelService;
