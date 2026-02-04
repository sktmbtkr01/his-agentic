const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Signal } = require('../models/Signal');
const Patient = require('../models/Patient');

// Load environment variables
dotenv.config(); // Looks for .env in current directory by default

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const connectWithRetry = async (retryCount = 0) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_his');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(`MongoDB connection error (attempt ${retryCount + 1}):`, err.message);
        if (retryCount < MAX_RETRIES) {
            setTimeout(() => connectWithRetry(retryCount + 1), RETRY_DELAY);
        } else {
            process.exit(1);
        }
    }
};

const seedData = async () => {
    await connectWithRetry();

    try {
        // Find the patient
        const patient = await Patient.findOne({ patientId: 'PAT000061' });
        if (!patient) {
            console.error('Patient PAT000061 not found. Please ensure the patient exists.');
            process.exit(1);
        }

        console.log(`Found patient: ${patient.fullName} (${patient._id})`);

        // Clear existing signals for this patient to avoid duplicates (optional)
        // await Signal.deleteMany({ patient: patient._id });

        const signals = [];
        const today = new Date();

        // Generate 30 days of data
        for (let i = 30; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(9, 0, 0, 0); // Set to 9 AM

            // 1. Vitals
            signals.push({
                patient: patient._id,
                category: 'vitals',
                recordedAt: new Date(date),
                vitals: {
                    bloodPressure: {
                        systolic: 110 + Math.floor(Math.random() * 20), // 110-130
                        diastolic: 70 + Math.floor(Math.random() * 15), // 70-85
                    },
                    heartRate: 65 + Math.floor(Math.random() * 20), // 65-85
                    weight: 70 + (Math.random() * 1 - 0.5), // fluctuating around 70kg
                    temperature: 36.5,
                    oxygenSaturation: 98
                },
                source: 'device_sync'
            });

            // 2. Mood (Evening)
            const eveningDate = new Date(date);
            eveningDate.setHours(20, 0, 0, 0);

            // Correlate mood with random factor (simulate good/bad days)
            const isGoodDay = Math.random() > 0.3;
            const moodType = isGoodDay ? 'good' : (Math.random() > 0.5 ? 'okay' : 'low');

            signals.push({
                patient: patient._id,
                category: 'mood',
                recordedAt: eveningDate,
                mood: {
                    type: moodType,
                    stressLevel: isGoodDay ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 4) + 5,
                    notes: isGoodDay ? 'Feeling great' : 'Long day at work'
                },
                source: 'patient_app'
            });

            // 3. Sleep (Next Morning - attributed to this date for simplicity, or recorded date is next day)
            // Let's say sleep recorded on Day X is for the night of Day X-1. 
            // For simplicity in charts, we'll log sleep duration "for" this date.

            signals.push({
                patient: patient._id,
                category: 'lifestyle',
                recordedAt: new Date(date),
                lifestyle: {
                    sleep: {
                        duration: isGoodDay ? 7 + Math.random() * 2 : 5 + Math.random() * 1.5, // 7-9h or 5-6.5h
                        quality: isGoodDay ? 'good' : 'fair'
                    },
                    activity: {
                        type: 'moderate',
                        duration: 30
                    }
                },
                source: 'patient_app'
            });
        }

        await Signal.insertMany(signals);
        console.log(`Successfully seeded ${signals.length} health signals for ${patient.fullName}`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

seedData();
