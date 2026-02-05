/**
 * Seed Appointments Script
 * Creates multiple appointments for today across different time slots
 * Run with: node scripts/seed_appointments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');

// Models
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Department = require('../models/Department');

const connectDB = async () => {
    try {
        const mongoUri = config.mongodbUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_his';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

const seedAppointments = async () => {
    await connectDB();

    try {
        // Get a doctor
        const doctor = await User.findOne({ role: 'doctor' });
        if (!doctor) {
            console.log('❌ No doctor found. Please create a doctor first.');
            process.exit(1);
        }
        console.log(`📋 Using Doctor: ${doctor.name} (${doctor._id})`);

        // Get or create a department
        let department = await Department.findOne();
        if (!department) {
            console.log('📝 Creating General Medicine department...');
            department = await Department.create({
                name: 'General Medicine',
                code: 'GEN',
                description: 'General Medicine Department',
                isActive: true
            });
        }
        console.log(`🏥 Using Department: ${department.name} (${department._id})`);

        // Get existing patients or create sample ones
        let patients = await Patient.find().limit(30);
        
        if (patients.length < 10) {
            console.log('📝 Creating sample patients...');
            const samplePatients = [];
            const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Olivia', 
                               'William', 'Ava', 'Richard', 'Sophia', 'Joseph', 'Isabella', 'Thomas', 'Mia', 'Charles', 'Charlotte',
                               'Daniel', 'Amelia', 'Matthew', 'Harper', 'Anthony', 'Evelyn', 'Mark', 'Abigail', 'Steven', 'Lily'];
            const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
            
            for (let i = 0; i < 30; i++) {
                const firstName = firstNames[i];
                const lastName = lastNames[i % lastNames.length];
                const patientId = `PAT${String(100000 + i).padStart(6, '0')}`;
                
                samplePatients.push({
                    patientId,
                    firstName,
                    lastName,
                    dateOfBirth: new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                    gender: i % 2 === 0 ? 'male' : 'female',
                    phone: `+91${String(9000000000 + Math.floor(Math.random() * 999999999)).substring(0, 10)}`,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                    address: {
                        street: `${100 + i} Main Street`,
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: '400001'
                    },
                    bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 8],
                    registeredBy: doctor._id
                });
            }
            
            patients = await Patient.insertMany(samplePatients);
            console.log(`✅ Created ${patients.length} sample patients`);
        }

        // Clear today's appointments (optional - comment out if you want to keep existing)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const deleted = await Appointment.deleteMany({
            scheduledDate: { $gte: today, $lt: tomorrow }
        });
        console.log(`🗑️ Cleared ${deleted.deletedCount} existing appointments for today`);

        // Create appointments for different time slots
        const timeSlots = [
            { hour: 9, count: 4 },   // 9 AM - 4 patients
            { hour: 10, count: 6 },  // 10 AM - 6 patients
            { hour: 11, count: 5 },  // 11 AM - 5 patients
            { hour: 12, count: 3 },  // 12 PM - 3 patients
            { hour: 13, count: 2 },  // 1 PM - 2 patients (lunch)
            { hour: 14, count: 5 },  // 2 PM - 5 patients
            { hour: 15, count: 6 },  // 3 PM - 6 patients
            { hour: 16, count: 4 },  // 4 PM - 4 patients
            { hour: 17, count: 2 },  // 5 PM - 2 patients
        ];

        const complaints = [
            'General checkup',
            'Fever and cold',
            'Headache',
            'Back pain',
            'Follow-up visit',
            'Skin rash',
            'Stomach pain',
            'Joint pain',
            'Respiratory issues',
            'Blood pressure check',
            'Diabetes management',
            'Allergy symptoms',
            'Ear infection',
            'Eye checkup referral',
            'Vaccination'
        ];

        const statuses = ['scheduled', 'checked_in', 'in_consultation', 'completed'];
        const appointments = [];
        let patientIndex = 0;

        for (const slot of timeSlots) {
            for (let i = 0; i < slot.count; i++) {
                const patient = patients[patientIndex % patients.length];
                patientIndex++;

                const scheduledDate = new Date();
                scheduledDate.setHours(slot.hour, Math.floor(Math.random() * 60), 0, 0);

                // Determine status based on current time
                const currentHour = new Date().getHours();
                let status = 'scheduled';
                if (slot.hour < currentHour - 1) {
                    status = 'completed';
                } else if (slot.hour < currentHour) {
                    status = statuses[Math.floor(Math.random() * 3)]; // Random: scheduled, checked_in, or in_consultation
                } else if (slot.hour === currentHour) {
                    status = ['scheduled', 'checked_in'][Math.floor(Math.random() * 2)];
                }

                appointments.push({
                    patient: patient._id,
                    doctor: doctor._id,
                    department: department._id,
                    scheduledDate,
                    status,
                    chiefComplaint: complaints[Math.floor(Math.random() * complaints.length)],
                    tokenNumber: appointments.length + 1,
                    createdBy: doctor._id
                });
            }
        }

        // Insert appointments one by one to trigger pre-save hooks for appointmentNumber
        console.log('\n📝 Creating appointments...');
        const createdAppointments = [];
        for (const appt of appointments) {
            try {
                const created = await Appointment.create(appt);
                createdAppointments.push(created);
                process.stdout.write(`\r   Created ${createdAppointments.length}/${appointments.length} appointments`);
            } catch (err) {
                console.log(`\n⚠️ Skipped one appointment: ${err.message}`);
            }
        }
        console.log(`\n\n✅ Successfully created ${createdAppointments.length} appointments for today!`);
        
        // Summary
        console.log('\n📊 Appointments by time slot:');
        for (const slot of timeSlots) {
            const hour = slot.hour > 12 ? `${slot.hour - 12} PM` : slot.hour === 12 ? '12 PM' : `${slot.hour} AM`;
            console.log(`   ${hour}: ${slot.count} appointments`);
        }
        
        console.log(`\n📈 Total: ${createdAppointments.length} appointments`);
        console.log('\n🎉 Done! Refresh the Doctor Dashboard to see the chart populated.');

    } catch (error) {
        console.error('❌ Error seeding appointments:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
};

seedAppointments();
