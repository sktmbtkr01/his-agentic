import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('patientAccessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const prescriptionService = {
    /**
     * Get patient's active prescriptions
     */
    getPrescriptions: async () => {
        const response = await axios.get(`${API_URL}/patient/prescriptions`, getAuthHeader());
        return response.data;
    },

    /**
     * Get single prescription details
     */
    getPrescriptionById: async (id) => {
        const response = await axios.get(`${API_URL}/patient/prescriptions/${id}`, getAuthHeader());
        return response.data;
    },

    /**
     * Get prescription history (all prescriptions)
     */
    getPrescriptionHistory: async (page = 1, limit = 20) => {
        const response = await axios.get(`${API_URL}/patient/prescriptions/history`, {
            ...getAuthHeader(),
            params: { page, limit }
        });
        return response.data;
    },

    /**
     * Request a prescription refill
     */
    requestRefill: async (id) => {
        const response = await axios.post(`${API_URL}/patient/prescriptions/${id}/refill`, {}, getAuthHeader());
        return response.data;
    }
};

export default prescriptionService;
