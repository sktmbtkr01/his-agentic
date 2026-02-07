/**
 * Google Fit Provider
 * Handles OAuth and data fetching from Google Fit API
 * Falls back to demo mode when credentials not configured
 */

const axios = require('axios');

// Google Fit API Configuration
const GOOGLE_FIT_CONFIG = {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/fitness/v1/users/me',
    scopes: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.sleep.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.location.read',
    ],
};

// Data source types for Google Fit (Derived/Merged streams)
const DATA_SOURCES = {
    STEPS: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
    HEART_RATE: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
    CALORIES: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
    DISTANCE: 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta',
    ACTIVE_MINUTES: 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
};

// Data type names for Google Fit aggregate API (Generic fallback)
const DATA_TYPES = {
    STEPS: 'com.google.step_count.delta',
    HEART_RATE: 'com.google.heart_rate.bpm',
    CALORIES: 'com.google.calories.expended',
    DISTANCE: 'com.google.distance.delta',
    ACTIVE_MINUTES: 'com.google.active_minutes',
};

/**
 * Check if Google Fit API is configured
 */
const isGoogleFitConfigured = () => {
    return !!(process.env.GOOGLE_FIT_CLIENT_ID && process.env.GOOGLE_FIT_CLIENT_SECRET);
};

/**
 * Generate OAuth authorization URL
 */
const getAuthorizationUrl = (redirectUri, state = null) => {
    if (!isGoogleFitConfigured()) {
        return null; // Will use demo mode
    }

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_FIT_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: GOOGLE_FIT_CONFIG.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        ...(state && { state }),
    });

    return `${GOOGLE_FIT_CONFIG.authUrl}?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 */
const exchangeCodeForTokens = async (code, redirectUri) => {
    if (!isGoogleFitConfigured()) {
        throw new Error('Google Fit API not configured');
    }

    try {
        const response = await axios.post(GOOGLE_FIT_CONFIG.tokenUrl, {
            client_id: process.env.GOOGLE_FIT_CLIENT_ID,
            client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        const { access_token, refresh_token, expires_in, scope, token_type } = response.data;

        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
            scope: scope.split(' '),
            tokenType: token_type,
        };
    } catch (error) {
        console.error('Google Fit token exchange failed:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Google Fit');
    }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
    if (!isGoogleFitConfigured()) {
        throw new Error('Google Fit API not configured');
    }

    try {
        const response = await axios.post(GOOGLE_FIT_CONFIG.tokenUrl, {
            client_id: process.env.GOOGLE_FIT_CLIENT_ID,
            client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });

        const { access_token, expires_in, scope, token_type } = response.data;

        return {
            accessToken: access_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
            scope: scope ? scope.split(' ') : [],
            tokenType: token_type,
        };
    } catch (error) {
        console.error('Google Fit token refresh failed:', error.response?.data || error.message);
        throw new Error('Failed to refresh Google Fit token');
    }
};

/**
 * Get time range for today in nanoseconds (Google Fit format)
 */
const getTodayTimeRange = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return {
        startTimeNanos: startOfDay.getTime() * 1000000,
        endTimeNanos: endOfDay.getTime() * 1000000,
    };
};

/**
 * Fetch aggregate data from Google Fit
 */
const fetchAggregateData = async (accessToken, identifier, startTimeNanos, endTimeNanos) => {
    // Determine strict type (dataSourceId for derived streams, dataTypeName for generic)
    const aggregateParam = identifier.includes(':')
        ? { dataSourceId: identifier }
        : { dataTypeName: identifier };

    try {
        const response = await axios.post(
            `${GOOGLE_FIT_CONFIG.apiBaseUrl}/dataset:aggregate`,
            {
                aggregateBy: [aggregateParam],
                bucketByTime: { durationMillis: 86400000 }, // 1 day
                startTimeMillis: startTimeNanos / 1000000,
                endTimeMillis: endTimeNanos / 1000000,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Failed to fetch ${identifier}:`, error.response?.data || error.message);
        return null;
    }
};

/**
 * Helper to get value from aggregate response with fallback
 */
const getValueFromResponse = async (accessToken, sourceId, typeId, startTimeNanos, endTimeNanos, valueType = 'intVal', scale = 1) => {
    // Try primary source (merged/derived)
    let data = await fetchAggregateData(accessToken, sourceId, startTimeNanos, endTimeNanos);
    let value = data?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.[valueType];

    // If no value, try generic type (fallback)
    if (value === undefined || value === null) {
        data = await fetchAggregateData(accessToken, typeId, startTimeNanos, endTimeNanos);
        value = data?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.[valueType];
    }

    return (value || 0) * scale;
};

// ============================================
// MOCK DATA GENERATORS (for demo mode)
// ============================================

const generateMockActivityData = () => {
    const baseSteps = 6000 + Math.floor(Math.random() * 6000);
    const baseCalories = 1800 + Math.floor(Math.random() * 800);
    const activeMinutes = 30 + Math.floor(Math.random() * 60);
    const distance = (baseSteps * 0.0008).toFixed(2); // ~0.8m per step in km

    return {
        summary: {
            steps: baseSteps,
            caloriesOut: baseCalories,
            activeMinutes,
            distance: parseFloat(distance),
            floors: Math.floor(Math.random() * 15),
        },
        goals: {
            steps: 10000,
            caloriesOut: 2500,
            activeMinutes: 60,
            distance: 8,
        },
    };
};

