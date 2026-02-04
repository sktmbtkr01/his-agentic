/**
 * Patient Authentication Middleware
 * Handles JWT verification for patient portal routes
 */

const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/config');

/**
 * Protect patient routes - Verify patient JWT token
 */
exports.authenticatePatient = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret);

        // Ensure this is a patient token
        if (decoded.type !== 'patient') {
            return next(new ErrorResponse('Not authorized - invalid token type', 401));
        }

        // Get patient from token
        req.patient = await Patient.findById(decoded.patientId);

        if (!req.patient) {
            return next(new ErrorResponse('Patient not found', 404));
        }

        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

/**
 * Optional patient authentication - doesn't fail if no token
 */
exports.optionalPatientAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            if (decoded.type === 'patient') {
                req.patient = await Patient.findById(decoded.patientId);
            }
        } catch (err) {
            // Token invalid, but continue without patient
        }
    }

    next();
});
