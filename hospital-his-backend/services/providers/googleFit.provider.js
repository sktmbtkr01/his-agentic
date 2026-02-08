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

    console.log(`[GoogleFit DEBUG] fetchAggregateData for: ${identifier}`);

    try {
        const requestBody = {
            aggregateBy: [aggregateParam],
            bucketByTime: { durationMillis: 86400000 }, // 1 day
            startTimeMillis: startTimeNanos / 1000000,
            endTimeMillis: endTimeNanos / 1000000,
        };

        console.log(`[GoogleFit DEBUG] Request body:`, JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `${GOOGLE_FIT_CONFIG.apiBaseUrl}/dataset:aggregate`,
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log(`[GoogleFit DEBUG] Response for ${identifier}:`, JSON.stringify(response.data, null, 2));

        return response.data;
    } catch (error) {
        console.error(`[GoogleFit DEBUG] Failed to fetch ${identifier}:`, error.response?.data || error.message);
        return null;
    }
};

/**
 * Helper to get value from aggregate response with fallback
 */
const getValueFromResponse = async (accessToken, sourceId, typeId, startTimeNanos, endTimeNanos, valueType = 'intVal', scale = 1) => {
    console.log(`[GoogleFit DEBUG] getValueFromResponse - trying GENERIC typeId FIRST: ${typeId}`);

    // Try GENERIC type first (more reliable across devices)
    let data = await fetchAggregateData(accessToken, typeId, startTimeNanos, endTimeNanos);
    let value = data?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.[valueType];

    console.log(`[GoogleFit DEBUG] Generic type result: value=${value}, bucket exists=${!!data?.bucket?.[0]}, dataset exists=${!!data?.bucket?.[0]?.dataset?.[0]}, point exists=${!!data?.bucket?.[0]?.dataset?.[0]?.point?.[0]}`);

    // If no value from generic type, try derived source as fallback
    if (value === undefined || value === null) {
        console.log(`[GoogleFit DEBUG] Generic failed, trying derived sourceId: ${sourceId}`);
        data = await fetchAggregateData(accessToken, sourceId, startTimeNanos, endTimeNanos);
        value = data?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.[valueType];
        console.log(`[GoogleFit DEBUG] Derived source result: value=${value}`);
    }

    const finalValue = (value || 0) * scale;
    console.log(`[GoogleFit DEBUG] Final value for ${typeId}: ${finalValue}`);
    return finalValue;
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
    console.log('[GoogleFit DEBUG] fetchActivityData called');
    console.log('[GoogleFit DEBUG] isGoogleFitConfigured:', isGoogleFitConfigured());
    console.log('[GoogleFit DEBUG] accessToken present:', !!accessToken);

    if (!isGoogleFitConfigured() || !accessToken) {
        console.log('[GoogleFit DEBUG] Using MOCK activity data (no config or token)');
        const mockData = generateMockActivityData();
        console.log('[GoogleFit DEBUG] Mock activity data:', JSON.stringify(mockData, null, 2));
        return mockData;
    }

    const { startTimeNanos, endTimeNanos } = getTodayTimeRange();
    console.log('[GoogleFit DEBUG] Time range:', {
        start: new Date(startTimeNanos / 1000000).toISOString(),
        end: new Date(endTimeNanos / 1000000).toISOString()
    });

    try {
        // Fetch steps (Try derived first, then generic)
        console.log('[GoogleFit DEBUG] Fetching steps...');
        const steps = await getValueFromResponse(accessToken, DATA_SOURCES.STEPS, DATA_TYPES.STEPS, startTimeNanos, endTimeNanos, 'intVal');
        console.log('[GoogleFit DEBUG] Steps result:', steps);

        // Fetch calories
        console.log('[GoogleFit DEBUG] Fetching calories...');
        const calories = Math.round(await getValueFromResponse(accessToken, DATA_SOURCES.CALORIES, DATA_TYPES.CALORIES, startTimeNanos, endTimeNanos, 'fpVal'));
        console.log('[GoogleFit DEBUG] Calories result:', calories);

        // Fetch active minutes
        console.log('[GoogleFit DEBUG] Fetching active minutes...');
        const activeMinutes = await getValueFromResponse(accessToken, DATA_SOURCES.ACTIVE_MINUTES, DATA_TYPES.ACTIVE_MINUTES, startTimeNanos, endTimeNanos, 'intVal');
        console.log('[GoogleFit DEBUG] Active minutes result:', activeMinutes);

        // Fetch distance (km)
        console.log('[GoogleFit DEBUG] Fetching distance...');
        const distance = parseFloat((await getValueFromResponse(accessToken, DATA_SOURCES.DISTANCE, DATA_TYPES.DISTANCE, startTimeNanos, endTimeNanos, 'fpVal', 0.001)).toFixed(2));
        console.log('[GoogleFit DEBUG] Distance result:', distance);

        const result = {
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
        console.log('[GoogleFit DEBUG] REAL activity data result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('[GoogleFit DEBUG] Failed to fetch Google Fit activity data:', error);
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
        console.log('[GoogleFit DEBUG] Using MOCK heart rate (no config or token)')
        return generateMockHeartRateData();
    }

    const { startTimeNanos, endTimeNanos } = getTodayTimeRange();

    try {
        console.log('[GoogleFit DEBUG] Fetching REAL heart rate data...');

        // Try GENERIC type first (more reliable across devices)
        console.log('[GoogleFit DEBUG] Trying generic heart rate type first...');
        let hrData = await fetchAggregateData(accessToken, DATA_TYPES.HEART_RATE, startTimeNanos, endTimeNanos);
        let avgHR = Math.round(hrData?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0);
        console.log('[GoogleFit DEBUG] Generic heart rate result:', avgHR);

        // If generic fails, try derived data source
        if (avgHR === 0) {
            console.log('[GoogleFit DEBUG] Generic failed, trying derived source...');
            hrData = await fetchAggregateData(accessToken, DATA_SOURCES.HEART_RATE, startTimeNanos, endTimeNanos);
            avgHR = Math.round(hrData?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0);
            console.log('[GoogleFit DEBUG] Derived heart rate result:', avgHR);
        }

        if (avgHR === 0) {
            console.log('[GoogleFit DEBUG] No heart rate data from API, returning MOCK');
            return generateMockHeartRateData();
        }

        console.log('[GoogleFit DEBUG] Returning REAL heart rate:', avgHR);
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
        console.error('[GoogleFit DEBUG] Failed to fetch heart rate:', error);
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
    console.log('\n========================================');
    console.log('[GoogleFit DEBUG] fetchAllData called');
    console.log('[GoogleFit DEBUG] accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NULL');
    console.log('========================================\n');

    const [activity, heartRate, sleep] = await Promise.all([
        fetchActivityData(accessToken),
        fetchHeartRateData(accessToken),
        fetchSleepData(accessToken),
    ]);

    const result = {
        activity,
        heartRate,
        sleep,
        syncedAt: new Date().toISOString(),
        provider: 'google_fit',
    };

    console.log('\n========================================');
    console.log('[GoogleFit DEBUG] fetchAllData FINAL RESULT:');
    console.log(JSON.stringify(result, null, 2));
    console.log('========================================\n');

    return result;
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
