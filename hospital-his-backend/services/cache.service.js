/**
 * Cache Service
 * Provides a unified caching interface using Redis
 * Falls back gracefully when Redis is unavailable
 */

const { getRedisClient, isRedisConnected, KEY_PREFIXES, TTL } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * In-memory fallback cache (limited size, for when Redis is down)
 */
const memoryCache = new Map();
const MAX_MEMORY_CACHE_SIZE = 1000;

/**
 * Generic get from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
const get = async (key) => {
    try {
        if (isRedisConnected()) {
            const client = getRedisClient();
            const value = await client.get(key);
            return value ? JSON.parse(value) : null;
        }
        
        // Fallback to memory cache
        return memoryCache.get(key) || null;
    } catch (error) {
        logger.error(`Cache get error for key ${key}:`, error.message);
        return memoryCache.get(key) || null;
    }
};

/**
 * Generic set to cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 */
const set = async (key, value, ttl = null) => {
    try {
        const serialized = JSON.stringify(value);
        
        if (isRedisConnected()) {
            const client = getRedisClient();
            if (ttl) {
                await client.setex(key, ttl, serialized);
            } else {
                await client.set(key, serialized);
            }
        }
        
        // Also set in memory cache as fallback
        if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
            // Remove oldest entry (first key)
            const firstKey = memoryCache.keys().next().value;
            memoryCache.delete(firstKey);
        }
        memoryCache.set(key, value);
        
        // Auto-cleanup memory cache entry after TTL
        if (ttl) {
            setTimeout(() => memoryCache.delete(key), ttl * 1000);
        }
    } catch (error) {
        logger.error(`Cache set error for key ${key}:`, error.message);
        // Silently fail - cache is non-critical
    }
};

/**
 * Delete from cache
 * @param {string} key - Cache key
 */
const del = async (key) => {
    try {
        if (isRedisConnected()) {
            const client = getRedisClient();
            await client.del(key);
        }
        memoryCache.delete(key);
    } catch (error) {
        logger.error(`Cache delete error for key ${key}:`, error.message);
    }
};

/**
 * Delete multiple keys by pattern
 * @param {string} pattern - Pattern to match (e.g., "health:score:*")
 */
