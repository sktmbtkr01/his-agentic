require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Configuration
const config = require('./config/config');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/error.middleware');

// Models and Constants for Seeding
const Ward = require('./models/Ward');
const Bed = require('./models/Bed');
const Department = require('./models/Department');
const { BED_STATUS, BED_TYPES } = require('./config/constants');

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');

// Route imports
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const opdRoutes = require('./routes/opd.routes');
const ipdRoutes = require('./routes/ipd.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const emergencyOrderSetRoutes = require('./routes/emergency.orderSet.routes');
const emrRoutes = require('./routes/emr.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const labRoutes = require('./routes/lab.routes');
const radiologyRoutes = require('./routes/radiology.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const billingRoutes = require('./routes/billing.routes');
const paymentRoutes = require('./routes/payment.routes');
const insuranceRoutes = require('./routes/insurance.routes');
const surgeryRoutes = require('./routes/surgery.routes');
// const inventoryRoutes = require('./routes/inventory.routes');
const bedRoutes = require('./routes/bed.routes');
const staffRoutes = require('./routes/staff.routes');
const departmentRoutes = require('./routes/department.routes');
const tariffRoutes = require('./routes/tariff.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiRoutes = require('./routes/ai.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const nursingRoutes = require('./routes/nursing.routes');
const carePlanRoutes = require('./routes/careplan.routes');
const nurseAssignmentRoutes = require('./routes/nurseAssignment.routes');
const masterdataRoutes = require('./routes/masterdata.routes');
const userManagementRoutes = require('./routes/userManagement.routes');
const adminDashboardRoutes = require('./routes/adminDashboard.routes');
const revenueAnomalyRoutes = require('./routes/revenueAnomaly.routes');
const breakGlassRoutes = require('./routes/breakGlass.routes');
const adminBreakGlassRoutes = require('./routes/adminBreakGlass.routes');
const inventoryManagerRoutes = require('./routes/inventoryManager.routes');
const clinicalCodingRoutes = require('./routes/clinicalCoding.routes');
const incidentRoutes = require('./routes/incident.routes');
const systemSettingsRoutes = require('./routes/systemSettings.routes');
const departmentBillingRoutes = require('./routes/departmentBilling.routes');
const handwritingOcrRoutes = require('./routes/handwritingOcr.routes');
const medicineRoutes = require('./routes/medicine.routes');
const labReportRoutes = require('./routes/labReport.routes');
const onboardingRoutes = require('./routes/onboarding.routes');

// Services (auto-run on startup)
const { ensureInventoryPolicyDefaults } = require('./services/inventoryPolicyDefaults.service');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Make io accessible to routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP for HF Spaces compatibility
    xFrameOptions: false,         // Disable X-Frame-Options to allow embedding
}));

// CORS
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
    },
});
app.use('/api/', limiter);

// Body parser (increased limit for ID document images)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file serving for uploads (lab reports, etc.)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// HTTP request logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }));
}

// ============================================
// API ROUTES
// ============================================

// Root route - Welcome message (required for HF Spaces)
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'HIS Agentic Backend API',
        version: '1.0.0',
        environment: config.nodeEnv,
        endpoints: {
            health: '/api/health',
            docs: '/docs',
            api: '/api/v1/*'
        },
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hospital HIS API is running',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
    });
});

