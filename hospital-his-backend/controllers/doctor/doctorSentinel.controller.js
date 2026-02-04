/**
 * Doctor Sentinel Controller
 * Allows doctors to view patient health scores and signal history
 */

const asyncHandler = require('../../utils/asyncHandler');
const HealthScore = require('../../models/HealthScore');
const { Signal } = require('../../models/Signal');
const Patient = require('../../models/Patient');

/**
 * @desc    Get Sentinel Report for a specific patient
 * @route   GET /api/v1/doctor/sentinel/patient/:patientId
 * @access  Private (Doctor/Admin)
 */
exports.getPatientSentinelReport = asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // 1. Verify Patient Exists
    const patient = await Patient.findOne({ patientId: patientId });
    if (!patient) {
        return res.status(404).json({
            success: false,
            error: 'Patient not found',
        });
    }

    // 2. Get Latest Health Score
    const healthScore = await HealthScore.findOne({ patient: patient._id })
        .sort({ calculatedAt: -1 });

    // 3. Get Recent Signals (last 7 days)
    const recentSignals = await Signal.find({
        patient: patient._id,
        isActive: true,
    })
        .sort({ recordedAt: -1 })
        .limit(20);

    // 4. Construct Report
    const report = {
        patient: {
            id: patient.patientId,
            name: patient.fullName,
            age: patient.age,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
        },
        healthScore: healthScore ? {
            score: healthScore.score,
            trend: healthScore.trend,
            components: healthScore.components,
            summary: healthScore.summary,
            lastUpdated: healthScore.calculatedAt,
        } : null,
        activityLog: recentSignals,
    };

    res.status(200).json({
        success: true,
        data: report,
    });
});

/**
 * @desc    Get List of Patients with Declining Health
 * @route   GET /api/v1/doctor/sentinel/alerts
 * @access  Private (Doctor/Admin)
 */
exports.getAtRiskPatients = asyncHandler(async (req, res) => {
    // Find latest scores where trend is declining or score < 60
    // This is a simplified query; in production would need aggregation for "latest per patient"

    // For MVP, we'll fetch all scores from last 24h and filter in memory or straightforward query
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const scores = await HealthScore.find({
        calculatedAt: { $gte: oneDayAgo },
        $or: [
            { 'trend.direction': 'declining' },
            { score: { $lt: 60 } }
        ]
    }).populate('patient', 'patientId firstName lastName');

    // Deduplicate (in case multiple calculations per day) - map by patient ID
    const atRiskMap = new Map();
    scores.forEach(score => {
        if (!atRiskMap.has(score.patient._id.toString())) {
            atRiskMap.set(score.patient._id.toString(), {
                patient: {
                    id: score.patient.patientId,
                    name: `${score.patient.firstName} ${score.patient.lastName}`,
                },
                score: score.score,
                trend: score.trend,
                updatedAt: score.calculatedAt,
            });
        }
    });

    res.status(200).json({
        success: true,
        count: atRiskMap.size,
        data: Array.from(atRiskMap.values()),
    });
});
