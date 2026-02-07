/**
 * Predictive Intelligence Service
 * Phase 4: Trend Analysis & Anomaly Detection
 * 
 * Provides:
 * - Time-series trend analysis for health metrics
 * - Anomaly detection for vitals and signals
 * - Proactive alert generation
 */

const { Signal, SIGNAL_CATEGORIES, SYMPTOM_SEVERITY, MOOD_TYPES } = require('../models/Signal');
const HealthScore = require('../models/HealthScore');
const { HealthAlert, ALERT_TYPES, ALERT_SEVERITY, ALERT_STATUS } = require('../models/HealthAlert');
const Patient = require('../models/Patient');

// Configuration
const CONFIG = {
    // Analysis windows
    TREND_WINDOW_DAYS: 7,
    ANOMALY_WINDOW_DAYS: 14,
    SHORT_TERM_HOURS: 24,

    // Thresholds
    SCORE_DECLINE_THRESHOLD: 15, // % decline to trigger alert
    VITAL_DEVIATION_THRESHOLD: 2, // Standard deviations
    SYMPTOM_RECURRENCE_THRESHOLD: 3, // Times in window
    MOOD_DECLINE_THRESHOLD: 2, // Consecutive bad moods

    // Vital ranges (normal for adults)
    VITAL_RANGES: {
        heartRate: { min: 60, max: 100, criticalMin: 40, criticalMax: 150 },
        bloodPressureSystolic: { min: 90, max: 120, criticalMin: 70, criticalMax: 180 },
        bloodPressureDiastolic: { min: 60, max: 80, criticalMin: 40, criticalMax: 120 },
        oxygenSaturation: { min: 95, max: 100, criticalMin: 90, criticalMax: 100 },
        temperature: { min: 36.1, max: 37.2, criticalMin: 35, criticalMax: 39 },
        bloodSugar: { min: 70, max: 140, criticalMin: 50, criticalMax: 300 },
    },

    // Alert expiration (hours)
    ALERT_EXPIRY_HOURS: {
        [ALERT_SEVERITY.CRITICAL]: 12,
        [ALERT_SEVERITY.HIGH]: 24,
        [ALERT_SEVERITY.MEDIUM]: 48,
        [ALERT_SEVERITY.LOW]: 72,
    },
};

/**
 * Calculate statistical measures for a dataset
 */
