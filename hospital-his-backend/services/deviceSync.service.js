/**
 * Device Sync Service
 * Orchestrates device connections and data synchronization
 * Integrates with Signal model for health data storage
 */

const { DeviceConnection, DEVICE_PROVIDERS, SYNC_STATUS, DATA_TYPES } = require('../models/DeviceConnection');
const { Signal, SIGNAL_CATEGORIES } = require('../models/Signal');
const fitbitProvider = require('./providers/fitbit.provider');
const googleFitProvider = require('./providers/googleFit.provider');
const logger = require('../utils/logger');

// Provider map for extensibility
const providers = {
    [DEVICE_PROVIDERS.FITBIT]: fitbitProvider,
    [DEVICE_PROVIDERS.GOOGLE_FIT]: googleFitProvider,
    [DEVICE_PROVIDERS.DEMO]: fitbitProvider, // Demo uses same mock data
};

/**
 * Check if any provider is configured with real API
 */
const getProviderStatus = () => {
    return {
        fitbit: {
            configured: fitbitProvider.isFitbitConfigured(),
            name: 'Fitbit',
            icon: 'activity',
        },
        google_fit: {
            configured: googleFitProvider.isGoogleFitConfigured(),
            name: 'Google Fit',
            icon: 'smartphone',
        },
        demo: {
            configured: true,
            name: 'Demo Device',
            icon: 'smartphone',
        },
    };
};

/**
 * Connect a device (demo mode or initiate OAuth)
 */
const connectDevice = async (patientId, provider, options = {}) => {
    // Check if already connected
    const existing = await DeviceConnection.findOne({
        patient: patientId,
        provider,
        isConnected: true,
    });

    if (existing) {
        return {
            success: false,
            message: 'Device already connected',
            device: existing,
        };
    }

    // For demo mode, create connection immediately
    if (provider === DEVICE_PROVIDERS.DEMO) {
        const connection = await DeviceConnection.findOneAndUpdate(
            { patient: patientId, provider: DEVICE_PROVIDERS.DEMO },
            {
                patient: patientId,
                provider: DEVICE_PROVIDERS.DEMO,
                displayName: 'Demo Wearable',
                isConnected: true,
                isDemoMode: true,
                connectedAt: new Date(),
                'syncConfig.enabled': true,
                'syncConfig.intervalHours': 1,
                'syncConfig.dataTypes': [
                    DATA_TYPES.HEART_RATE,
                    DATA_TYPES.STEPS,
                    DATA_TYPES.SLEEP,
                    DATA_TYPES.CALORIES,
                ],
                'lastSync.status': SYNC_STATUS.PENDING,
                nextSyncAt: new Date(), // Sync immediately
            },
            { upsert: true, new: true }
        );

        // Trigger initial sync
        await syncDevice(connection._id);

        return {
            success: true,
            message: 'Demo device connected successfully',
            device: connection,
            isDemoMode: true,
        };
    }

    // For Google Fit
    if (provider === DEVICE_PROVIDERS.GOOGLE_FIT) {
        if (!googleFitProvider.isGoogleFitConfigured()) {
            // Fallback to demo if not configured
            return connectDevice(patientId, DEVICE_PROVIDERS.DEMO, options);
        }

        const redirectUri = options.redirectUri || `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/v1/patient/devices/oauth-redirect/google_fit`;
        const state = Buffer.from(JSON.stringify({ patientId, provider: 'google_fit' })).toString('base64');
        const authUrl = googleFitProvider.getAuthorizationUrl(redirectUri, state);

        return {
            success: true,
            requiresOAuth: true,
            authUrl,
            provider: DEVICE_PROVIDERS.GOOGLE_FIT,
        };
    }

    // For Fitbit
    if (provider === DEVICE_PROVIDERS.FITBIT) {
        if (!fitbitProvider.isFitbitConfigured()) {
            // Fallback to demo if not configured
            return connectDevice(patientId, DEVICE_PROVIDERS.DEMO, options);
        }

        const redirectUri = options.redirectUri || `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/v1/patient/devices/callback/fitbit`;
        const authUrl = fitbitProvider.getAuthorizationUrl(patientId, redirectUri);

        if (!authUrl) {
            return connectDevice(patientId, DEVICE_PROVIDERS.DEMO, options);
        }

        return {
            success: true,
            requiresOAuth: true,
            authUrl,
            provider: DEVICE_PROVIDERS.FITBIT,
        };
    }

    // Unknown provider, use demo
    return connectDevice(patientId, DEVICE_PROVIDERS.DEMO, options);
};

