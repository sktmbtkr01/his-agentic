import api from './api';

const recordsService = {
    // Get aggregated timeline
    getTimeline: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return api.get(`/patient/records/timeline?${query}`);
    },

    // Get all patient documents
    getDocuments: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return api.get(`/patient/records/documents?${query}`);
    },

    // Get single document by ID
    getDocument: async (documentId) => {
        return api.get(`/patient/records/documents/${documentId}`);
    },

};

export default recordsService;
