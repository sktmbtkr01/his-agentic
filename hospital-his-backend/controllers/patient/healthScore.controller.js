/**
 * Health Score Controller
 * Handles requests for patient health scores
 */

const asyncHandler = require('../../utils/asyncHandler');
const { getOrCalculateScore } = require('../../services/healthScore.service');
const HealthScore = require('../../models/HealthScore');

/**
 * @desc    Get current health score (calculates if necessary)
 * @route   GET /api/v1/patient/score
 * @access  Private (Patient)
 */
exports.getLatestScore = asyncHandler(async (req, res) => {
    const score = await getOrCalculateScore(req.patient._id);

    res.status(200).json({
        success: true,
        data: score,
    });
});

/**
 * @desc    Get score history (last 30 days)
 * @route   GET /api/v1/patient/score/history
 * @access  Private (Patient)
 */
exports.getScoreHistory = asyncHandler(async (req, res) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const history = await HealthScore.find({
        patient: req.patient._id,
        calculatedAt: { $gte: startDate, $lte: endDate },
    })
        .sort({ calculatedAt: 1 }) // Chronological for charts
        .select('score calculatedAt trend');

    res.status(200).json({
        success: true,
        count: history.length,
        data: history,
    });
});
