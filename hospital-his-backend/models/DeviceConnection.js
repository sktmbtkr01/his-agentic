/**
 * Device Connection Model
 * Stores OAuth tokens and sync status for wearable devices
 * Supports multiple device types (Fitbit, future: Apple Watch, Garmin, etc.)
 */

const mongoose = require('mongoose');

// Supported device providers
const DEVICE_PROVIDERS = {
    FITBIT: 'fitbit',
    APPLE_HEALTH: 'apple_health',
    GARMIN: 'garmin',
    GOOGLE_FIT: 'google_fit',
    DEMO: 'demo', // Demo mode for testing without real API
};

// Sync status states
const SYNC_STATUS = {
    PENDING: 'pending',
    SYNCING: 'syncing',
    SUCCESS: 'success',
    FAILED: 'failed',
    DISCONNECTED: 'disconnected',
};

// Data types that can be synced
const DATA_TYPES = {
    HEART_RATE: 'heart_rate',
    STEPS: 'steps',
    SLEEP: 'sleep',
    CALORIES: 'calories',
    DISTANCE: 'distance',
    ACTIVE_MINUTES: 'active_minutes',
    BLOOD_OXYGEN: 'blood_oxygen',
    WEIGHT: 'weight',
};

const deviceConnectionSchema = new mongoose.Schema(
    {
        // Patient reference
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient reference is required'],
            index: true,
        },

        // Device provider type
        provider: {
            type: String,
            enum: Object.values(DEVICE_PROVIDERS),
            required: [true, 'Device provider is required'],
        },

        // Device display name (user-friendly)
        displayName: {
            type: String,
            default: function () {
                if (!this.provider) return 'Wearable Device';
                return this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
            },
        },

        // OAuth tokens (encrypted in production)
        tokens: {
            accessToken: {
                type: String,
                select: false, // Don't include in queries by default
            },
            refreshToken: {
                type: String,
                select: false,
            },
            tokenType: {
                type: String,
                default: 'Bearer',
            },
            expiresAt: Date,
            scope: [String], // Permissions granted
        },

        // Provider-specific user ID
        providerUserId: String,

        // Connection status
        isConnected: {
            type: Boolean,
            default: false,
        },

        // Sync configuration
        syncConfig: {
            enabled: {
                type: Boolean,
                default: true,
            },
            intervalHours: {
                type: Number,
                default: 1, // Sync every hour
                min: 1,
                max: 24,
            },
            dataTypes: {
                type: [String],
                enum: Object.values(DATA_TYPES),
                default: [
                    DATA_TYPES.HEART_RATE,
                    DATA_TYPES.STEPS,
                    DATA_TYPES.SLEEP,
                    DATA_TYPES.CALORIES,
                ],
            },
        },

        // Last sync information
        lastSync: {
            status: {
                type: String,
                enum: Object.values(SYNC_STATUS),
                default: SYNC_STATUS.PENDING,
            },
            timestamp: Date,
            recordsProcessed: {
                type: Number,
                default: 0,
            },
            errorMessage: String,
            errorCode: String,
        },

        // Next scheduled sync
        nextSyncAt: Date,

        // Demo mode flag (uses mock data)
        isDemoMode: {
            type: Boolean,
            default: false,
        },

        // Metadata
        connectedAt: Date,
        disconnectedAt: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
deviceConnectionSchema.index({ patient: 1, provider: 1 }, { unique: true });
deviceConnectionSchema.index({ nextSyncAt: 1, 'syncConfig.enabled': 1 });
deviceConnectionSchema.index({ 'lastSync.status': 1 });

// Virtual: Check if token is expired
deviceConnectionSchema.virtual('isTokenExpired').get(function () {
    if (!this.tokens?.expiresAt) return true;
    return new Date() >= this.tokens.expiresAt;
});

// Virtual: Time until next sync
deviceConnectionSchema.virtual('nextSyncIn').get(function () {
    if (!this.nextSyncAt) return null;
    const diff = this.nextSyncAt - new Date();
    if (diff <= 0) return 'Now';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
});

// Pre-save: Calculate next sync time
deviceConnectionSchema.pre('save', function (next) {
    if (this.isModified('lastSync.timestamp') || !this.nextSyncAt) {
        const baseTime = this.lastSync?.timestamp || new Date();
        const intervalMs = (this.syncConfig?.intervalHours || 1) * 60 * 60 * 1000;
        this.nextSyncAt = new Date(baseTime.getTime() + intervalMs);
    }
    next();
});

// Static: Get devices due for sync
deviceConnectionSchema.statics.getDevicesDueForSync = async function () {
    return this.find({
        isConnected: true,
        'syncConfig.enabled': true,
        nextSyncAt: { $lte: new Date() },
    }).populate('patient', 'firstName lastName patientId');
};

// Static: Get patient's connected devices
deviceConnectionSchema.statics.getPatientDevices = async function (patientId) {
    return this.find({
        patient: patientId,
        isConnected: true,
    }).select('-tokens.accessToken -tokens.refreshToken');
};

// Method: Mark sync as started
deviceConnectionSchema.methods.startSync = async function () {
    this.lastSync = {
        status: SYNC_STATUS.SYNCING,
        timestamp: new Date(),
        recordsProcessed: 0,
        errorMessage: null,
        errorCode: null,
    };
    return this.save();
};

// Method: Mark sync as complete
deviceConnectionSchema.methods.completeSync = async function (recordsProcessed = 0) {
    this.lastSync = {
        status: SYNC_STATUS.SUCCESS,
        timestamp: new Date(),
        recordsProcessed,
        errorMessage: null,
        errorCode: null,
    };
    // Calculate next sync time
    const intervalMs = (this.syncConfig?.intervalHours || 1) * 60 * 60 * 1000;
    this.nextSyncAt = new Date(Date.now() + intervalMs);
    return this.save();
};

// Method: Mark sync as failed
deviceConnectionSchema.methods.failSync = async function (errorMessage, errorCode = null) {
    this.lastSync = {
        status: SYNC_STATUS.FAILED,
        timestamp: new Date(),
        recordsProcessed: 0,
        errorMessage,
        errorCode,
    };
    // Still schedule next sync attempt
    const intervalMs = (this.syncConfig?.intervalHours || 1) * 60 * 60 * 1000;
    this.nextSyncAt = new Date(Date.now() + intervalMs);
    return this.save();
};

// Method: Disconnect device
deviceConnectionSchema.methods.disconnect = async function () {
    this.isConnected = false;
    this.disconnectedAt = new Date();
    this.tokens = {};
    this.lastSync.status = SYNC_STATUS.DISCONNECTED;
    return this.save();
};

const DeviceConnection = mongoose.model('DeviceConnection', deviceConnectionSchema);

module.exports = {
    DeviceConnection,
    DEVICE_PROVIDERS,
    SYNC_STATUS,
    DATA_TYPES,
};