/**
 * Handle OAuth callback
 */
const handleOAuthCallback = async (provider, code, state, redirectUri) => {
    try {
        // Decode state to get patient ID
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const patientId = stateData.patientId;

        if (!patientId) {
            throw new Error('Invalid OAuth state');
        }

        let tokens;
        let providerType;
        let displayName;

        // Exchange code for tokens based on provider
        if (provider === 'google_fit' || provider === DEVICE_PROVIDERS.GOOGLE_FIT) {
            tokens = await googleFitProvider.exchangeCodeForTokens(code, redirectUri);
            providerType = DEVICE_PROVIDERS.GOOGLE_FIT;
            displayName = 'Google Fit';
        } else {
            tokens = await fitbitProvider.exchangeCodeForTokens(code, redirectUri);
            providerType = DEVICE_PROVIDERS.FITBIT;
            displayName = 'Fitbit';
        }

        // Create or update device connection
        const connection = await DeviceConnection.findOneAndUpdate(
            { patient: patientId, provider: providerType },
            {
                patient: patientId,
                provider: providerType,
                displayName,
                isConnected: true,
                isDemoMode: false,
                connectedAt: new Date(),
                providerUserId: tokens.providerUserId,
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresAt: tokens.expiresAt,
                    scope: tokens.scope,
                },
                'syncConfig.enabled': true,
                'syncConfig.intervalHours': 1,
                'lastSync.status': SYNC_STATUS.PENDING,
                nextSyncAt: new Date(),
            },
            { upsert: true, new: true }
        );

        // Trigger initial sync
        await syncDevice(connection._id);

        return {
            success: true,
            message: `${displayName} connected successfully`,
            device: connection,
        };
    } catch (error) {
        logger.error('OAuth callback failed:', error);
        throw error;
    }
};

/**
 * Disconnect a device
 */
const disconnectDevice = async (patientId, deviceId) => {
    const device = await DeviceConnection.findOne({
        _id: deviceId,
        patient: patientId,
    });

    if (!device) {
        throw new Error('Device not found');
    }

    await device.disconnect();

    return {
        success: true,
        message: 'Device disconnected successfully',
    };
};

/**
 * Get patient's connected devices
 */
const getPatientDevices = async (patientId) => {
    const devices = await DeviceConnection.getPatientDevices(patientId);
    const providerStatus = getProviderStatus();

    return {
        devices,
        availableProviders: providerStatus,
        hasDemoMode: !fitbitProvider.isFitbitConfigured(),
    };
};

/**
 * Sync a specific device
 */
