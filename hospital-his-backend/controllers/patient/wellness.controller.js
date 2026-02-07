/**
 * Wellness Agent Controller
 * Handles patient chat interactions with the Wellness Agent
 */

const wellnessService = require('../../services/wellness.service');

/**
 * @desc    Start a new wellness conversation
 * @route   POST /api/v1/patient/wellness/start
 * @access  Patient
 */
const startConversation = async (req, res) => {
    try {
        const patientId = req.patient._id;

        const result = await wellnessService.startConversation(patientId);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[Wellness] Start conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start conversation',
            error: error.message,
        });
    }
};

/**
 * @desc    Send a message to the Wellness Agent
 * @route   POST /api/v1/patient/wellness/chat
 * @access  Patient
 */
const chat = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { message, conversationId } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        // Limit message length
        if (message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Message too long. Please keep it under 2000 characters.',
            });
        }

        const result = await wellnessService.processMessage(
            patientId,
            message.trim(),
            conversationId
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[Wellness] Chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process message',
            error: error.message,
        });
    }
};

/**
 * @desc    Get conversation history
 * @route   GET /api/v1/patient/wellness/conversation/:conversationId
 * @access  Patient
 */
const getConversation = async (req, res) => {
    try {
        const patientId = req.patient._id;
        const { conversationId } = req.params;

        const result = await wellnessService.getConversationHistory(patientId, conversationId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            });
        }

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[Wellness] Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation',
            error: error.message,
        });
    }
};

/**
 * @desc    Get patient context (for debugging/testing)
 * @route   GET /api/v1/patient/wellness/context
 * @access  Patient
 */
const getContext = async (req, res) => {
    try {
        const patientId = req.patient._id;

        const context = await wellnessService.getPatientContext(patientId);

        res.status(200).json({
            success: true,
            data: context,
        });
    } catch (error) {
        console.error('[Wellness] Get context error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get context',
            error: error.message,
        });
    }
};

module.exports = {
    startConversation,
    chat,
    getConversation,
    getContext,
};
