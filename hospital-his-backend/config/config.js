require('dotenv').config();

/**
 * Application Configuration
 * Centralized environment variables and configuration settings
 */

const config = {
    // Server Configuration
    port: process.env.PORT || 7860,  // 7860 is default for HF Spaces
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB Configuration
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_his',

    // JWT Configuration
    jwtSecret: 'your_secure_jwt_secret_key_here', // Hardcoded for consistency
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',

    // ML Services URLs
    mlRevenueServiceUrl: process.env.ML_REVENUE_SERVICE_URL || 'http://localhost:5004',
    mlPredictServiceUrl: process.env.ML_PREDICT_SERVICE_URL || 'http://localhost:5002',

    // External Microservices URLs (for HF Spaces deployment)
    ocrServiceUrl: process.env.OCR_SERVICE_URL || 'http://localhost:8000',
    voiceServiceUrl: process.env.VOICE_SERVICE_URL || 'http://localhost:5003',

    // Email/SMTP Configuration
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@hospital-his.com',
    },

    // AWS Configuration
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY || '',
        secretAccessKey: process.env.AWS_SECRET_KEY || '',
        bucketName: process.env.AWS_BUCKET_NAME || 'hospital-his-files',
        region: process.env.AWS_REGION || 'ap-south-1',
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000,
    },

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',

    // Cors
    corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'https://his-agentic.vercel.app',
            'https://sktmbtkr-his-agentic-backend.hf.space'
        ],
};

module.exports = config;
