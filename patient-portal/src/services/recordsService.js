import api from './api';

const recordsService = {
    // Get aggregated timeline
    getTimeline: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return api.get(`/patient/records/timeline?${query}`);
    },

    // Upload a new document
    uploadDocument: async (formData) => {
        // FormData must contain 'file', 'title', 'type'
        return api.post('/patient/records/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Confirm OCR data
    confirmOCR: async (documentId, data) => {
        return api.put(`/patient/records/ocr/${documentId}/confirm`, data);
    }
};

export default recordsService;
