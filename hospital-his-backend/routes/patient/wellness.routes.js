/**
 * Wellness Agent Routes
 * Routes for patient interactions with the Wellness AI Agent
 */

const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    startConversation,
    chat,
    getConversation,
    getContext,
} = require('../../controllers/patient/wellness.controller');

// All routes require patient authentication
router.use(authenticatePatient);

// Start a new conversation (returns greeting)
router.post('/start', startConversation);

// Send a chat message
router.post('/chat', chat);

// Get patient context (useful for debugging)
router.get('/context', getContext);

// Get conversation history
router.get('/conversation/:conversationId', getConversation);

module.exports = router;
