const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const Patient = require('../models/Patient');

dotenv.config();

const API_URL = 'http://localhost:5001/api/v1';

const testAnalytics = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_his');
        console.log('MongoDB Connected');

        const patient = await Patient.findOne({ patientId: 'PAT000061' });
        if (!patient) {
            console.error('Patient PAT000061 not found');
            process.exit(1);
        }

        const dob = patient.dateOfBirth.toISOString();
        console.log(`Found Patient. DOB: ${dob}`);

        // Login
        console.log('Attempting Login...');
        const loginRes = await axios.post(`${API_URL}/patient/auth/login`, {
            patientId: 'PAT000061',
            dateOfBirth: dob
        });

        const token = loginRes.data.accessToken;
        console.log('Login Successful. Token obtained.');

        // Fetch Analytics
        console.log('Fetching Analytics Trends...');
        const analyticsRes = await axios.get(`${API_URL}/patient/analytics/trends?range=30d`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Analytics Response Data:');
        console.log(JSON.stringify(analyticsRes.data, null, 2));

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

testAnalytics();