const calculateStats = (values) => {
    if (!values || values.length === 0) {
        return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
    }

    const count = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / count;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(avgSquareDiff);

    return {
        mean: Math.round(mean * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
        count,
    };
};

/**
 * Calculate trend direction and magnitude
 */
const calculateTrend = (dataPoints) => {
    if (!dataPoints || dataPoints.length < 2) {
        return { direction: 'stable', percentChange: 0, slope: 0 };
    }

    // Sort by timestamp
    const sorted = [...dataPoints].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Calculate linear regression slope
    const n = sorted.length;
    const xSum = sorted.reduce((sum, _, i) => sum + i, 0);
    const ySum = sorted.reduce((sum, dp) => sum + dp.value, 0);
    const xySum = sorted.reduce((sum, dp, i) => sum + i * dp.value, 0);
    const x2Sum = sorted.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

    // Calculate percent change
    const firstValue = sorted[0].value;
    const lastValue = sorted[sorted.length - 1].value;
    const percentChange = firstValue !== 0 ?
        ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Determine direction
    let direction = 'stable';
    if (Math.abs(percentChange) > 5) {
        direction = percentChange > 0 ? 'increasing' : 'decreasing';
    } else if (Math.abs(slope) > 0.5) {
        direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Check for volatility
    const stats = calculateStats(sorted.map(dp => dp.value));
    const coefficientOfVariation = stats.mean !== 0 ?
        (stats.stdDev / stats.mean) * 100 : 0;
    if (coefficientOfVariation > 30) {
        direction = 'volatile';
    }

    return {
        direction,
        percentChange: Math.round(percentChange * 100) / 100,
        slope: Math.round(slope * 1000) / 1000,
    };
};

/**
 * Detect anomalies using statistical methods (Z-score)
 */
const detectAnomalies = (values, threshold = CONFIG.VITAL_DEVIATION_THRESHOLD) => {
    if (!values || values.length < 3) {
        return [];
    }

    const stats = calculateStats(values.map(v => v.value));
    const anomalies = [];

    values.forEach((point, index) => {
        const zScore = stats.stdDev !== 0 ?
            (point.value - stats.mean) / stats.stdDev : 0;

        if (Math.abs(zScore) > threshold) {
            anomalies.push({
                index,
                value: point.value,
                timestamp: point.timestamp,
                zScore: Math.round(zScore * 100) / 100,
                deviation: zScore > 0 ? 'high' : 'low',
            });
        }
    });

    return anomalies;
};

/**
 * Analyze vital signs trends
 */
const analyzeVitalTrends = async (patientId, days = CONFIG.TREND_WINDOW_DAYS) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const signals = await Signal.find({
        patient: patientId,
        category: SIGNAL_CATEGORIES.VITALS,
        isActive: true,
        recordedAt: { $gte: startDate },
    }).sort({ recordedAt: 1 });

    const trends = {};

    // Group by vital type
    const vitalTypes = ['heartRate', 'bloodPressure', 'oxygenSaturation', 'temperature', 'bloodSugar'];

    for (const vitalType of vitalTypes) {
        const dataPoints = signals
            .filter(s => s.vitals && s.vitals[vitalType] !== undefined)
            .map(s => {
                let value;
                if (vitalType === 'bloodPressure' && s.vitals.bloodPressure) {
                    value = s.vitals.bloodPressure.systolic; // Use systolic for trending
                } else if (vitalType === 'bloodSugar' && s.vitals.bloodSugar) {
                    value = s.vitals.bloodSugar.value;
                } else {
                    value = s.vitals[vitalType];
                }
                return {
                    timestamp: s.recordedAt,
                    value,
                };
            })
            .filter(dp => dp.value !== undefined && dp.value !== null);

        if (dataPoints.length > 0) {
            const stats = calculateStats(dataPoints.map(dp => dp.value));
            const trend = calculateTrend(dataPoints);
            const anomalies = detectAnomalies(dataPoints);

            trends[vitalType] = {
                dataPoints,
                stats,
                trend,
                anomalies,
                latestValue: dataPoints[dataPoints.length - 1]?.value,
            };
        }
    }

    return trends;
};

/**
 * Analyze symptom patterns
 */
const analyzeSymptomPatterns = async (patientId, days = CONFIG.ANOMALY_WINDOW_DAYS) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const symptoms = await Signal.find({
        patient: patientId,
        category: SIGNAL_CATEGORIES.SYMPTOM,
        isActive: true,
        recordedAt: { $gte: startDate },
    }).sort({ recordedAt: -1 });

    // Group symptoms by type
    const symptomCounts = {};
    const severityTrends = {};

    symptoms.forEach(s => {
        const type = s.symptom?.type;
        const severity = s.symptom?.severity;

        if (type) {
            if (!symptomCounts[type]) {
                symptomCounts[type] = {
                    count: 0,
                    severities: { mild: 0, moderate: 0, severe: 0 },
                    occurrences: [],
                };
            }
            symptomCounts[type].count++;
            if (severity) {
                symptomCounts[type].severities[severity]++;
            }
            symptomCounts[type].occurrences.push({
                timestamp: s.recordedAt,
                severity,
            });
        }
    });

    // Identify recurring symptoms
    const recurringSymptoms = Object.entries(symptomCounts)
        .filter(([_, data]) => data.count >= CONFIG.SYMPTOM_RECURRENCE_THRESHOLD)
        .map(([type, data]) => ({
            type,
            count: data.count,
            severities: data.severities,
            trend: calculateTrend(
                data.occurrences.map((o, i) => ({
                    timestamp: o.timestamp,
                    value: o.severity === 'severe' ? 3 : o.severity === 'moderate' ? 2 : 1,
                }))
            ),
        }));

    // Identify symptom clusters (multiple symptoms in short window)
    const clusters = [];
    const windowHours = 24;

    for (let i = 0; i < symptoms.length; i++) {
        const windowEnd = new Date(symptoms[i].recordedAt);
        const windowStart = new Date(windowEnd);
        windowStart.setHours(windowStart.getHours() - windowHours);

        const clusterSymptoms = symptoms.filter(
            s => s.recordedAt >= windowStart && s.recordedAt <= windowEnd
        );

        if (clusterSymptoms.length >= 2) {
            const types = [...new Set(clusterSymptoms.map(s => s.symptom?.type))];
            if (types.length >= 2) {
                clusters.push({
                    timestamp: windowEnd,
                    symptoms: types,
                    count: clusterSymptoms.length,
                });
            }
        }
    }

    return {
        symptomCounts,
        recurringSymptoms,
        clusters: clusters.slice(0, 5), // Limit to recent clusters
        totalSymptoms: symptoms.length,
    };
};