const syncDevice = async (deviceId) => {
    const device = await DeviceConnection.findById(deviceId).select('+tokens.accessToken +tokens.refreshToken +tokens.expiresAt');

    if (!device || !device.isConnected) {
        throw new Error('Device not found or not connected');
    }

    try {
        await device.startSync();

        // Get provider
        const provider = providers[device.provider] || providers[DEVICE_PROVIDERS.DEMO];
        let accessToken = device.tokens?.accessToken;
        const refreshToken = device.tokens?.refreshToken;
        const expiresAt = device.tokens?.expiresAt;

        logger.info(`[DeviceSync DEBUG] Starting sync for device ${deviceId}`);
        logger.info(`[DeviceSync DEBUG] Provider: ${device.provider}, isDemoMode: ${device.isDemoMode}`);
        logger.info(`[DeviceSync DEBUG] AccessToken present: ${!!accessToken}`);
        logger.info(`[DeviceSync DEBUG] RefreshToken present: ${!!refreshToken}`);
        logger.info(`[DeviceSync DEBUG] Token expires at: ${expiresAt}`);

        // Check if token is expired, about to expire (5 minute buffer), or expiry is unknown
        const now = new Date();
        const tokenExpired = !expiresAt || new Date(expiresAt) < new Date(now.getTime() + 5 * 60 * 1000);

        logger.info(`[DeviceSync DEBUG] Token expired/unknown: ${tokenExpired}`);

        if (tokenExpired && refreshToken && provider.refreshAccessToken) {
            logger.info(`[DeviceSync DEBUG] Token expired or unknown, attempting refresh...`);
            try {
                const newTokens = await provider.refreshAccessToken(refreshToken);
                accessToken = newTokens.accessToken;

                // Update device with new tokens
                device.tokens.accessToken = newTokens.accessToken;
                device.tokens.expiresAt = newTokens.expiresAt;
                await device.save();

                logger.info(`[DeviceSync DEBUG] Token refreshed successfully! New expiry: ${newTokens.expiresAt}`);
            } catch (refreshError) {
                logger.error(`[DeviceSync DEBUG] Token refresh failed:`, refreshError.message);
                logger.error(`[DeviceSync DEBUG] Full refresh error:`, JSON.stringify(refreshError.response?.data || refreshError));
                // Continue with old token, might still work
            }
        } else if (!refreshToken) {
            logger.warn(`[DeviceSync DEBUG] No refresh token available - user may need to reconnect`);
        }

        // Fetch all data
        const data = await provider.fetchAllData(accessToken);

        logger.info(`[DeviceSync DEBUG] Raw data from provider:`);
        logger.info(JSON.stringify(data, null, 2));

        // Convert to Signal records
        const signals = await convertToSignals(device.patient, data);

        logger.info(`[DeviceSync DEBUG] Converted to ${signals.length} signals`);
        signals.forEach((s, i) => {
            logger.info(`[DeviceSync DEBUG] Signal ${i}: category=${s.category}, data=${JSON.stringify(s)}`);
        });

        // Save signals
        let recordsProcessed = 0;
        for (const signalData of signals) {
            try {
                // Check if signal already exists for this date/category
                const existingSignal = await Signal.findOne({
                    patient: device.patient,
                    category: signalData.category,
                    recordedAt: {
                        $gte: new Date(new Date(signalData.recordedAt).setHours(0, 0, 0, 0)),
                        $lt: new Date(new Date(signalData.recordedAt).setHours(23, 59, 59, 999)),
                    },
                    source: 'device_sync',
                });

                if (existingSignal) {
                    Object.assign(existingSignal, signalData);
                    await existingSignal.save();
                    logger.info(`[DeviceSync DEBUG] Updated existing signal ${existingSignal._id}`);
                } else {
                    const newSignal = await Signal.create(signalData);
                    logger.info(`[DeviceSync DEBUG] Created new signal ${newSignal._id}`);
                }
                recordsProcessed++;
            } catch (err) {
                logger.warn(`Failed to save signal: ${err.message}`);
            }
        }

        await device.completeSync(recordsProcessed);

        logger.info(`Device sync completed for ${device._id}: ${recordsProcessed} records`);

        return {
            success: true,
            recordsProcessed,
            data,
        };
    } catch (error) {
        logger.error(`Device sync failed for ${deviceId}:`, error);
        await device.failSync(error.message);
        throw error;
    }
};

/**
 * Convert provider data to Signal records
 */
const convertToSignals = async (patientId, data) => {
    const signals = [];

    // Handle different date formats from providers
    let recordedAt;
    if (data.date) {
        recordedAt = new Date(data.date + 'T12:00:00');
    } else if (data.syncedAt) {
        recordedAt = new Date(data.syncedAt);
    } else {
        recordedAt = new Date();
    }

    // Determine provider name for notes
    const providerName = data.provider || (data.isDemoMode ? 'Demo Device' : 'Wearable');

    // Vitals signal (heart rate)
    if (data.heartRate) {
        // Use current heart rate first (matches what phone shows), then fall back to others
        const heartRateValue = data.heartRate.current ||
            data.heartRate.currentHeartRate ||
            data.heartRate.restingHeartRate;

        if (heartRateValue) {
            signals.push({
                patient: patientId,
                category: SIGNAL_CATEGORIES.VITALS,
                recordedAt,
                source: 'device_sync',
                vitals: {
                    heartRate: heartRateValue,
                    notes: `Synced from ${providerName}`,
                },
            });
        }
    }

    // Lifestyle signal (activity + sleep)
    if (data.activity || data.sleep) {
        const lifestyleSignal = {
            patient: patientId,
            category: SIGNAL_CATEGORIES.LIFESTYLE,
            recordedAt,
            source: 'device_sync',
            lifestyle: {},
        };

        if (data.activity) {
            // Handle both Fitbit format (direct properties) and Google Fit format (summary object)
            const activityData = data.activity.summary || data.activity;
            const steps = activityData.steps || 0;
            const calories = activityData.caloriesOut || activityData.calories || 0;
            const activeMinutes = activityData.activeMinutes || 0;

            lifestyleSignal.lifestyle.activity = {
                type: getActivityType(activeMinutes),
                duration: activeMinutes,
                description: `${steps} steps, ${calories} cal burned`,
            };
        }

        if (data.sleep) {
            // Handle both Fitbit format and Google Fit format
            const sleepData = data.sleep.summary || data.sleep;
            const sleepMinutes = sleepData.totalMinutesAsleep || sleepData.duration || 0;
            const sleepQuality = data.sleep.quality || 'unknown';

            lifestyleSignal.lifestyle.sleep = {
                duration: sleepMinutes / 60, // Convert to hours
                quality: sleepQuality,
            };
        }

        signals.push(lifestyleSignal);
    }

    return signals;
};

