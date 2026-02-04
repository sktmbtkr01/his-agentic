import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('patientAccessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const labService = {
    /**
     * Get patient's lab tests
     * @param {Object} params - Query params (status, page, limit)
     */
    getLabTests: async (params = {}) => {
        const response = await axios.get(`${API_URL}/patient/labs`, {
            ...getAuthHeader(),
            params
        });
        return response.data;
    },

    /**
     * Get single lab test details
     */
    getLabTestById: async (id) => {
        const response = await axios.get(`${API_URL}/patient/labs/${id}`, getAuthHeader());
        return response.data;
    },

    /**
     * Get formatted PDF URL
     */
    getPdfUrl: (relativePath) => {
        if (!relativePath) return null;
        if (relativePath.startsWith('http')) return relativePath;
        // Backend serves uploads at root /uploads, so remove /api/v1 prefix if building manually
        // But the relativePath usually comes as "/uploads/..." from backend or "uploads/..."
        const baseUrl = API_URL.replace('/api/v1', '');
        const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        return `${baseUrl}${cleanPath}`;
    }
};

export default labService;
