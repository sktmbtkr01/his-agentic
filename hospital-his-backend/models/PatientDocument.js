const mongoose = require('mongoose');

const PatientDocumentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a document title'],
        trim: true
    },
    type: {
        type: String,
        enum: ['prescription', 'lab_report', 'discharge_summary', 'other'],
        default: 'other'
    },
    filePath: {
        type: String, // Relative path on disk/bucket
        required: true
    },
    fileType: {
        type: String, // e.g., 'image/png', 'application/pdf'
        required: true
    },
    ocrData: {
        rawText: { type: String }, // Extracted text
        confidence: { type: Number },
        extractedFields: { // Structured data extracted via LLM/Regex (Optional expansion)
            date: Date,
            doctorName: String,
            keywords: [String]
        }
    },
    ocrConfirmed: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for getting timeline quickly
PatientDocumentSchema.index({ patient: 1, uploadedAt: -1 });

module.exports = mongoose.model('PatientDocument', PatientDocumentSchema);