/**
 * Analyze mood trends
 */
const analyzeMoodTrends = async (patientId, days = CONFIG.TREND_WINDOW_DAYS) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moods = await Signal.find({
        patient: patientId,
        category: SIGNAL_CATEGORIES.MOOD,
        isActive: true,
        recordedAt: { $gte: startDate },
    }).sort({ recordedAt: 1 });

    // Map mood types to numeric values
    const moodValues = {
        great: 5,
        good: 4,
        okay: 3,
        low: 2,
        bad: 1,
    };

    const dataPoints = moods
        .filter(m => m.mood?.type)
        .map(m => ({
            timestamp: m.recordedAt,
            value: moodValues[m.mood.type] || 3,
            type: m.mood.type,
            stressLevel: m.mood.stressLevel,
        }));

    if (dataPoints.length === 0) {
        return { trend: { direction: 'stable' }, stats: {}, dataPoints: [] };
    }

    const stats = calculateStats(dataPoints.map(dp => dp.value));
    const trend = calculateTrend(dataPoints);

    // Check for consecutive bad moods
    let consecutiveBad = 0;
    let maxConsecutiveBad = 0;

    for (const dp of dataPoints) {
        if (dp.value <= 2) {
            consecutiveBad++;
            maxConsecutiveBad = Math.max(maxConsecutiveBad, consecutiveBad);
        } else {
            consecutiveBad = 0;
        }
    }

    // Calculate average stress
    const stressValues = dataPoints.filter(dp => dp.stressLevel).map(dp => dp.stressLevel);
    const avgStress = stressValues.length > 0 ?
        stressValues.reduce((a, b) => a + b, 0) / stressValues.length : null;

    return {
        trend,
        stats,
        dataPoints,
        consecutiveBadMoods: maxConsecutiveBad,
        averageStress: avgStress ? Math.round(avgStress * 10) / 10 : null,
        moodDistribution: dataPoints.reduce((acc, dp) => {
            acc[dp.type] = (acc[dp.type] || 0) + 1;
            return acc;
        }, {}),
    };
};

/**
 * Analyze health score trends
 */
const analyzeHealthScoreTrends = async (patientId, days = CONFIG.TREND_WINDOW_DAYS) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const scores = await HealthScore.find({
        patient: patientId,
        calculatedAt: { $gte: startDate },
    }).sort({ calculatedAt: 1 });

    if (scores.length === 0) {
        return { trend: { direction: 'stable' }, stats: {}, scores: [] };
    }

    const dataPoints = scores.map(s => ({
        timestamp: s.calculatedAt,
        value: s.score,
        components: s.components,
    }));

    const stats = calculateStats(dataPoints.map(dp => dp.value));
    const trend = calculateTrend(dataPoints);

    // Calculate component trends
    const componentTrends = {};
    const componentNames = ['symptomScore', 'moodScore', 'lifestyleScore', 'vitalsScore'];

    for (const component of componentNames) {
        const componentPoints = dataPoints
            .filter(dp => dp.components && dp.components[component] !== undefined)
            .map(dp => ({
                timestamp: dp.timestamp,
                value: dp.components[component],
            }));

        if (componentPoints.length > 0) {
            componentTrends[component] = calculateTrend(componentPoints);
        }
    }

    // Check for significant decline
    const firstScore = dataPoints[0]?.value;
    const lastScore = dataPoints[dataPoints.length - 1]?.value;
    const decline = firstScore && lastScore ?
        ((firstScore - lastScore) / firstScore) * 100 : 0;

    return {
        trend,
        stats,
        dataPoints,
        componentTrends,
        significantDecline: decline >= CONFIG.SCORE_DECLINE_THRESHOLD,
        declinePercent: Math.round(decline * 100) / 100,
        latestScore: lastScore,
    };
};

