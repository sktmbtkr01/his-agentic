/**
 * Predictive Intelligence Test Data Seeder
 * Phase 4: Seeds realistic health data to demonstrate AI-powered alerts
 * 
 * Run with: node scripts/seedPredictiveData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Models
const Patient = require('../models/Patient');
const { Signal, SIGNAL_CATEGORIES } = require('../models/Signal');
const HealthScore = require('../models/HealthScore');
const { HealthAlert } = require('../models/HealthAlert');

// Test patient info
const TEST_PATIENT = {
    firstName: 'Alex',
    lastName: 'Johnson',
    phone: '9876543210',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'Male',
    bloodGroup: 'O+',
    email: 'alex.johnson@test.com',
};

// Helper to get date N days ago
const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

// Helper to add random hours to a date
const addHours = (date, hours) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
};

// Random number between min and max
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

/**
 * Seed health scores with a declining trend
 */
const seedHealthScores = async (patientId) => {
    console.log('📊 Seeding health scores with declining trend...');

    // Create a decline: starts at 100, ends at 75 (25% decline)
    const scores = [
        { day: 7, score: 100 },
        { day: 6, score: 95 },
        { day: 5, score: 92 },
        { day: 4, score: 88 },
        { day: 3, score: 82 },
        { day: 2, score: 78 },
        { day: 1, score: 76 },
        { day: 0, score: 75 },
    ];

    for (const { day, score } of scores) {
        await HealthScore.create({
            patient: patientId,
            score,
            trend: {
                direction: day === 0 ? 'declining' : 'stable',
                percentageChange: day === 0 ? -25 : 0,
            },
            components: {
                symptomScore: 25 - day * 2,
                moodScore: 25 - day * 1.5,
                lifestyleScore: 25,
                vitalsScore: 25 - day,
            },
            summary: `Health score: ${score}. ${score < 85 ? 'Some areas need attention.' : 'Doing well!'}`,
            insights: score < 85 ? ['Consider logging more symptoms', 'Track your mood regularly'] : ['Keep up the good work!'],
            calculatedAt: daysAgo(day),
        });
    }

    console.log(`   ✅ Created ${scores.length} health score records`);
};

/**
 * Seed vital signs with some anomalies
 */
const seedVitals = async (patientId) => {
    console.log('💓 Seeding vital signs with anomalies...');

    const vitals = [];

    for (let day = 10; day >= 0; day--) {
        // Normal readings most of the time
        let heartRate = random(65, 85);
        let oxygenSaturation = random(96, 99);
        let temperature = randomFloat(36.3, 37.0);

        // Add some anomalies on specific days
        if (day === 2) {
            heartRate = 115; // Tachycardia
        }
        if (day === 1) {
            heartRate = 108; // Still elevated
        }
        if (day === 3) {
            oxygenSaturation = 93; // Low O2
        }
        if (day === 0) {
            temperature = 37.8; // Mild fever
        }

        vitals.push({
            patient: patientId,
            category: SIGNAL_CATEGORIES.VITALS,
            vitals: {
                heartRate,
                oxygenSaturation,
                temperature: Math.round(temperature * 10) / 10,
                bloodPressure: {
                    systolic: random(110, 125),
                    diastolic: random(70, 82),
                },
            },
            recordedAt: addHours(daysAgo(day), random(8, 20)),
        });
    }

    await Signal.insertMany(vitals);
    console.log(`   ✅ Created ${vitals.length} vital sign records`);
};

/**
 * Seed symptoms with recurring patterns
 */
const seedSymptoms = async (patientId) => {
    console.log('🤕 Seeding recurring symptoms...');

    // Create recurring headaches (4 times in 14 days - triggers alert)
    const headaches = [
        { day: 12, severity: 'mild' },
        { day: 8, severity: 'moderate' },
        { day: 4, severity: 'severe' },
        { day: 1, severity: 'moderate' },
    ];

    for (const { day, severity } of headaches) {
        await Signal.create({
            patient: patientId,
            category: SIGNAL_CATEGORIES.SYMPTOM,
            symptom: {
                type: 'headache',
                severity,
                duration: {
                    value: random(1, 4),
                    unit: 'hours',
                },
                notes: `Recurring headache - ${severity}`,
            },
            recordedAt: daysAgo(day),
        });
    }

    // Add some fatigue as well
    for (let i = 0; i < 3; i++) {
        await Signal.create({
            patient: patientId,
            category: SIGNAL_CATEGORIES.SYMPTOM,
            symptom: {
                type: 'fatigue',
                severity: 'moderate',
                duration: {
                    value: random(2, 8),
                    unit: 'hours',
                },
                notes: 'Feeling tired and low energy',
            },
            recordedAt: daysAgo(random(2, 10)),
        });
    }

    console.log(`   ✅ Created ${headaches.length + 3} symptom records`);
};

/**
 * Seed mood data with consecutive low moods
 */
