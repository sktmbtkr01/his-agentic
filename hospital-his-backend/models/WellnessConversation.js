/**
 * Wellness Conversation Model
 * Stores patient conversations with the Wellness Agent
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    metadata: {
        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'concerned', null],
            default: null,
        },
        suggestedActions: [{
            type: {
                type: String,
                enum: ['log_symptom', 'log_mood', 'log_lifestyle', 'view_score', 'book_appointment', 'call_emergency', 'view_appointments', 'view_prescriptions', 'view_lab_results'],
            },
            label: String,
            route: String,
        }],
        isEmergency: {
            type: Boolean,
            default: false,
        },
    },
});

const wellnessConversationSchema = new mongoose.Schema(
    {
        conversationId: {
            type: String,
            required: true,
            unique: true,
            default: () => `wc_${uuidv4()}`,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            index: true,
        },
        messages: [messageSchema],
        context: {
            healthScoreAtStart: Number,
            triggeredBy: {
                type: String,
                enum: ['user_initiated', 'nudge', 'alert', 'proactive'],
                default: 'user_initiated',
            },
        },
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
        lastActivity: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding active conversations
wellnessConversationSchema.index({ patient: 1, status: 1 });

// Auto-complete conversations older than 30 minutes of inactivity
wellnessConversationSchema.statics.completeStaleConversations = async function () {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await this.updateMany(
        { status: 'active', lastActivity: { $lt: thirtyMinutesAgo } },
        { status: 'completed' }
    );
};

// Get or create active conversation for patient
wellnessConversationSchema.statics.getActiveConversation = async function (patientId) {
    // First, complete any stale conversations
    await this.completeStaleConversations();

    // Look for existing active conversation
    let conversation = await this.findOne({
        patient: patientId,
        status: 'active',
    }).sort({ lastActivity: -1 });

    return conversation;
};

const WellnessConversation = mongoose.model('WellnessConversation', wellnessConversationSchema);

module.exports = WellnessConversation;