/**
 * Generate alerts based on analysis
 */
const generateAlerts = async (patientId, analysis) => {
    const alerts = [];
    const patient = await Patient.findById(patientId);
    const patientName = patient?.firstName || 'there';

    // 1. Check vital anomalies
    for (const [vitalType, data] of Object.entries(analysis.vitalTrends || {})) {
        if (data.anomalies && data.anomalies.length > 0) {
            const latestAnomaly = data.anomalies[data.anomalies.length - 1];
            const range = CONFIG.VITAL_RANGES[vitalType] ||
                CONFIG.VITAL_RANGES[vitalType + 'Systolic'];

            // Determine severity
            let severity = ALERT_SEVERITY.MEDIUM;
            if (range) {
                if (latestAnomaly.value < range.criticalMin || latestAnomaly.value > range.criticalMax) {
                    severity = ALERT_SEVERITY.CRITICAL;
                } else if (latestAnomaly.value < range.min || latestAnomaly.value > range.max) {
                    severity = ALERT_SEVERITY.HIGH;
                }
            }

            const vitalNames = {
                heartRate: 'heart rate',
                bloodPressure: 'blood pressure',
                oxygenSaturation: 'oxygen saturation',
                temperature: 'temperature',
                bloodSugar: 'blood sugar',
            };

            alerts.push({
                type: ALERT_TYPES.VITAL_ANOMALY,
                severity,
                title: `Unusual ${vitalNames[vitalType] || vitalType} reading`,
                message: `Hey ${patientName}, your ${vitalNames[vitalType] || vitalType} reading of ${latestAnomaly.value} is ${latestAnomaly.deviation === 'high' ? 'higher' : 'lower'} than your usual range. ${severity === ALERT_SEVERITY.CRITICAL ? 'Please consult a doctor soon.' : 'Keep monitoring and log if it persists.'}`,
                context: {
                    metric: vitalType,
                    currentValue: latestAnomaly.value,
                    expectedRange: range ? { min: range.min, max: range.max } : null,
                    confidence: Math.min(100, Math.abs(latestAnomaly.zScore) * 30),
                    dataPoints: data.dataPoints.slice(-7),
                },
                recommendations: [
                    {
                        type: 'log_signal',
                        action: 'Log your current vitals',
                        route: '/log/vitals',
                        priority: 1,
                    },
                    ...(severity === ALERT_SEVERITY.CRITICAL ? [{
                        type: 'consult_doctor',
                        action: 'Schedule a consultation',
                        route: '/appointments/book',
                        priority: 2,
                    }] : []),
                ],
            });
        }

        // Check for concerning vital trends
        if (data.trend && data.trend.direction !== 'stable' && Math.abs(data.trend.percentChange) > 15) {
            alerts.push({
                type: ALERT_TYPES.VITAL_TREND,
                severity: ALERT_SEVERITY.MEDIUM,
                title: `${data.trend.direction === 'increasing' ? 'Rising' : 'Declining'} ${vitalType} trend`,
                message: `Your ${vitalType} has ${data.trend.direction === 'increasing' ? 'increased' : 'decreased'} by ${Math.abs(data.trend.percentChange)}% over the past week. ${data.trend.direction === 'volatile' ? 'The readings are also quite variable.' : ''}`,
                context: {
                    metric: vitalType,
                    trend: data.trend,
                    dataPoints: data.dataPoints.slice(-7),
                },
                recommendations: [{
                    type: 'monitor',
                    action: 'Continue tracking your vitals',
                    route: '/device-sync',
                    priority: 1,
                }],
            });
        }
    }

    // 2. Check recurring symptoms
    for (const symptom of analysis.symptomPatterns?.recurringSymptoms || []) {
        const hasSevere = symptom.severities.severe > 0;

        alerts.push({
            type: ALERT_TYPES.CHRONIC_SYMPTOM,
            severity: hasSevere ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
            title: `Recurring ${symptom.type.replace('_', ' ')}`,
            message: `You've logged ${symptom.type.replace('_', ' ')} ${symptom.count} times in the past 2 weeks. ${hasSevere ? 'Some episodes were severe.' : ''} Consider discussing this pattern with your doctor.`,
            context: {
                metric: symptom.type,
                currentValue: symptom.count,
                trend: symptom.trend,
            },
            recommendations: [
                {
                    type: 'consult_doctor',
                    action: 'Discuss with your doctor',
                    route: '/appointments/book',
                    priority: 1,
                },
                {
                    type: 'log_signal',
                    action: 'Track symptom details',
                    route: '/log/symptom',
                    priority: 2,
                },
            ],
        });
    }

    // 3. Check mood decline
    const moodAnalysis = analysis.moodTrends;
    if (moodAnalysis?.consecutiveBadMoods >= CONFIG.MOOD_DECLINE_THRESHOLD) {
        alerts.push({
            type: ALERT_TYPES.MOOD_DECLINE,
            severity: ALERT_SEVERITY.HIGH,
            title: 'Your mood seems low lately',
            message: `I noticed you've been feeling down for ${moodAnalysis.consecutiveBadMoods} days in a row. Remember, it's okay to have tough days. Would you like to talk about it or log how you're feeling?`,
            context: {
                metric: 'mood',
                trend: moodAnalysis.trend,
                dataPoints: moodAnalysis.dataPoints.slice(-7),
            },
            recommendations: [
                {
                    type: 'log_signal',
                    action: 'Log your mood',
                    route: '/log/mood',
                    priority: 1,
                },
                {
                    type: 'lifestyle_change',
                    action: 'Try a relaxation exercise',
                    priority: 2,
                },
            ],
        });
    }

    // 4. Check health score decline
    if (analysis.healthScoreTrends?.significantDecline) {
        alerts.push({
            type: ALERT_TYPES.DECLINING_SCORE,
            severity: ALERT_SEVERITY.HIGH,
            title: 'Your health score has dropped',
            message: `Your health score has declined by ${analysis.healthScoreTrends.declinePercent}% this week. Current score: ${analysis.healthScoreTrends.latestScore}. Let's work on getting it back up!`,
            context: {
                metric: 'healthScore',
                currentValue: analysis.healthScoreTrends.latestScore,
                trend: analysis.healthScoreTrends.trend,
                dataPoints: analysis.healthScoreTrends.dataPoints.slice(-7),
            },
            recommendations: [
                {
                    type: 'log_signal',
                    action: 'Log your signals',
                    route: '/dashboard',
                    priority: 1,
                },
            ],
        });
    }

    // 5. Check for positive milestones (not just negative alerts!)
    if (moodAnalysis?.trend?.direction === 'increasing' && moodAnalysis.stats?.mean >= 4) {
        alerts.push({
            type: ALERT_TYPES.HEALTH_MILESTONE,
            severity: ALERT_SEVERITY.LOW,
            title: 'Great mood streak! 🎉',
            message: `You've been in great spirits lately! Keep up whatever you're doing - it's working!`,
            context: {
                metric: 'mood',
                trend: moodAnalysis.trend,
            },
            recommendations: [],
        });
    }

    return alerts;
};

