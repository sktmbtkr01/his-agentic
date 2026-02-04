/**
 * Analytics Controller
 * Aggregates patient health data for LifeLens 360 dashboard
 */
const { Signal: PatientReference } = require('../../models/Signal'); // Mapped to Signal model
const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');

/**
 * @desc    Get health trends (Vitals, Mood, Sleep)
 * @route   GET /api/v1/patient/analytics/trends
 * @access  Private (Patient)
 */
exports.getHealthTrends = asyncHandler(async (req, res, next) => {
    const { range = '30d' } = req.query;
    const patientId = req.patient._id;

    // Calculate start date
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date();

    if (range === '7d') startDate.setDate(today.getDate() - 7);
    else if (range === '3m') startDate.setDate(today.getDate() - 90);
    else startDate.setDate(today.getDate() - 30); // Default 30d

    startDate.setHours(0, 0, 0, 0);



    // Aggregate Vitals (Group by Date)
    const vitalsAggregation = await PatientReference.aggregate([
        {
            $match: {
                patient: patientId,
                category: 'vitals',
                recordedAt: { $gte: startDate, $lte: today }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$recordedAt" } },
                avgSystolic: { $avg: "$vitals.bloodPressure.systolic" },
                avgDiastolic: { $avg: "$vitals.bloodPressure.diastolic" },
                avgHeartRate: { $avg: "$vitals.heartRate" },
                avgWeight: { $avg: "$vitals.weight" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Aggregate Mood (Map types to scores)
    const moodAggregation = await PatientReference.aggregate([
        {
            $match: {
                patient: patientId,
                category: 'mood',
                recordedAt: { $gte: startDate, $lte: today }
            }
        },
        {
            $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$recordedAt" } },
                score: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$mood.type", "great"] }, then: 5 },
                            { case: { $eq: ["$mood.type", "good"] }, then: 4 },
                            { case: { $eq: ["$mood.type", "okay"] }, then: 3 },
                            { case: { $eq: ["$mood.type", "low"] }, then: 2 },
                            { case: { $eq: ["$mood.type", "bad"] }, then: 1 }
                        ],
                        default: 3
                    }
                },
                stressLevel: "$mood.stressLevel"
            }
        },
        {
            $group: {
                _id: "$date",
                avgMoodScore: { $avg: "$score" },
                avgStressLevel: { $avg: "$stressLevel" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Aggregate Sleep (From Lifestyle)
    const sleepAggregation = await PatientReference.aggregate([
        {
            $match: {
                patient: patientId,
                category: 'lifestyle',
                "lifestyle.sleep.duration": { $exists: true },
                recordedAt: { $gte: startDate, $lte: today }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$recordedAt" } },
                avgSleepHours: { $avg: "$lifestyle.sleep.duration" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Merge by Date for Unified Frontend Charting
    // We want a complete list of dates
    const dateMap = {};
    const dayMs = 24 * 60 * 60 * 1000;

    // Initialize date map
    for (let d = new Date(startDate); d <= today; d = new Date(d.getTime() + dayMs)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap[dateStr] = { date: dateStr };
    }

    // Merge Vitals
    vitalsAggregation.forEach(item => {
        if (dateMap[item._id]) {
            dateMap[item._id].systolic = Math.round(item.avgSystolic);
            dateMap[item._id].diastolic = Math.round(item.avgDiastolic);
            dateMap[item._id].heartRate = Math.round(item.avgHeartRate);
            dateMap[item._id].weight = item.avgWeight ? parseFloat(item.avgWeight.toFixed(1)) : null;
        }
    });

    // Merge Mood
    moodAggregation.forEach(item => {
        if (dateMap[item._id]) {
            dateMap[item._id].moodScore = parseFloat(item.avgMoodScore.toFixed(1));
            dateMap[item._id].stressLevel = Math.round(item.avgStressLevel);
        }
    });

    // Merge Sleep
    sleepAggregation.forEach(item => {
        if (dateMap[item._id]) {
            dateMap[item._id].sleepHours = parseFloat(item.avgSleepHours.toFixed(1));
        }
    });



    const trendData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // Generate Basic Insight (Mocked for speed, could use LLM)
    const insights = [];

    // Check for recent BP trend
    const recentVitals = trendData.filter(d => d.systolic).slice(-5);
    if (recentVitals.length >= 3) {
        const avgSys = recentVitals.reduce((sum, d) => sum + d.systolic, 0) / recentVitals.length;
        if (avgSys > 130) insights.push({ type: 'alert', message: 'Your recent blood pressure trend is slightly elevated.' });
        else if (avgSys < 120) insights.push({ type: 'success', message: 'Your blood pressure has been optimal this week!' });
    }

    // Check Sleep/Mood Correlation (simple heuristic)
    const sleepMood = trendData.filter(d => d.sleepHours && d.moodScore);
    if (sleepMood.length >= 3) {
        // Simple checking: if worst mood coincides with low sleep
        const badDays = sleepMood.filter(d => d.moodScore <= 2 && d.sleepHours < 6);
        if (badDays.length > 0) {
            insights.push({ type: 'info', message: 'You tend to report lower mood on days with less than 6 hours of sleep.' });
        }
    }

    res.status(200).json({
        success: true,
        data: {
            trends: trendData,
            insights: insights,
            range: range
        }
    });
});
