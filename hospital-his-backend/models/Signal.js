/**
 * Health Signal Model
 * Stores patient-logged health signals (symptoms, mood, lifestyle, vitals)
 */

const mongoose = require('mongoose');

// Signal categories
const SIGNAL_CATEGORIES = {
    SYMPTOM: 'symptom',
    MOOD: 'mood',
    LIFESTYLE: 'lifestyle',
    VITALS: 'vitals',
};

// Symptom severities
const SYMPTOM_SEVERITY = {
    MILD: 'mild',
    MODERATE: 'moderate',
    SEVERE: 'severe',
};

// Mood types
const MOOD_TYPES = {
    GREAT: 'great',
    GOOD: 'good',
    OKAY: 'okay',
    LOW: 'low',
    BAD: 'bad',
};

// Stress levels (1-10)
const STRESS_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Common symptoms list (extensible)
const COMMON_SYMPTOMS = [
    'headache',
    'fatigue',
    'nausea',
    'fever',
    'cough',
    'body_ache',
    'chest_pain',
    'shortness_of_breath',
    'dizziness',
    'stomach_pain',
    'back_pain',
    'joint_pain',
    'sore_throat',
    'runny_nose',
    'loss_of_appetite',
    'insomnia',
    'anxiety',
    'other',
];

// Lifestyle activity types
const ACTIVITY_TYPES = {
    SEDENTARY: 'sedentary',
    LIGHT: 'light',
    MODERATE: 'moderate',
    ACTIVE: 'active',
    VERY_ACTIVE: 'very_active',
};

const signalSchema = new mongoose.Schema(
    {
        // Patient reference
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true,
        },

        // Signal category
        category: {
            type: String,
            enum: Object.values(SIGNAL_CATEGORIES),
            required: [true, 'Signal category is required'],
            index: true,
        },

        // When the signal was experienced (may differ from logged time)
        recordedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        // ===== SYMPTOM-SPECIFIC FIELDS =====
        symptom: {
            type: {
                type: String,
                enum: COMMON_SYMPTOMS,
            },
            severity: {
                type: String,
                enum: Object.values(SYMPTOM_SEVERITY),
            },
            duration: {
                value: Number,
                unit: {
                    type: String,
                    enum: ['minutes', 'hours', 'days'],
                },
            },
            notes: String,
        },

        // ===== MOOD-SPECIFIC FIELDS =====
        mood: {
            type: {
                type: String,
                enum: Object.values(MOOD_TYPES),
            },
            stressLevel: {
                type: Number,
                min: 1,
                max: 10,
            },
            notes: String,
        },

        // ===== LIFESTYLE-SPECIFIC FIELDS =====
        lifestyle: {
            // Sleep tracking
            sleep: {
                duration: Number, // hours
                quality: {
                    type: String,
                    enum: ['poor', 'fair', 'good', 'excellent'],
                },
            },
            // Activity tracking
            activity: {
                type: {
                    type: String,
                    enum: Object.values(ACTIVITY_TYPES),
                },
                duration: Number, // minutes
                description: String,
            },
            // Hydration tracking
            hydration: {
                glasses: Number, // number of glasses (approx 250ml each)
            },
            // Diet tracking (simple)
            meals: {
                count: Number,
                quality: {
                    type: String,
                    enum: ['poor', 'fair', 'good', 'excellent'],
                },
            },
            notes: String,
        },

        // ===== VITALS-SPECIFIC FIELDS =====
        vitals: {
            bloodPressure: {
                systolic: Number,
                diastolic: Number,
            },
            heartRate: Number, // bpm
            temperature: Number, // celsius
            bloodSugar: {
                value: Number,
                type: {
                    type: String,
                    enum: ['fasting', 'random', 'postprandial'],
                },
            },
            weight: Number, // kg
            oxygenSaturation: Number, // percentage
            notes: String,
        },

        // Source of data entry
        source: {
            type: String,
            enum: ['patient_app', 'voice_agent', 'caregiver', 'device_sync'],
            default: 'patient_app',
        },

        // Metadata
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound indexes for efficient queries
signalSchema.index({ patient: 1, category: 1, recordedAt: -1 });
signalSchema.index({ patient: 1, recordedAt: -1 });
signalSchema.index({ patient: 1, createdAt: -1 });

// Virtual for formatted date
signalSchema.virtual('formattedDate').get(function () {
    return this.recordedAt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
});

// Virtual for relative time
signalSchema.virtual('relativeTime').get(function () {
    const now = new Date();
    const diff = now - this.recordedAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return this.formattedDate;
});

// Static method to get signals for a patient within date range
signalSchema.statics.getPatientSignals = async function (patientId, options = {}) {
    const { category, startDate, endDate, limit = 50, page = 1 } = options;

    const query = {
        patient: patientId,
        isActive: true,
    };

    if (category) {
        query.category = category;
    }

    if (startDate || endDate) {
        query.recordedAt = {};
        if (startDate) query.recordedAt.$gte = new Date(startDate);
        if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [signals, total] = await Promise.all([
        this.find(query).sort({ recordedAt: -1 }).skip(skip).limit(limit),
        this.countDocuments(query),
    ]);

    return {
        signals,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
};

// Static method to get signal summary for dashboard
signalSchema.statics.getPatientSignalSummary = async function (patientId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const summary = await this.aggregate([
        {
            $match: {
                patient: new mongoose.Types.ObjectId(patientId),
                isActive: true,
                recordedAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                lastLogged: { $max: '$recordedAt' },
            },
        },
    ]);

    return summary.reduce((acc, item) => {
        acc[item._id] = {
            count: item.count,
            lastLogged: item.lastLogged,
        };
        return acc;
    }, {});
};

// Pre-save validation
signalSchema.pre('save', function (next) {
    // Ensure category-specific data exists
    if (this.category === SIGNAL_CATEGORIES.SYMPTOM && !this.symptom?.type) {
        return next(new Error('Symptom type is required for symptom signals'));
    }
    if (this.category === SIGNAL_CATEGORIES.MOOD && !this.mood?.type) {
        return next(new Error('Mood type is required for mood signals'));
    }
    next();
});

const Signal = mongoose.model('Signal', signalSchema);

module.exports = {
    Signal,
    SIGNAL_CATEGORIES,
    SYMPTOM_SEVERITY,
    MOOD_TYPES,
    ACTIVITY_TYPES,
    COMMON_SYMPTOMS,
};
