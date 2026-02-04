const mongoose = require('mongoose');
require('./Counter'); // Ensure Counter model is registered

/**
 * Prescription Model
 * Represents medicine prescriptions for patients
 */

const prescriptionSchema = new mongoose.Schema(
    {
        prescriptionNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient is required'],
        },
        visit: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'visitModel',
            required: [true, 'Visit reference is required'],
        },
        visitModel: {
            type: String,
            enum: ['Appointment', 'Admission', 'Emergency'],
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor is required'],
        },
        medicines: [
            {
                medicine: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Medicine',
                    required: true,
                },
                dosage: {
                    type: String,
                    required: [true, 'Dosage is required'],
                    trim: true,
                },
                frequency: {
                    type: String,
                    required: [true, 'Frequency is required'],
                    trim: true,
                },
                duration: {
                    type: String,
                    required: [true, 'Duration is required'],
                    trim: true,
                },
                instructions: {
                    type: String,
                    trim: true,
                },
                quantity: {
                    type: Number,
                    required: [true, 'Quantity is required'],
                    min: [1, 'Quantity must be at least 1'],
                },
                // Safety tracking per medicine
                interactionChecked: {
                    type: Boolean,
                    default: false,
                },
                interactions: [{
                    withMedicine: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Medicine',
                    },
                    withMedicineName: String,
                    severity: {
                        type: String,
                        enum: ['major', 'moderate', 'minor'],
                    },
                    description: String,
                    overrideBy: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                    overrideReason: String,
                    overrideAt: Date,
                }],
                allergyChecked: {
                    type: Boolean,
                    default: false,
                },
                allergyWarnings: [String],
            },
        ],
        specialInstructions: {
            type: String,
            trim: true,
        },
        // Prescription-level safety status
        safetyStatus: {
            allChecksComplete: {
                type: Boolean,
                default: false,
            },
            hasInteractions: {
                type: Boolean,
                default: false,
            },
            hasMajorInteractions: {
                type: Boolean,
                default: false,
            },
            hasAllergyWarnings: {
                type: Boolean,
                default: false,
            },
            checkedAt: Date,
            checkedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            overrideRequired: {
                type: Boolean,
                default: false,
            },
            overrideComplete: {
                type: Boolean,
                default: false,
            },
        },
        isDispensed: {
            type: Boolean,
            default: false,
        },
        dispensedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        dispensedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ visit: 1 });
prescriptionSchema.index({ isDispensed: 1 });
prescriptionSchema.index({ createdAt: -1 });

// Auto-generate prescriptionNumber before saving
prescriptionSchema.pre('save', async function (next) {
    if (this.isNew && !this.prescriptionNumber) {
        try {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const counterId = `prescription_${dateStr}`;
            const Counter = mongoose.model('Counter');

            // Atomic increment to ensure uniqueness
            // Try to find and increment
            let counter = await Counter.findByIdAndUpdate(
                counterId,
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            // If we just created it (seq==1), we might want to check for existing documents 
            // if we are recovering from a system without counters.
            // But strict sequentiality isn't as critical as uniqueness. 
            // If the counter reset (e.g. redis/memcache lost, but this is mongo), 
            // or if we are starting fresh day, upsert=true handles it.
            // Using a timestamp based ID (dateStr) ensures day-level rotation.

            // To be extra safe against "first of the day" race conditions combined with manual DB edits:
            // Just trust the counter. 

            this.prescriptionNumber = `RX${dateStr}${String(counter.seq).padStart(5, '0')}`;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
