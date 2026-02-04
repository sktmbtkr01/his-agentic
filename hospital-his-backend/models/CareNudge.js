const mongoose = require('mongoose');

const careNudgeSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
    },
    type: {
        type: String,
        enum: ['reminder', 'suggestion', 'observation', 'alert'],
        default: 'suggestion',
    },
    status: {
        type: String,
        enum: ['active', 'done', 'dismissed'],
        default: 'active',
    },
    generatedTrigger: {
        type: String, // e.g., 'low_hydration', 'missing_log', 'declining_score'
        required: false
    },
    actionLink: {
        type: String, // internal route link e.g., '/log-mood'
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    respondedAt: {
        type: Date
    }
});

// Index for efficient querying of active nudges
careNudgeSchema.index({ patient: 1, status: 1 });

const CareNudge = mongoose.model('CareNudge', careNudgeSchema);

module.exports = CareNudge;