/**
 * Run full predictive analysis and generate alerts
 */
const runAnalysis = async (patientId) => {
    try {
        // Run all analyses in parallel
        const [vitalTrends, symptomPatterns, moodTrends, healthScoreTrends] = await Promise.all([
            analyzeVitalTrends(patientId),
            analyzeSymptomPatterns(patientId),
            analyzeMoodTrends(patientId),
            analyzeHealthScoreTrends(patientId),
        ]);

        const analysis = {
            vitalTrends,
            symptomPatterns,
            moodTrends,
            healthScoreTrends,
            analyzedAt: new Date(),
        };

        // Generate alerts
        const potentialAlerts = await generateAlerts(patientId, analysis);

        // Filter out duplicate alerts and save new ones
        const savedAlerts = [];

        for (const alertData of potentialAlerts) {
            const fingerprint = `${alertData.type}_${alertData.context?.metric || 'general'}_${new Date().toISOString().split('T')[0]}`;

            const isDuplicate = await HealthAlert.isDuplicate(patientId, fingerprint);

            if (!isDuplicate) {
                const expiresAt = new Date();
                expiresAt.setHours(
                    expiresAt.getHours() +
                    CONFIG.ALERT_EXPIRY_HOURS[alertData.severity]
                );

                const alert = await HealthAlert.create({
                    patient: patientId,
                    ...alertData,
                    fingerprint,
                    expiresAt,
                    source: 'anomaly_detection',
                });

                savedAlerts.push(alert);
            }
        }

        return {
            analysis,
            alerts: savedAlerts,
            totalAlerts: potentialAlerts.length,
            newAlerts: savedAlerts.length,
        };
    } catch (error) {
        console.error('[Predictive] Analysis error:', error);
        throw error;
    }
};

