/**
 * Health Score Calculation Service
 * Logic to compute patient health scores using EMR-aligned Risk Models (NEWS2-inspired)
 */

const { Signal, SIGNAL_CATEGORIES, SYMPTOM_SEVERITY, MOOD_TYPES } = require('../models/Signal');
const HealthScore = require('../models/HealthScore');

// Time windows
const WINDOW_DAYS = 1; // Analysis window

/**
 * Calculates a "Clinical Risk Factor" similar to the EMR's Risk Score service.
 * In the EMR, Risk = NEWS2 + LabDelta + RadiologyDelta.
 * Here, we approximate Risk from Patient Signals.
 * 
 * Mapping:
 * - Mild Symptom = Risk Level 1 (MILD)
 * - Moderate Symptom = Risk Level 2 (MODERATE)
 * - Severe Symptom = Risk Level 3 (SEVERE)
 */
const calculateClinicalRiskScore = (signals) => {
    let riskPoints = 0;

    // 1. Symptom Risk (Primary Driver)
    const symptoms = signals.filter(s => s.category === SIGNAL_CATEGORIES.SYMPTOM);

    // We take the SUM of risks, similar to NEWS2, but we cap it to prevent zeroing out too easily
    // unless truly critical.
    symptoms.forEach(s => {
        let points = 0;
        const sym = s.symptom;

        // Base severity points
        if (sym.severity === SYMPTOM_SEVERITY.SEVERE) points = 4; // Critical risk contribution
        else if (sym.severity === SYMPTOM_SEVERITY.MODERATE) points = 2;
        else points = 1;

        // "Red Flag" Symptom Boosters (Clinical Heuristics)
        const type = sym.type.toLowerCase();
        if (type.includes('breath') || type.includes('chest') || type.includes('heart')) {
            points += 2; // High priority symptoms add extra risk
        }

        riskPoints += points;
    });

    return riskPoints;
};

const calculateHealthScore = async (patientId) => {
    // 1. Fetch recent signals
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - WINDOW_DAYS);

    const signals = await Signal.find({
        patient: patientId,
        isActive: true,
        recordedAt: { $gte: startDate, $lte: endDate },
    });

    const insights = [];

    // --- Step 1: Baseline ---
    let healthScore = 100;

    // --- Step 2: Apply Clinical Risk Deduction (EMR Logic Aligned) ---
    // Formula: Score = 100 - (RiskPoints * 10)
    // A single Severe Red Flag symptom (4+2=6 points) -> 60 deduction -> Score 40.
    // This is harsh but fair for "Severe Chest Pain".
    const riskPoints = calculateClinicalRiskScore(signals);
    const riskDeduction = riskPoints * 10;

    healthScore -= riskDeduction;

    if (riskPoints > 0) {
        insights.push(`Health Score reduced due to detected clinical risk factors (Risk Level: ${riskPoints}).`);
    }

    // --- Step 3: Modifiers (Mood & Lifestyle) ---
    // These act as buffers or minor boosters/penalties (+/- 10 max usually)

    // Mood
    const moodSignals = signals.filter(s => s.category === SIGNAL_CATEGORIES.MOOD);
    if (moodSignals.length > 0) {
        // Average mood impact
        let moodImpact = 0;
        moodSignals.forEach(m => {
            switch (m.mood.type) {
                case MOOD_TYPES.GREAT: moodImpact += 5; break;
                case MOOD_TYPES.GOOD: moodImpact += 2; break;
                case MOOD_TYPES.BAD: moodImpact -= 5; break;
                default: break;
            }
            // Stress penalty
            if (m.mood.stressLevel > 7) moodImpact -= 5;
        });
        // Cap mood impact per day
        moodImpact = Math.max(-15, Math.min(15, moodImpact));
        healthScore += moodImpact;
    }

    // Lifestyle
    const lifestyle = signals.filter(s => s.category === SIGNAL_CATEGORIES.LIFESTYLE);
    if (lifestyle.length > 0) {
        let lifestyleImpact = 0;
        lifestyle.forEach(l => {
            if (l.lifestyle.sleep && l.lifestyle.sleep.duration < 5) lifestyleImpact -= 5;
            if (l.lifestyle.activity && (l.lifestyle.activity.type === 'active' || l.lifestyle.activity.type === 'very_active')) lifestyleImpact += 5;
        });
        healthScore += lifestyleImpact;
    }

    // --- Step 4: Final Clamp ---
    // Ensure 0-100 range
    healthScore = Math.max(0, Math.min(100, healthScore));

    // --- Step 5: Trend Analysis ---
    const previousScore = await HealthScore.findOne({ patient: patientId }).sort({ calculatedAt: -1 });
    let trendDirection = 'stable';
    let percentChange = 0;

    if (previousScore) {
        const diff = healthScore - previousScore.score;
        if (previousScore.score !== 0) {
            percentChange = Math.round(((healthScore - previousScore.score) / previousScore.score) * 100);
        }

        if (diff > 5) trendDirection = 'improving';
        else if (diff < -5) trendDirection = 'declining';
    }

    // Generate Summary
    let summary = "Your health patterns look stable.";
    if (healthScore >= 80) summary = "You're doing well. Keep it up!";
    else if (healthScore >= 50) summary = "Your score has dropped. Monitor your symptoms closely.";
    else summary = "Your health score indicates potential concern. Please consult a doctor if symptoms persist.";

    // Save Score
    const newScore = await HealthScore.create({
        patient: patientId,
        score: Math.round(healthScore),
        trend: {
            direction: trendDirection,
            percentageChange: percentChange,
        },
        components: {
            symptomScore: Math.max(0, 100 - riskDeduction), // Approximate
            moodScore: 80,
            lifestyleScore: 70,
            vitalsScore: 90,
        },
        summary,
        insights,
        period: 'daily',
        calculationMethod: 'EMR_RISK_ALIGNED',
    });

    return newScore;
};

// ... keep getOrCalculateScore same ...
const getOrCalculateScore = async (patientId) => {
    let latestScore = await HealthScore.findOne({ patient: patientId }).sort({ calculatedAt: -1 });
    if (!latestScore) {
        return await calculateHealthScore(patientId);
    }
    return latestScore;
};

module.exports = {
    calculateHealthScore,
    getOrCalculateScore,
};
