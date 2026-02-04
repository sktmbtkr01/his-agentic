/**
 * Patient Signals Controller
 * Handles health signal logging (symptoms, mood, lifestyle, vitals)
 */

const asyncHandler = require('../../utils/asyncHandler');
const { Signal, SIGNAL_CATEGORIES, COMMON_SYMPTOMS, MOOD_TYPES, SYMPTOM_SEVERITY, ACTIVITY_TYPES } = require('../../models/Signal');
const { calculateHealthScore } = require('../../services/healthScore.service');

/**
 * @desc    Log a new health signal
 * @route   POST /api/v1/patient/signals
 * @access  Private (Patient)
 */
exports.logSignal = asyncHandler(async (req, res) => {
    const { category, recordedAt, symptom, mood, lifestyle, vitals, notes } = req.body;

    // Validate category
    if (!category || !Object.values(SIGNAL_CATEGORIES).includes(category)) {
        return res.status(400).json({
            success: false,
            error: `Invalid category. Must be one of: ${Object.values(SIGNAL_CATEGORIES).join(', ')}`,
        });
    }

    // Build signal data
    const signalData = {
        patient: req.patient._id,
        category,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        source: 'patient_app',
    };

    // Add category-specific data
    switch (category) {
        case SIGNAL_CATEGORIES.SYMPTOM:
            if (!symptom?.type) {
                return res.status(400).json({
                    success: false,
                    error: 'Symptom type is required',
                });
            }
            signalData.symptom = {
                type: symptom.type,
                severity: symptom.severity || 'moderate',
                duration: symptom.duration,
                notes: symptom.notes || notes,
            };
            break;

        case SIGNAL_CATEGORIES.MOOD:
            if (!mood?.type) {
                return res.status(400).json({
                    success: false,
                    error: 'Mood type is required',
                });
            }
            signalData.mood = {
                type: mood.type,
                stressLevel: mood.stressLevel,
                notes: mood.notes || notes,
            };
            break;

        case SIGNAL_CATEGORIES.LIFESTYLE:
            signalData.lifestyle = {
                sleep: lifestyle?.sleep,
                activity: lifestyle?.activity,
                hydration: lifestyle?.hydration,
                meals: lifestyle?.meals,
                notes: lifestyle?.notes || notes,
            };
            break;

        case SIGNAL_CATEGORIES.VITALS:
            signalData.vitals = {
                bloodPressure: vitals?.bloodPressure,
                heartRate: vitals?.heartRate,
                temperature: vitals?.temperature,
                bloodSugar: vitals?.bloodSugar,
                weight: vitals?.weight,
                oxygenSaturation: vitals?.oxygenSaturation,
                notes: vitals?.notes || notes,
            };
            break;
    }

    const signal = await Signal.create(signalData);

    // Recalculate health score
    await calculateHealthScore(req.patient._id);

    res.status(201).json({
        success: true,
        message: 'Signal logged successfully',
        data: signal,
    });
});

/**
 * @desc    Get patient's signals with pagination and filters
 * @route   GET /api/v1/patient/signals
 * @access  Private (Patient)
 */
exports.getSignals = asyncHandler(async (req, res) => {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const result = await Signal.getPatientSignals(req.patient._id, {
        category,
        startDate,
        endDate,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    });

    res.status(200).json({
        success: true,
        data: result.signals,
        pagination: result.pagination,
    });
});

/**
 * @desc    Get signal by ID
 * @route   GET /api/v1/patient/signals/:id
 * @access  Private (Patient)
 */
exports.getSignalById = asyncHandler(async (req, res) => {
    const signal = await Signal.findOne({
        _id: req.params.id,
        patient: req.patient._id,
        isActive: true,
    });

    if (!signal) {
        return res.status(404).json({
            success: false,
            error: 'Signal not found',
        });
    }

    res.status(200).json({
        success: true,
        data: signal,
    });
});

/**
 * @desc    Delete a signal (soft delete)
 * @route   DELETE /api/v1/patient/signals/:id
 * @access  Private (Patient)
 */
exports.deleteSignal = asyncHandler(async (req, res) => {
    const signal = await Signal.findOne({
        _id: req.params.id,
        patient: req.patient._id,
        isActive: true,
    });

    if (!signal) {
        return res.status(404).json({
            success: false,
            error: 'Signal not found',
        });
    }

    // Soft delete
    signal.isActive = false;
    await signal.save();

    res.status(200).json({
        success: true,
        message: 'Signal deleted successfully',
    });
});

/**
 * @desc    Get signal summary for dashboard
 * @route   GET /api/v1/patient/signals/summary
 * @access  Private (Patient)
 */
exports.getSignalSummary = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;

    const summary = await Signal.getPatientSignalSummary(req.patient._id, parseInt(days, 10));

    // Get recent signals for each category
    const recentSignals = await Signal.find({
        patient: req.patient._id,
        isActive: true,
    })
        .sort({ recordedAt: -1 })
        .limit(10);

    res.status(200).json({
        success: true,
        data: {
            summary,
            recentSignals,
        },
    });
});

/**
 * @desc    Get available options for signal logging
 * @route   GET /api/v1/patient/signals/options
 * @access  Private (Patient)
 */
exports.getSignalOptions = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            categories: SIGNAL_CATEGORIES,
            symptoms: COMMON_SYMPTOMS,
            severities: SYMPTOM_SEVERITY,
            moods: MOOD_TYPES,
            activityTypes: ACTIVITY_TYPES,
            sleepQualities: ['poor', 'fair', 'good', 'excellent'],
            mealQualities: ['poor', 'fair', 'good', 'excellent'],
            bloodSugarTypes: ['fasting', 'random', 'postprandial'],
        },
    });
});

/**
 * @desc    Batch log multiple signals (for quick logging)
 * @route   POST /api/v1/patient/signals/batch
 * @access  Private (Patient)
 */
exports.batchLogSignals = asyncHandler(async (req, res) => {
    const { signals } = req.body;

    if (!signals || !Array.isArray(signals) || signals.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Signals array is required',
        });
    }

    if (signals.length > 10) {
        return res.status(400).json({
            success: false,
            error: 'Maximum 10 signals can be logged at once',
        });
    }

    const createdSignals = [];
    const errors = [];

    for (let i = 0; i < signals.length; i++) {
        try {
            const signalData = {
                ...signals[i],
                patient: req.patient._id,
                source: 'patient_app',
            };
            const signal = await Signal.create(signalData);
            createdSignals.push(signal);
        } catch (err) {
            errors.push({
                index: i,
                error: err.message,
            });
        }
    }

    // Recalculate health score if any signals were logged
    if (createdSignals.length > 0) {
        await calculateHealthScore(req.patient._id);
    }

    res.status(201).json({
        success: true,
        message: `${createdSignals.length} signals logged successfully`,
        data: createdSignals,
        errors: errors.length > 0 ? errors : undefined,
    });
});
