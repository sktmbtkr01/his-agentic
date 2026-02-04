/**
 * Voice Agent Service for Patient Portal
 * Communicates with the Voice Agent backend for voice-based appointment booking
 */

import axios from 'axios';

const VOICE_AGENT_URL = import.meta.env.VITE_VOICE_URL || 'http://localhost:5003';

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('patientAccessToken');
};

const getConfig = () => {
    const token = getAuthToken();
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'X-Patient-Token': token })
        }
    };
};

/**
 * Start a new voice call session for patient portal
 */
const startCall = async () => {
    const token = getAuthToken();
    const patientData = localStorage.getItem('patient');
    let patientId = null;

    if (patientData) {
        const patient = JSON.parse(patientData);
        patientId = patient.id || patient._id;
    }

    const response = await axios.post(
        `${VOICE_AGENT_URL}/voice/call`,
        {
            caller_id: patientId || `portal-${Date.now()}`,
            channel: 'patient_portal',
            patient_token: token,
            patient_id: patientId
        },
        getConfig()
    );
    return response.data;
};

/**
 * Process conversation message
 */
const processMessage = async (sessionId, userInput, context = {}) => {
    const token = getAuthToken();
    console.log("VoiceAgentService: Sending message with token:", token ? "Token present" : "Token missing");
    const response = await axios.post(
        `${VOICE_AGENT_URL}/conversation/process`,
        {
            session_id: sessionId,
            user_input: userInput,
            context: {
                ...context,
                channel: 'patient_portal',
                patient_token: token
            },
            return_audio: false
        },
        getConfig()
    );
    return response.data;
};

/**
 * Transcribe audio (when GCP is configured)
 */
const transcribeAudio = async (sessionId, audioBase64, sampleRate = 16000) => {
    const response = await axios.post(
        `${VOICE_AGENT_URL}/voice/transcribe`,
        {
            session_id: sessionId,
            audio_base64: audioBase64,
            sample_rate: sampleRate
        },
        getConfig()
    );
    return response.data;
};

/**
 * End voice session
 */
const endCall = async (sessionId) => {
    const response = await axios.delete(
        `${VOICE_AGENT_URL}/session/${sessionId}`,
        getConfig()
    );
    return response.data;
};

/**
 * Check health status
 */
const checkHealth = async () => {
    try {
        const response = await axios.get(`${VOICE_AGENT_URL}/health`);
        return response.data;
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
};

const voiceAgentService = {
    startCall,
    processMessage,
    transcribeAudio,
    endCall,
    checkHealth
};

export default voiceAgentService;