const generateMockHeartRateData = () => {
    const restingHR = 60 + Math.floor(Math.random() * 15);

    return {
        restingHeartRate: restingHR,
        zones: [
            { name: 'Out of Range', minutes: 1200 + Math.floor(Math.random() * 200), min: 30, max: 94 },
            { name: 'Fat Burn', minutes: 40 + Math.floor(Math.random() * 40), min: 94, max: 132 },
            { name: 'Cardio', minutes: 10 + Math.floor(Math.random() * 20), min: 132, max: 160 },
            { name: 'Peak', minutes: Math.floor(Math.random() * 10), min: 160, max: 220 },
        ],
        current: restingHR + Math.floor(Math.random() * 20),
    };
};

const generateMockSleepData = () => {
    const totalMinutes = 360 + Math.floor(Math.random() * 180); // 6-9 hours
    const efficiency = 75 + Math.floor(Math.random() * 20);

    const qualityRatings = ['poor', 'fair', 'good', 'excellent'];
    const qualityIndex = efficiency < 70 ? 0 : efficiency < 80 ? 1 : efficiency < 90 ? 2 : 3;

    return {
        summary: {
            totalMinutesAsleep: totalMinutes,
            totalTimeInBed: totalMinutes + 20 + Math.floor(Math.random() * 30),
            efficiency,
        },
        stages: {
            deep: Math.floor(totalMinutes * (0.15 + Math.random() * 0.1)),
            light: Math.floor(totalMinutes * (0.45 + Math.random() * 0.1)),
            rem: Math.floor(totalMinutes * (0.2 + Math.random() * 0.05)),
            wake: Math.floor(totalMinutes * (0.05 + Math.random() * 0.05)),
        },
        quality: qualityRatings[qualityIndex],
    };
};

/**
 * Fetch activity data (steps, calories, distance)
 */
const fetchActivityData = async (accessToken) => {
    if (!isGoogleFitConfigured() || !accessToken) {
        return generateMockActivityData();
    }

    const { startTimeNanos, endTimeNanos } = getTodayTimeRange();

    try {
        // Fetch steps (Try derived first, then generic)
        const steps = await getValueFromResponse(accessToken, DATA_SOURCES.STEPS, DATA_TYPES.STEPS, startTimeNanos, endTimeNanos, 'intVal');

        // Fetch calories
        const calories = Math.round(await getValueFromResponse(accessToken, DATA_SOURCES.CALORIES, DATA_TYPES.CALORIES, startTimeNanos, endTimeNanos, 'fpVal'));

        // Fetch active minutes
        const activeMinutes = await getValueFromResponse(accessToken, DATA_SOURCES.ACTIVE_MINUTES, DATA_TYPES.ACTIVE_MINUTES, startTimeNanos, endTimeNanos, 'intVal');

        // Fetch distance (km)
        const distance = parseFloat((await getValueFromResponse(accessToken, DATA_SOURCES.DISTANCE, DATA_TYPES.DISTANCE, startTimeNanos, endTimeNanos, 'fpVal', 0.001)).toFixed(2));

        return {
            summary: {
                steps,
                caloriesOut: calories,
                activeMinutes,
                distance,
                floors: 0,
            },
            goals: {
                steps: 10000,
                caloriesOut: 2500,
                activeMinutes: 60,
                distance: 8,
            },
        };
    } catch (error) {
        console.error('Failed to fetch Google Fit activity data:', error);
        // CRITICAL: Return empty real data instead of mock data on error/failure
        return {
            summary: { steps: 0, caloriesOut: 0, activeMinutes: 0, distance: 0, floors: 0 },
            goals: { steps: 10000, caloriesOut: 2500, activeMinutes: 60, distance: 8 }
        };
    }
};

/**
 * Fetch heart rate data
 */
const fetchHeartRateData = async (accessToken) => {
    if (!isGoogleFitConfigured() || !accessToken) {
        return generateMockHeartRateData();
    }

    const { startTimeNanos, endTimeNanos } = getTodayTimeRange();

    try {
        const hrData = await fetchAggregateData(accessToken, DATA_SOURCES.HEART_RATE, startTimeNanos, endTimeNanos);
        const avgHR = Math.round(hrData?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0);

        if (avgHR === 0) {
            return generateMockHeartRateData();
        }

        return {
            restingHeartRate: avgHR - 5,
            current: avgHR,
            zones: [
                { name: 'Resting', minutes: 0, min: 40, max: 100 },
                { name: 'Active', minutes: 0, min: 100, max: 140 },
                { name: 'High', minutes: 0, min: 140, max: 180 },
            ],
        };
    } catch (error) {
        console.error('Failed to fetch Google Fit heart rate:', error);
        return generateMockHeartRateData();
    }
};

/**
 * Fetch sleep data
 */
const fetchSleepData = async (accessToken) => {
    // Google Fit sleep API requires special permissions
    // For now, return mock data
    return generateMockSleepData();
};

/**
 * Fetch all data types
 */
const fetchAllData = async (accessToken) => {
    const [activity, heartRate, sleep] = await Promise.all([
        fetchActivityData(accessToken),
        fetchHeartRateData(accessToken),
        fetchSleepData(accessToken),
    ]);

    return {
        activity,
        heartRate,
        sleep,
        syncedAt: new Date().toISOString(),
        provider: 'google_fit',
    };
};

module.exports = {
    isGoogleFitConfigured,
    getAuthorizationUrl,
    exchangeCodeForTokens,
    refreshAccessToken,
    fetchActivityData,
    fetchHeartRateData,
    fetchSleepData,
    fetchAllData,
    // Export mock generators for demo mode
    generateMockActivityData,
    generateMockHeartRateData,
    generateMockSleepData,
};
