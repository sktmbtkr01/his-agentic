/**
 * Health Score Model
 * Stores daily/weekly computed health scores and trends for patients
 */

const mongoose = require('mongoose');

const healthScoreSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
            index: true,
        },

        // The composite score (0-100)
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        // Trend compared to previous calculation
        trend: {
            direction: {
                type: String,
                enum: ['improving', 'stable', 'declining'],
                default: 'stable',
            },
            percentageChange: {
                type: Number,
                default: 0,
            },
        },

        // Detailed breakdown of the score components
        components: {
            symptomScore: { type: Number, min: 0, max: 100 }, // Based on severity/frequency
            moodScore: { type: Number, min: 0, max: 100 },    // Based on mood type/stress
            lifestyleScore: { type: Number, min: 0, max: 100 }, // Sleep, activity, etc.
            vitalsScore: { type: Number, min: 0, max: 100 }, // BP/HR stability
            complianceScore: { type: Number, min: 0, max: 100 }, // Medication adherence (future)
        },

        // Generated one-line summary for the patient
        summary: {
            type: String,
            required: true,
        },

        // Insights/Recommendations generated
        insights: [{
            type: String,
        }],

        // Computation window (e.g., 'daily', 'weekly')
        period: {
            type: String,
            enum: ['daily', 'weekly'],
            default: 'daily',
        },

        // Method used for calculation
        calculationMethod: {
            type: String,
            enum: ['WEIGHTED_FALLBACK', 'ML_ENHANCED', 'EMR_RISK_ALIGNED'],
            default: 'WEIGHTED_FALLBACK',
        },

        calculatedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index to quickly find the latest score for a patient
healthScoreSchema.index({ patient: 1, calculatedAt: -1 });

const HealthScore = mongoose.model('HealthScore', healthScoreSchema);

module.exports = HealthScore;
