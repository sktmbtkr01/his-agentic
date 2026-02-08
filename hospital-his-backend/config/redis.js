/**
 * Redis Configuration
 * Handles Redis connection for caching, sessions, and real-time features
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

// Redis configuration from environment
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    enableReadyCheck: true,
    lazyConnect: true,
};

// Add TLS if required (for production Redis like AWS ElastiCache, Redis Cloud)
if (process.env.REDIS_TLS === 'true') {
    redisConfig.tls = {};
}

// Create Redis client
let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
const connectRedis = async () => {
    if (!process.env.USE_REDIS_CACHE || process.env.USE_REDIS_CACHE === 'false') {
        logger.info('Redis cache disabled via USE_REDIS_CACHE=false');
        return null;
    }

    try {
        redisClient = new Redis(redisConfig);

        redisClient.on('connect', () => {
            logger.info('📦 Redis client connecting...');
        });

        redisClient.on('ready', () => {
            isConnected = true;
            logger.info('✅ Redis connected and ready');
        });

        redisClient.on('error', (err) => {
            logger.error('Redis connection error:', err.message);
            isConnected = false;
        });

        redisClient.on('close', () => {
            logger.warn('Redis connection closed');
            isConnected = false;
        });

        redisClient.on('reconnecting', () => {
            logger.info('Redis reconnecting...');
        });

        // Explicitly connect
        await redisClient.connect();

        return redisClient;
    } catch (error) {
        logger.error('Failed to connect to Redis:', error.message);
        // Don't throw - allow app to run without Redis
        return null;
    }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
    return redisClient;
};

/**
 * Check if Redis is connected
 */
const isRedisConnected = () => {
    return isConnected && redisClient !== null;
};

/**
 * Disconnect Redis gracefully
 */
const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        isConnected = false;
        logger.info('Redis disconnected');
    }
};

/**
 * Key prefixes for different data types
 */
const KEY_PREFIXES = {
    PATIENT_REFRESH_TOKEN: 'patient:refresh:',
    USER_SESSION: 'socket:user:',
    HEALTH_SCORE: 'health:score:',
    TARIFF_LIST: 'tariff:list',
    DEPARTMENT_LIST: 'department:list',
    RATE_LIMIT: 'rate:limit:',
    NUDGE_PREDICTION: 'nudge:prediction:',
    LOCK: 'lock:',
};

/**
 * TTL values in seconds
 */
const TTL = {
    PATIENT_REFRESH_TOKEN: 7 * 24 * 60 * 60,  // 7 days
    HEALTH_SCORE: 10 * 60,                     // 10 minutes
    TARIFF_LIST: 60 * 60,                      // 1 hour
    DEPARTMENT_LIST: 60 * 60,                  // 1 hour
    RATE_LIMIT: 60,                            // 1 minute
    NUDGE_PREDICTION: 5 * 60,                  // 5 minutes
    LOCK: 30,                                  // 30 seconds
};

module.exports = {
    connectRedis,
    getRedisClient,
    isRedisConnected,
    disconnectRedis,
    KEY_PREFIXES,
    TTL,
};