// Database Repair Endpoint (Fixes Missing Beds/Wards)
app.get('/api/seed-beds-fix', async (req, res) => {
    try {
        // 1. Ensure Departments Exist (Upsert)
        const departmentsData = [
            { departmentCode: 'DEPT-GEN', name: 'General Medicine', type: 'clinical' },
            { departmentCode: 'DEPT-CARD', name: 'Cardiology', type: 'clinical' },
            { departmentCode: 'DEPT-ORTH', name: 'Orthopedics', type: 'clinical' },
            { departmentCode: 'DEPT-PEDS', name: 'Pediatrics', type: 'clinical' },
            { departmentCode: 'DEPT-GYNO', name: 'Obstetrics & Gynecology', type: 'clinical' },
            { departmentCode: 'DEPT-EMRG', name: 'Emergency', type: 'clinical' },
        ];

        for (const d of departmentsData) {
            await Department.findOneAndUpdate({ departmentCode: d.departmentCode }, d, { upsert: true });
        }

        const departments = await Department.find();
        const genMedDept = departments.find(d => d.departmentCode === 'DEPT-GEN');
        const cardDept = departments.find(d => d.departmentCode === 'DEPT-CARD');
        const emergDept = departments.find(d => d.departmentCode === 'DEPT-EMRG');
        const pedsDept = departments.find(d => d.departmentCode === 'DEPT-PEDS');
        const gynoDept = departments.find(d => d.departmentCode === 'DEPT-GYNO');

        // 2. Define Wards
        const wardsData = [
            { wardCode: 'WRD-GEN-M', name: 'General Ward - Male', type: 'general', department: genMedDept?._id, floor: '1st', building: 'Main', totalBeds: 20 },
            { wardCode: 'WRD-GEN-F', name: 'General Ward - Female', type: 'general', department: genMedDept?._id, floor: '1st', building: 'Main', totalBeds: 20 },
            { wardCode: 'WRD-SEMI-M', name: 'Semi-Private Ward - Male', type: 'semi-private', department: genMedDept?._id, floor: '2nd', building: 'Main', totalBeds: 10 },
            { wardCode: 'WRD-SEMI-F', name: 'Semi-Private Ward - Female', type: 'semi-private', department: genMedDept?._id, floor: '2nd', building: 'Main', totalBeds: 10 },
            { wardCode: 'WRD-PVT', name: 'Private Rooms', type: 'private', department: genMedDept?._id, floor: '3rd', building: 'Main', totalBeds: 15 },
            { wardCode: 'WRD-ICU', name: 'Intensive Care Unit', type: 'icu', department: genMedDept?._id, floor: '2nd', building: 'Critical Care', totalBeds: 10 },
            { wardCode: 'WRD-CCU', name: 'Cardiac Care Unit', type: 'ccu', department: cardDept?._id, floor: '2nd', building: 'Critical Care', totalBeds: 8 },
            { wardCode: 'WRD-EMRG', name: 'Emergency Ward', type: 'emergency', department: emergDept?._id, floor: 'Ground', building: 'Emergency', totalBeds: 12 },
            { wardCode: 'WRD-PEDS', name: 'Pediatric Ward', type: 'pediatric', department: pedsDept?._id, floor: '1st', building: 'Main', totalBeds: 15 },
            { wardCode: 'WRD-NICU', name: 'Neonatal ICU', type: 'nicu', department: pedsDept?._id, floor: '1st', building: 'Critical Care', totalBeds: 6 },
            { wardCode: 'WRD-MAT', name: 'Maternity Ward', type: 'maternity', department: gynoDept?._id, floor: '3rd', building: 'Main', totalBeds: 20 },
        ];

        let bedsAdded = 0;

        // 3. Upsert Wards & Seed Beds
        for (const wData of wardsData) {
            if (!wData.department) continue;

            const ward = await Ward.findOneAndUpdate(
                { wardCode: wData.wardCode },
                wData,
                { upsert: true, new: true }
            );

            // Determine Bed Specs
            let bedType = BED_TYPES.GENERAL;
            let tariff = 1000;
            if (ward.type === 'private') { bedType = BED_TYPES.PRIVATE; tariff = 3000; }
            else if (ward.type.includes('icu') || ward.type === 'ccu') { bedType = BED_TYPES.ICU; tariff = 5000; }
            else if (ward.type === 'nicu') { bedType = BED_TYPES.NICU; tariff = 6000; }

            // Create Beds
            for (let i = 1; i <= ward.totalBeds; i++) {
                const bedNumber = `${ward.wardCode}-${String(i).padStart(2, '0')}`;
                const exists = await Bed.exists({ bedNumber });

                if (!exists) {
                    await Bed.create({
                        bedNumber,
                        ward: ward._id,
                        bedType,
                        status: BED_STATUS.AVAILABLE,
                        tariff,
                        lastCleanedAt: new Date()
                    });
                    bedsAdded++;
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Database Repair Complete. Added ${bedsAdded} beds.`,
            bedsAdded
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Swagger API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HIS Agentic API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true
    }
}));

// Serve swagger spec as JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/patients`, patientRoutes);
app.use(`${API_PREFIX}/opd`, opdRoutes);
app.use(`${API_PREFIX}/ipd`, ipdRoutes);
app.use(`${API_PREFIX}/emergency`, emergencyRoutes);
app.use(`${API_PREFIX}/emergency`, emergencyOrderSetRoutes);
app.use(`${API_PREFIX}/emr`, emrRoutes);
app.use(`${API_PREFIX}/prescriptions`, prescriptionRoutes);
app.use(`${API_PREFIX}/lab`, labRoutes);
app.use(`${API_PREFIX}/radiology`, radiologyRoutes);
app.use(`${API_PREFIX}/pharmacy`, pharmacyRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/insurance`, insuranceRoutes);
app.use(`${API_PREFIX}/surgery`, surgeryRoutes);
// app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/beds`, bedRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/tariffs`, tariffRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/nursing`, nursingRoutes);
app.use(`${API_PREFIX}/care-plans`, carePlanRoutes);
app.use(`${API_PREFIX}/nurse-assignments`, nurseAssignmentRoutes);
app.use(`${API_PREFIX}/admin/master`, masterdataRoutes);
app.use(`${API_PREFIX}/admin/users`, userManagementRoutes);
app.use(`${API_PREFIX}/admin/dashboard`, adminDashboardRoutes);
app.use(`${API_PREFIX}/admin/revenue-anomalies`, revenueAnomalyRoutes);
app.use(`${API_PREFIX}/break-glass`, breakGlassRoutes);
app.use(`${API_PREFIX}/admin/break-glass`, adminBreakGlassRoutes);
app.use(`${API_PREFIX}/inventory-manager`, inventoryManagerRoutes);
app.use(`${API_PREFIX}/clinical-coding`, clinicalCodingRoutes);
app.use(`${API_PREFIX}/incidents`, incidentRoutes);
app.use(`${API_PREFIX}/system-settings`, systemSettingsRoutes);
app.use(`${API_PREFIX}/department-billing`, departmentBillingRoutes);
app.use(`${API_PREFIX}/ocr`, handwritingOcrRoutes);
app.use(`${API_PREFIX}/medicines`, medicineRoutes);
app.use(`${API_PREFIX}/nursing`, nursingRoutes);
app.use(`${API_PREFIX}/lab-reports`, labReportRoutes);
app.use(`${API_PREFIX}/admin/onboarding`, onboardingRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`,
    });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join user to their personal room (for notifications)
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        logger.info(`User ${userId} joined personal room`);
    });

    // Join department room
    socket.on('join-department', (departmentId) => {
        socket.join(`department-${departmentId}`);
        logger.info(`Socket ${socket.id} joined department ${departmentId}`);
    });

    // Join ward room (for bed updates)
    socket.on('join-ward', (wardId) => {
        socket.join(`ward-${wardId}`);
        logger.info(`Socket ${socket.id} joined ward ${wardId}`);
    });

    // Join emergency room (for live ER dashboard)
    socket.on('join-emergency', () => {
        socket.join('emergency-room');
        logger.info(`Socket ${socket.id} joined emergency room`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = config.port;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Ensure inventory policy defaults are set (idempotent)
        await ensureInventoryPolicyDefaults();

        // Start HTTP server
        httpServer.listen(PORT, '0.0.0.0', () => {
            logger.info('═══════════════════════════════════════════════════════════════');
            logger.info('       HOSPITAL INFORMATION SYSTEM (HIS) BACKEND SERVER        ');
            logger.info('═══════════════════════════════════════════════════════════════');
            logger.info(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
            logger.info(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
            logger.info(`🔌 WebSocket enabled`);
            logger.info(`📋 Health check: http://localhost:${PORT}/api/health`);
            logger.info('═══════════════════════════════════════════════════════════════');
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app;