const seedMoods = async (patientId) => {
    console.log('😊 Seeding mood data with decline...');

    // Start with good moods, decline to bad moods
    const moods = [
        { day: 7, type: 'good', stress: 3 },
        { day: 6, type: 'good', stress: 4 },
        { day: 5, type: 'okay', stress: 5 },
        { day: 4, type: 'okay', stress: 6 },
        { day: 3, type: 'low', stress: 7 },   // Start of decline
        { day: 2, type: 'low', stress: 7 },   // Consecutive low
        { day: 1, type: 'bad', stress: 8 },   // Consecutive low
        { day: 0, type: 'low', stress: 7 },   // Consecutive low (4 in a row)
    ];

    for (const { day, type, stress } of moods) {
        await Signal.create({
            patient: patientId,
            category: SIGNAL_CATEGORIES.MOOD,
            mood: {
                type,
                stressLevel: stress,
                notes: type === 'low' || type === 'bad'
                    ? 'Feeling overwhelmed and stressed'
                    : 'Having a decent day',
            },
            recordedAt: addHours(daysAgo(day), 10),
        });
    }

    console.log(`   ✅ Created ${moods.length} mood records`);
};

/**
 * Seed lifestyle data
 */
const seedLifestyle = async (patientId) => {
    console.log('🏃 Seeding lifestyle data...');

    for (let day = 7; day >= 0; day--) {
        // Sleep quality declining
        const sleepQuality = day > 4 ? 'good' : (day > 2 ? 'fair' : 'poor');
        const sleepHours = day > 4 ? randomFloat(7, 8) : randomFloat(4, 6);

        await Signal.create({
            patient: patientId,
            category: SIGNAL_CATEGORIES.LIFESTYLE,
            lifestyle: {
                sleep: {
                    duration: Math.round(sleepHours * 10) / 10,
                    quality: sleepQuality,
                },
                activity: {
                    type: day > 4 ? 'moderate' : 'light',
                    duration: random(15, 45),
                },
                hydration: {
                    glasses: random(5, 10),
                },
            },
            recordedAt: daysAgo(day),
        });
    }

    console.log(`   ✅ Created 8 lifestyle records`);
};

/**
 * Main seed function
 */
const seedPredictiveData = async () => {
    try {
        console.log('\n🚀 Starting Predictive Intelligence Data Seeder...\n');

        await connectDB();

        // Find or create test patient
        let patient = await Patient.findOne({
            firstName: TEST_PATIENT.firstName,
            lastName: TEST_PATIENT.lastName
        });

        if (!patient) {
            console.log('👤 Creating new test patient...');
            patient = await Patient.create({
                firstName: TEST_PATIENT.firstName,
                lastName: TEST_PATIENT.lastName,
                email: TEST_PATIENT.email,
                phone: TEST_PATIENT.phone,
                dateOfBirth: TEST_PATIENT.dateOfBirth,
                gender: TEST_PATIENT.gender,
                bloodGroup: TEST_PATIENT.bloodGroup,
            });
            console.log(`   ✅ Created patient: ${patient.patientId}`);
        } else {
            console.log(`👤 Using existing patient: ${patient.patientId}`);
        }

        // Clear existing test data for this patient
        console.log('\n🧹 Clearing existing data for this patient...');
        await HealthScore.deleteMany({ patient: patient._id });
        await Signal.deleteMany({ patient: patient._id });
        await HealthAlert.deleteMany({ patient: patient._id });
        console.log('   ✅ Cleared existing data\n');

        // Seed all data types
        await seedHealthScores(patient._id);
        await seedVitals(patient._id);
        await seedSymptoms(patient._id);
        await seedMoods(patient._id);
        await seedLifestyle(patient._id);

        // Format DOB for display
        const dobFormatted = TEST_PATIENT.dateOfBirth.toISOString().split('T')[0];

        console.log('\n' + '═'.repeat(60));
        console.log('✅ SEEDING COMPLETE!');
        console.log('═'.repeat(60));
        console.log('\n📋 TEST PATIENT LOGIN CREDENTIALS:');
        console.log('   Patient ID:     ' + patient.patientId);
        console.log('   Date of Birth:  ' + dobFormatted + ' (May 15, 1990)');
        console.log('\n🔮 EXPECTED ALERTS AFTER ANALYSIS:');
        console.log('   1. ⚠️  Health Score Declined (25% drop)');
        console.log('   2. 💓 Elevated Heart Rate (anomaly detected)');
        console.log('   3. 🤕 Recurring Headaches (4 times in 14 days)');
        console.log('   4. 😔 Consecutive Low Moods (4 days in a row)');
        console.log('\n📱 TO TEST:');
        console.log('   1. Open Patient Portal: http://localhost:5174');
        console.log('   2. Login with:');
        console.log('      - Patient ID: ' + patient.patientId);
        console.log('      - DOB: ' + dobFormatted);
        console.log('   3. Go to Dashboard → Smart Alerts');
        console.log('   4. Click refresh to trigger analysis');
        console.log('   5. View detailed insights at /health-insights');
        console.log('═'.repeat(60) + '\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run the seeder
seedPredictiveData();
