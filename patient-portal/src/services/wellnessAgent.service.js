/**
 * Wellness Agent Service
 * API client for Wellness Agent chat functionality
 */

import api from './api';

const WELLNESS_BASE = '/patient/wellness';

/**
 * Wellness Agent API Service
 */
const wellnessAgentService = {
    /**
     * Start a new conversation with the Wellness Agent
     * @returns {Promise<{conversationId: string, greeting: string, context: object}>}
     */
    startConversation: async () => {
        const response = await api.post(`${WELLNESS_BASE}/start`);
        return response.data.data;
    },

    /**
     * Send a message to the Wellness Agent
     * @param {string} message - User's message
     * @param {string} conversationId - Optional conversation ID for continuity
     * @returns {Promise<{response: string, conversationId: string, sentiment: string, suggestedActions: array}>}
     */
    sendMessage: async (message, conversationId = null) => {
        const response = await api.post(`${WELLNESS_BASE}/chat`, {
            message,
            conversationId,
        });
        return response.data.data;
    },

    /**
     * Get conversation history
     * @param {string} conversationId 
     * @returns {Promise<{conversationId: string, messages: array, status: string}>}
     */
    getConversation: async (conversationId) => {
        const response = await api.get(`${WELLNESS_BASE}/conversation/${conversationId}`);
        return response.data.data;
    },

    /**
     * Get patient context (for debugging)
     * @returns {Promise<object>}
     */
    getContext: async () => {
        const response = await api.get(`${WELLNESS_BASE}/context`);
        return response.data.data;
    },
};

export default wellnessAgentService;
