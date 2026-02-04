/**
 * Patient Authentication Controller
 * Handles patient login via Patient ID + DOB
 */

const Patient = require('../../models/Patient');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');

// Store patient refresh tokens (in production, use a separate model or Redis)
const patientRefreshTokens = new Map();

/**
 * @desc    Login patient using Patient ID + Date of Birth
 * @route   POST /api/patient/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
    const { patientId, dateOfBirth } = req.body;

    // Validate input
    if (!patientId || !dateOfBirth) {
        return next(new ErrorResponse('Please provide Patient ID and Date of Birth', 400));
    }

    // Find patient by ID
    const patient = await Patient.findOne({ patientId: patientId.toUpperCase() });

    if (!patient) {
        return next(new ErrorResponse('Invalid Patient ID', 401));
    }

    // Verify date of birth matches
    const inputDOB = new Date(dateOfBirth);
    const patientDOB = new Date(patient.dateOfBirth);
    
    // Compare dates (ignoring time)
    const dobMatch = 
        inputDOB.getFullYear() === patientDOB.getFullYear() &&
        inputDOB.getMonth() === patientDOB.getMonth() &&
        inputDOB.getDate() === patientDOB.getDate();

    if (!dobMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Generate tokens
    sendPatientTokenResponse(patient, 200, res);
});

/**
 * @desc    Refresh patient access token
 * @route   POST /api/patient/auth/refresh
 * @access  Public
 */
exports.refresh = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new ErrorResponse('Refresh token is required', 400));
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.jwtSecret);

        // Check if token is a patient token
        if (decoded.type !== 'patient') {
            return next(new ErrorResponse('Invalid refresh token', 401));
        }

        // Verify token exists in our store
        const storedToken = patientRefreshTokens.get(decoded.patientId);
        if (storedToken !== refreshToken) {
            return next(new ErrorResponse('Invalid refresh token', 401));
        }

        // Find patient
        const patient = await Patient.findById(decoded.patientId);
        if (!patient) {
            return next(new ErrorResponse('Patient not found', 404));
        }

        // Generate new tokens
        sendPatientTokenResponse(patient, 200, res);
    } catch (err) {
        return next(new ErrorResponse('Invalid refresh token', 401));
    }
});

/**
 * @desc    Logout patient (invalidate refresh token)
 * @route   POST /api/patient/auth/logout
 * @access  Private (Patient)
 */
exports.logout = asyncHandler(async (req, res, next) => {
    // Remove refresh token from store
    patientRefreshTokens.delete(req.patient._id.toString());

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});

/**
 * @desc    Get current patient profile
 * @route   GET /api/patient/profile
 * @access  Private (Patient)
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
    const patient = await Patient.findById(req.patient._id);

    if (!patient) {
        return next(new ErrorResponse('Patient not found', 404));
    }

    res.status(200).json({
        success: true,
        data: {
            id: patient._id,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            fullName: patient.fullName,
            dateOfBirth: patient.dateOfBirth,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            bloodGroup: patient.bloodGroup,
            emergencyContact: patient.emergencyContact,
        },
    });
});

/**
 * @desc    Update patient profile (contact info only)
 * @route   PUT /api/patient/profile
 * @access  Private (Patient)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
    // Only allow updating certain fields
    const allowedFields = ['phone', 'email', 'address', 'emergencyContact'];
    const updates = {};

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    const patient = await Patient.findByIdAndUpdate(
        req.patient._id,
        updates,
        { new: true, runValidators: true }
    );

    if (!patient) {
        return next(new ErrorResponse('Patient not found', 404));
    }

    res.status(200).json({
        success: true,
        data: {
            id: patient._id,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            fullName: patient.fullName,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            emergencyContact: patient.emergencyContact,
        },
    });
});

// Helper function to generate and send tokens
const sendPatientTokenResponse = async (patient, statusCode, res) => {
    // Create access token (short-lived)
    const accessToken = jwt.sign(
        { 
            patientId: patient._id, 
            type: 'patient' 
        }, 
        config.jwtSecret, 
        { expiresIn: config.jwtExpire || '1h' }
    );

    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
        { 
            patientId: patient._id, 
            type: 'patient' 
        }, 
        config.jwtSecret, 
        { expiresIn: config.jwtRefreshExpire || '7d' }
    );

    // Store refresh token
    patientRefreshTokens.set(patient._id.toString(), refreshToken);

    res.status(statusCode).json({
        success: true,
        accessToken,
        refreshToken,
        patient: {
            id: patient._id,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            fullName: patient.fullName,
            age: patient.age,
            gender: patient.gender,
        },
    });
};