/**
 * Get active alerts for a patient
 */
const getActiveAlerts = async (patientId, options = {}) => {
    return HealthAlert.getActiveAlerts(patientId, options);
};

/**
 * Get analysis summary for dashboard
 */
const getAnalysisSummary = async (patientId) => {
    const [vitalTrends, moodTrends, healthScoreTrends, activeAlerts] = await Promise.all([
        analyzeVitalTrends(patientId, 7),
        analyzeMoodTrends(patientId, 7),
        analyzeHealthScoreTrends(patientId, 7),
        HealthAlert.getActiveAlerts(patientId, { limit: 5 }),
    ]);

    return {
        vitals: {
            hasData: Object.keys(vitalTrends).length > 0,
            anomalyCount: Object.values(vitalTrends).reduce(
                (sum, v) => sum + (v.anomalies?.length || 0), 0
            ),
            trends: Object.entries(vitalTrends).reduce((acc, [key, data]) => {
                acc[key] = {
                    trend: data.trend?.direction,
                    latest: data.latestValue,
                };
                return acc;
            }, {}),
        },
        mood: {
            trend: moodTrends.trend?.direction,
            averageScore: moodTrends.stats?.mean,
            consecutiveBad: moodTrends.consecutiveBadMoods,
        },
        healthScore: {
            current: healthScoreTrends.latestScore,
            trend: healthScoreTrends.trend?.direction,
            decline: healthScoreTrends.significantDecline,
        },
        alerts: {
            count: activeAlerts.length,
            items: activeAlerts,
            highPriority: activeAlerts.filter(a =>
                a.severity === ALERT_SEVERITY.HIGH ||
                a.severity === ALERT_SEVERITY.CRITICAL
            ).length,
        },
    };
};

/**
 * Acknowledge an alert
 */
const acknowledgeAlert = async (alertId, patientId) => {
    const alert = await HealthAlert.findOne({ _id: alertId, patient: patientId });
    if (!alert) {
        throw new Error('Alert not found');
    }
    return alert.acknowledge();
};

/**
 * Dismiss an alert with optional feedback
 */
const dismissAlert = async (alertId, patientId, feedback = null) => {
    const alert = await HealthAlert.findOne({ _id: alertId, patient: patientId });
    if (!alert) {
        throw new Error('Alert not found');
    }
    return alert.dismiss(feedback);
};

/**
 * Get alert history for a patient
 */
const getAlertHistory = async (patientId, options = {}) => {
    const { limit = 20, page = 1, status } = options;
    const skip = (page - 1) * limit;

    const query = { patient: patientId };
    if (status) {
        query.status = status;
    }

    const [alerts, total] = await Promise.all([
        HealthAlert.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        HealthAlert.countDocuments(query),
    ]);

    return {
        alerts,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
};

module.exports = {
    // Analysis functions
    analyzeVitalTrends,
    analyzeSymptomPatterns,
    analyzeMoodTrends,
    analyzeHealthScoreTrends,
    runAnalysis,

    // Alert functions
    getActiveAlerts,
    getAnalysisSummary,
    acknowledgeAlert,
    dismissAlert,
    getAlertHistory,

    // Utility functions
    calculateStats,
    calculateTrend,
    detectAnomalies,
};
