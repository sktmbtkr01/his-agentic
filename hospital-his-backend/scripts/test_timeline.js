const mongoose = require('mongoose');
const timelineService = require('../services/timeline.service');
const dotenv = require('dotenv');
const Patient = require('../models/Patient');

dotenv.config();

const testTimeline = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_his');
        console.log('MongoDB Connected');

        const patient = await Patient.findOne({ patientId: 'PAT000061' });
        if (!patient) throw new Error('Patient not found');

        console.log(`Fetching timeline for ${patient.fullName}...`);

        const timeline = await timelineService.getUnifiedTimeline(patient._id, {
            sources: ['hospital', 'self', 'upload']
        });

        console.log(`Timeline Items Found: ${timeline.length}`);

        // Print first 5 items
        timeline.slice(0, 5).forEach(item => {
            console.log(`[${item.date.toISOString().split('T')[0]}] ${item.type.toUpperCase()}: ${item.title} (${item.source})`);
        });

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

testTimeline();
