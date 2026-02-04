/**
 * Seed Test Patient for Patient Portal Testing
 * Run: node scripts/seed_test_patient.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const config = require('../config/config');

const testPatientData = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'Male',
    phone: '+91-9876543210',
    email: 'john.doe@example.com',
    address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
    },
    bloodGroup: 'O+',
    emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+91-9876543211',
    },
    allergies: ['Penicillin'],
    medicalHistory: ['Hypertension', 'Diabetes Type 2'],
};

const seedTestPatient = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodbUri);
        console.log('📦 Connected to MongoDB');

        // Check if test patient already exists
        const existingPatient = await Patient.findOne({ email: 'john.doe@example.com' });

        if (existingPatient) {
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('       TEST PATIENT ALREADY EXISTS');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log(`   Patient ID:     ${existingPatient.patientId}`);
            console.log(`   Name:           ${existingPatient.fullName}`);
            console.log(`   Date of Birth:  ${existingPatient.dateOfBirth.toISOString().split('T')[0]}`);
            console.log('');
            console.log('   Use these credentials to login to Patient Portal:');
            console.log(`   - Patient ID:  ${existingPatient.patientId}`);
            console.log(`   - DOB:         1990-05-15`);
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
        } else {
            // Create test patient
            const patient = await Patient.create(testPatientData);

            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('       TEST PATIENT CREATED SUCCESSFULLY');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log(`   Patient ID:     ${patient.patientId}`);
            console.log(`   Name:           ${patient.fullName}`);
            console.log(`   Date of Birth:  ${patient.dateOfBirth.toISOString().split('T')[0]}`);
            console.log('');
            console.log('   Use these credentials to login to Patient Portal:');
            console.log(`   - Patient ID:  ${patient.patientId}`);
            console.log(`   - DOB:         1990-05-15`);
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
        }

        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedTestPatient();