const delByPattern = async (pattern) => {
    try {
        if (isRedisConnected()) {
            const client = getRedisClient();
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
        }
        
        // Clear matching keys from memory cache
        for (const key of memoryCache.keys()) {
            if (key.startsWith(pattern.replace('*', ''))) {
                memoryCache.delete(key);
            }
        }
    } catch (error) {
        logger.error(`Cache pattern delete error for ${pattern}:`, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════════
// SPECIALIZED CACHE METHODS
// ═══════════════════════════════════════════════════════════════════

/**
 * Patient Refresh Token Operations
 */
const patientTokens = {
    async set(patientId, token) {
        const key = `${KEY_PREFIXES.PATIENT_REFRESH_TOKEN}${patientId}`;
        await set(key, token, TTL.PATIENT_REFRESH_TOKEN);
    },

    async get(patientId) {
        const key = `${KEY_PREFIXES.PATIENT_REFRESH_TOKEN}${patientId}`;
        return await get(key);
    },

    async delete(patientId) {
        const key = `${KEY_PREFIXES.PATIENT_REFRESH_TOKEN}${patientId}`;
        await del(key);
    },
};

/**
 * Health Score Cache Operations
 */
const healthScore = {
    async set(patientId, score) {
        const key = `${KEY_PREFIXES.HEALTH_SCORE}${patientId}`;
        await set(key, score, TTL.HEALTH_SCORE);
    },

    async get(patientId) {
        const key = `${KEY_PREFIXES.HEALTH_SCORE}${patientId}`;
        return await get(key);
    },

    async invalidate(patientId) {
        const key = `${KEY_PREFIXES.HEALTH_SCORE}${patientId}`;
        await del(key);
    },
};

/**
 * Tariff List Cache
 */
const tariffs = {
    async set(tariffList) {
        await set(KEY_PREFIXES.TARIFF_LIST, tariffList, TTL.TARIFF_LIST);
    },

    async get() {
        return await get(KEY_PREFIXES.TARIFF_LIST);
    },

    async invalidate() {
        await del(KEY_PREFIXES.TARIFF_LIST);
    },
};

/**
 * Department List Cache
 */
const departments = {
    async set(departmentList) {
        await set(KEY_PREFIXES.DEPARTMENT_LIST, departmentList, TTL.DEPARTMENT_LIST);
    },

    async get() {
        return await get(KEY_PREFIXES.DEPARTMENT_LIST);
    },

    async invalidate() {
        await del(KEY_PREFIXES.DEPARTMENT_LIST);
    },
};

/**
 * Nudge Prediction Cache
 */
const nudgePrediction = {
    async set(patientId, prediction) {
        const key = `${KEY_PREFIXES.NUDGE_PREDICTION}${patientId}`;
        await set(key, prediction, TTL.NUDGE_PREDICTION);
    },

    async get(patientId) {
        const key = `${KEY_PREFIXES.NUDGE_PREDICTION}${patientId}`;
        return await get(key);
    },
};

/**
 * Rate Limiting
 */
const rateLimit = {
    async increment(identifier) {
        try {
            if (isRedisConnected()) {
                const client = getRedisClient();
                const key = `${KEY_PREFIXES.RATE_LIMIT}${identifier}`;
                const count = await client.incr(key);
                
                // Set expiry on first increment
                if (count === 1) {
                    await client.expire(key, TTL.RATE_LIMIT);
                }
                
                return count;
            }
            
            // Fallback: allow all requests when Redis is down
            return 1;
        } catch (error) {
            logger.error(`Rate limit error for ${identifier}:`, error.message);
            return 1;
        }
    },

    async getCount(identifier) {
        try {
            if (isRedisConnected()) {
                const client = getRedisClient();
                const key = `${KEY_PREFIXES.RATE_LIMIT}${identifier}`;
                const count = await client.get(key);
                return parseInt(count) || 0;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    },
};

/**
 * Distributed Lock (for preventing race conditions)
 */
const lock = {
    async acquire(resource, timeout = TTL.LOCK) {
        try {
            if (isRedisConnected()) {
                const client = getRedisClient();
                const key = `${KEY_PREFIXES.LOCK}${resource}`;
                const result = await client.set(key, '1', 'EX', timeout, 'NX');
                return result === 'OK';
            }
            return true; // Allow operation when Redis is down
        } catch (error) {
            logger.error(`Lock acquire error for ${resource}:`, error.message);
            return true;
        }
    },

    async release(resource) {
        try {
            if (isRedisConnected()) {
                const client = getRedisClient();
                const key = `${KEY_PREFIXES.LOCK}${resource}`;
                await client.del(key);
            }
        } catch (error) {
            logger.error(`Lock release error for ${resource}:`, error.message);
        }
    },
};

/**
 * Socket.io User Session Management
 */
const userSession = {
    async set(userId, socketId) {
        const key = `${KEY_PREFIXES.USER_SESSION}${userId}`;
        // Sessions don't expire - they're cleaned up on disconnect
        await set(key, socketId);
    },

    async get(userId) {
        const key = `${KEY_PREFIXES.USER_SESSION}${userId}`;
        return await get(key);
    },

    async delete(userId) {
        const key = `${KEY_PREFIXES.USER_SESSION}${userId}`;
        await del(key);
    },
};

/**
 * Cache statistics (for monitoring)
 */
const getStats = async () => {
    const stats = {
        redis: {
            connected: isRedisConnected(),
            keys: 0,
        },
        memory: {
            size: memoryCache.size,
            maxSize: MAX_MEMORY_CACHE_SIZE,
        },
    };

    if (isRedisConnected()) {
        try {
            const client = getRedisClient();
            const info = await client.info('keyspace');
            const match = info.match(/keys=(\d+)/);
            if (match) {
                stats.redis.keys = parseInt(match[1]);
            }
        } catch (error) {
            // Ignore stats errors
        }
    }

    return stats;
};

module.exports = {
    // Generic operations
    get,
    set,
    del,
    delByPattern,
    
    // Specialized caches
    patientTokens,
    healthScore,
    tariffs,
    departments,
    nudgePrediction,
    rateLimit,
    lock,
    userSession,
    
    // Utils
    getStats,
};
