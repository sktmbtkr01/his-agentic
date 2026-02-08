/**
 * PostgreSQL Configuration
 * Handles PostgreSQL connection for billing and inventory
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// PostgreSQL configuration from environment
const postgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'lifeline_his',
    username: process.env.POSTGRES_USER || 'lifeline',
    password: process.env.POSTGRES_PASSWORD || '',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },
};

// Add SSL if required (for production)
if (process.env.POSTGRES_SSL === 'true') {
    postgresConfig.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    };
}

// Sequelize instance
let sequelize = null;
let isConnected = false;

/**
 * Initialize PostgreSQL connection
 */
const connectPostgres = async () => {
    const usePostgres = 
        process.env.USE_POSTGRES_BILLING === 'true' || 
        process.env.USE_POSTGRES_INVENTORY === 'true';

    if (!usePostgres) {
        logger.info('PostgreSQL disabled - billing/inventory using MongoDB');
        return null;
    }

    try {
        sequelize = new Sequelize(
            postgresConfig.database,
            postgresConfig.username,
            postgresConfig.password,
            postgresConfig
        );

        // Test connection
        await sequelize.authenticate();
        isConnected = true;
        logger.info('✅ PostgreSQL connected successfully');

        return sequelize;
    } catch (error) {
        logger.error('Failed to connect to PostgreSQL:', error.message);
        // Don't throw - allow app to run with MongoDB only
        return null;
    }
};

/**
 * Get Sequelize instance
 */
const getSequelize = () => {
    return sequelize;
};

/**
 * Check if PostgreSQL is connected
 */
const isPostgresConnected = () => {
    return isConnected && sequelize !== null;
};

/**
 * Disconnect PostgreSQL gracefully
 */
const disconnectPostgres = async () => {
    if (sequelize) {
        await sequelize.close();
        sequelize = null;
        isConnected = false;
        logger.info('PostgreSQL disconnected');
    }
};

/**
 * Run database migrations
 */
const runMigrations = async () => {
    if (!sequelize) return;

    try {
        // Sync all models (in development) or run migrations (in production)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            logger.info('PostgreSQL models synced');
        }
        // In production, use sequelize-cli migrations
    } catch (error) {
        logger.error('Migration error:', error.message);
        throw error;
    }
};

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 */
const withTransaction = async (callback) => {
    if (!sequelize) {
        throw new Error('PostgreSQL not connected');
    }

    const transaction = await sequelize.transaction();
    
    try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    connectPostgres,
    getSequelize,
    isPostgresConnected,
    disconnectPostgres,
    runMigrations,
    withTransaction,
};
