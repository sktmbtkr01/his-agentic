/**
 * Fitbit Provider Service
 * Handles Fitbit OAuth and data fetching
 * Falls back to demo/mock data when API credentials are not available
 */

const axios = require('axios');
const logger = require('../../utils/logger');

// Fitbit API configuration
const FITBIT_CONFIG = {
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    apiBaseUrl: 'https://api.fitbit.com',
    scopes: ['activity', 'heartrate', 'sleep', 'weight', 'profile'],
};

// Check if Fitbit credentials are configured
const isFitbitConfigured = () => {
    return !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET);
};

/**
 * Generate OAuth authorization URL
 */
const getAuthorizationUrl = (patientId, redirectUri) => {
    if (!isFitbitConfigured()) {
        logger.warn('Fitbit API not configured. Using demo mode.');
        return null;
    }

    const state = Buffer.from(JSON.stringify({ patientId, timestamp: Date.now() })).toString('base64');

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.FITBIT_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: FITBIT_CONFIG.scopes.join(' '),
        state,
        expires_in: '31536000', // 1 year
    });

    return `${FITBIT_CONFIG.authUrl}?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 */
const exchangeCodeForTokens = async (code, redirectUri) => {
    if (!isFitbitConfigured()) {
        throw new Error('Fitbit API not configured');
    }

    const credentials = Buffer.from(
        `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
    ).toString('base64');

    try {
        const response = await axios.post(
            FITBIT_CONFIG.tokenUrl,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, refresh_token, expires_in, user_id, scope } = response.data;

        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
            providerUserId: user_id,
            scope: scope.split(' '),
        };
    } catch (error) {
        logger.error('Fitbit token exchange failed:', error.response?.data || error.message);
        throw new Error('Failed to exchange Fitbit authorization code');
    }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
    if (!isFitbitConfigured()) {
        throw new Error('Fitbit API not configured');
    }

    const credentials = Buffer.from(
        `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
    ).toString('base64');

    try {
        const response = await axios.post(
            FITBIT_CONFIG.tokenUrl,
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;

        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
        };
    } catch (error) {
        logger.error('Fitbit token refresh failed:', error.response?.data || error.message);
        throw new Error('Failed to refresh Fitbit token');
    }
};

/**
 * Make authenticated Fitbit API request
 */
const makeApiRequest = async (accessToken, endpoint) => {
    try {
        const response = await axios.get(`${FITBIT_CONFIG.apiBaseUrl}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        logger.error(`Fitbit API request failed for ${endpoint}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetch today's activity data
 */
const fetchActivityData = async (accessToken, date = 'today') => {
    if (!isFitbitConfigured() || !accessToken) {
        return generateMockActivityData(date);
    }

    try {
        const data = await makeApiRequest(accessToken, `/1/user/-/activities/date/${date}.json`);
        return {
            steps: data.summary?.steps || 0,
            calories: data.summary?.caloriesOut || 0,
            distance: data.summary?.distances?.find(d => d.activity === 'total')?.distance || 0,
            activeMinutes: (data.summary?.fairlyActiveMinutes || 0) + (data.summary?.veryActiveMinutes || 0),
            floors: data.summary?.floors || 0,
        };
    } catch (error) {
        logger.warn('Falling back to mock activity data:', error.message);
        return generateMockActivityData(date);
    }
};

/**
 * Fetch heart rate data
 */
const fetchHeartRateData = async (accessToken, date = 'today') => {
    if (!isFitbitConfigured() || !accessToken) {
        return generateMockHeartRateData(date);
    }

    try {
        const data = await makeApiRequest(accessToken, `/1/user/-/activities/heart/date/${date}/1d.json`);
        const heartRateZones = data['activities-heart']?.[0]?.value?.heartRateZones || [];
        const restingHeartRate = data['activities-heart']?.[0]?.value?.restingHeartRate;

        return {
            restingHeartRate: restingHeartRate || null,
            zones: heartRateZones.map(zone => ({
                name: zone.name,
                min: zone.min,
                max: zone.max,
                minutes: zone.minutes,
                caloriesOut: zone.caloriesOut,
            })),
            // Intraday data if available
            intradayData: data['activities-heart-intraday']?.dataset || [],
        };
    } catch (error) {
        logger.warn('Falling back to mock heart rate data:', error.message);
        return generateMockHeartRateData(date);
    }
};

/**
 * Fetch sleep data
 */
const fetchSleepData = async (accessToken, date = 'today') => {
    if (!isFitbitConfigured() || !accessToken) {
        return generateMockSleepData(date);
    }

    try {
        const data = await makeApiRequest(accessToken, `/1.2/user/-/sleep/date/${date}.json`);
        const mainSleep = data.sleep?.find(s => s.isMainSleep) || data.sleep?.[0];

        if (!mainSleep) {
            return generateMockSleepData(date);
        }

        return {
            duration: mainSleep.duration / (1000 * 60), // Convert to minutes
            efficiency: mainSleep.efficiency,
            startTime: mainSleep.startTime,
            endTime: mainSleep.endTime,
            stages: mainSleep.levels?.summary ? {
                deep: mainSleep.levels.summary.deep?.minutes || 0,
                light: mainSleep.levels.summary.light?.minutes || 0,
                rem: mainSleep.levels.summary.rem?.minutes || 0,
                wake: mainSleep.levels.summary.wake?.minutes || 0,
            } : null,
            quality: calculateSleepQuality(mainSleep),
        };
    } catch (error) {
        logger.warn('Falling back to mock sleep data:', error.message);
        return generateMockSleepData(date);
    }
};

/**
 * Fetch all data for sync
 */
const fetchAllData = async (accessToken, date = 'today') => {
    const isDemoMode = !isFitbitConfigured() || !accessToken;

    const [activity, heartRate, sleep] = await Promise.all([
        fetchActivityData(accessToken, date),
        fetchHeartRateData(accessToken, date),
        fetchSleepData(accessToken, date),
    ]);

    return {
        isDemoMode,
        syncedAt: new Date(),
        date: date === 'today' ? new Date().toISOString().split('T')[0] : date,
        activity,
        heartRate,
        sleep,
    };
};

// ============================================
// MOCK DATA GENERATORS (Demo Mode)
// ============================================

/**
 * Generate realistic mock activity data
 */
const generateMockActivityData = (date) => {
    const hour = new Date().getHours();
    // Steps accumulate through the day
    const baseSteps = Math.floor(Math.random() * 2000) + 3000;
    const hourlySteps = Math.floor(baseSteps * (hour / 24));

    return {
        steps: hourlySteps + Math.floor(Math.random() * 1000),
        calories: 1200 + Math.floor(Math.random() * 600) + Math.floor(hourlySteps * 0.04),
        distance: parseFloat(((hourlySteps / 1300) + Math.random() * 0.5).toFixed(2)),
        activeMinutes: Math.floor(Math.random() * 30) + 15,
        floors: Math.floor(Math.random() * 10) + 2,
    };
};

/**
 * Generate realistic mock heart rate data
 */
const generateMockHeartRateData = (date) => {
    const baseResting = 60 + Math.floor(Math.random() * 15);

    return {
        restingHeartRate: baseResting,
        currentHeartRate: baseResting + Math.floor(Math.random() * 20),
        zones: [
            { name: 'Out of Range', min: 30, max: 91, minutes: 400 + Math.floor(Math.random() * 200), caloriesOut: 800 },
            { name: 'Fat Burn', min: 91, max: 127, minutes: 30 + Math.floor(Math.random() * 60), caloriesOut: 200 },
            { name: 'Cardio', min: 127, max: 154, minutes: Math.floor(Math.random() * 30), caloriesOut: 100 },
            { name: 'Peak', min: 154, max: 220, minutes: Math.floor(Math.random() * 10), caloriesOut: 50 },
        ],
        intradayData: [], // Would contain minute-by-minute data in real API
    };
};

/**
 * Generate realistic mock sleep data
 */
const generateMockSleepData = (date) => {
    const sleepDuration = 360 + Math.floor(Math.random() * 120); // 6-8 hours in minutes
    const efficiency = 75 + Math.floor(Math.random() * 20);

    // Calculate stages based on typical sleep architecture
    const deepPct = 0.15 + Math.random() * 0.1;
    const remPct = 0.2 + Math.random() * 0.1;
    const lightPct = 0.5 + Math.random() * 0.1;
    const wakePct = 1 - deepPct - remPct - lightPct;

    return {
        duration: sleepDuration,
        efficiency,
        startTime: '23:00',
        endTime: `${6 + Math.floor(sleepDuration / 60)}:${String(sleepDuration % 60).padStart(2, '0')}`,
        stages: {
            deep: Math.floor(sleepDuration * deepPct),
            light: Math.floor(sleepDuration * lightPct),
            rem: Math.floor(sleepDuration * remPct),
            wake: Math.floor(sleepDuration * wakePct),
        },
        quality: efficiency >= 85 ? 'excellent' : efficiency >= 75 ? 'good' : efficiency >= 60 ? 'fair' : 'poor',
    };
};

/**
 * Calculate sleep quality from Fitbit data
 */
const calculateSleepQuality = (sleepData) => {
    const efficiency = sleepData.efficiency || 0;
    if (efficiency >= 85) return 'excellent';
    if (efficiency >= 75) return 'good';
    if (efficiency >= 60) return 'fair';
    return 'poor';
};

module.exports = {
    isFitbitConfigured,
    getAuthorizationUrl,
    exchangeCodeForTokens,
    refreshAccessToken,
    fetchActivityData,
    fetchHeartRateData,
    fetchSleepData,
    fetchAllData,
    FITBIT_CONFIG,
};
