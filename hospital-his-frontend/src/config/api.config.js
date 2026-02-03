/**
 * API Configuration
 * Central config for all API URLs - uses environment variables for production
 */

// Backend API URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

// Backend root URL (for static files, uploads, socket.io)
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// OCR Service URL
export const OCR_SERVICE_URL = import.meta.env.VITE_OCR_URL || 'http://localhost:8000';

// Voice Agent URL
export const VOICE_AGENT_URL = import.meta.env.VITE_VOICE_URL || 'http://localhost:5003';

// ML Services URL
export const ML_SERVICE_URL = import.meta.env.VITE_ML_URL || 'http://localhost:5002';

// Socket.io URL (same as backend)
export const SOCKET_URL = BACKEND_URL;

// Helper to get auth header
export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Default axios config
export const getConfig = () => ({
    headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
    }
});

export default {
    API_BASE_URL,
    BACKEND_URL,
    OCR_SERVICE_URL,
    VOICE_AGENT_URL,
    ML_SERVICE_URL,
    SOCKET_URL,
    getAuthHeader,
    getConfig
};