/**
 * Map active minutes to activity type
 */
const getActivityType = (activeMinutes) => {
    if (activeMinutes >= 60) return 'very_active';
    if (activeMinutes >= 30) return 'active';
    if (activeMinutes >= 15) return 'moderate';
    if (activeMinutes >= 5) return 'light';
    return 'sedentary';
};

/**
 * Get latest synced data for a patient
 */
const getLatestSyncedData = async (patientId) => {
    logger.info(`[DeviceSync DEBUG] getLatestSyncedData called for patient ${patientId}`);

    // Get the most recent device sync signals
    const [vitalsSignal, lifestyleSignal] = await Promise.all([
        Signal.findOne({
            patient: patientId,
            category: SIGNAL_CATEGORIES.VITALS,
            source: 'device_sync',
        }).sort({ recordedAt: -1 }),
        Signal.findOne({
            patient: patientId,
            category: SIGNAL_CATEGORIES.LIFESTYLE,
            source: 'device_sync',
        }).sort({ recordedAt: -1 }),
    ]);

    logger.info(`[DeviceSync DEBUG] vitalsSignal: ${JSON.stringify(vitalsSignal)}`);
    logger.info(`[DeviceSync DEBUG] lifestyleSignal: ${JSON.stringify(lifestyleSignal)}`);

    // Get connected device info
    const device = await DeviceConnection.findOne({
        patient: patientId,
        isConnected: true,
    });

    const result = {
        hasDevice: !!device,
        device: device ? {
            id: device._id,
            provider: device.provider,
            displayName: device.displayName,
            isDemoMode: device.isDemoMode,
            lastSync: device.lastSync,
            nextSyncAt: device.nextSyncAt,
        } : null,
        vitals: vitalsSignal ? {
            heartRate: vitalsSignal.vitals?.heartRate,
            recordedAt: vitalsSignal.recordedAt,
        } : null,
        lifestyle: lifestyleSignal ? {
            steps: extractStepsFromDescription(lifestyleSignal.lifestyle?.activity?.description),
            activeMinutes: lifestyleSignal.lifestyle?.activity?.duration,
            sleepHours: lifestyleSignal.lifestyle?.sleep?.duration,
            sleepQuality: lifestyleSignal.lifestyle?.sleep?.quality,
            recordedAt: lifestyleSignal.recordedAt,
        } : null,
    };

    logger.info(`[DeviceSync DEBUG] getLatestSyncedData RESULT:`);
    logger.info(JSON.stringify(result, null, 2));

    return result;
};

/**
 * Extract steps from activity description
 */
const extractStepsFromDescription = (description) => {
    if (!description) return null;
    const match = description.match(/(\d+)\s*steps/);
    return match ? parseInt(match[1]) : null;
};

/**
 * Manual sync trigger
 */
const triggerManualSync = async (patientId, deviceId) => {
    const device = await DeviceConnection.findOne({
        _id: deviceId,
        patient: patientId,
        isConnected: true,
    });

    if (!device) {
        throw new Error('Device not found or not connected');
    }

    return syncDevice(device._id);
};

module.exports = {
    getProviderStatus,
    connectDevice,
    handleOAuthCallback,
    disconnectDevice,
    getPatientDevices,
    syncDevice,
    getLatestSyncedData,
    triggerManualSync,
};
