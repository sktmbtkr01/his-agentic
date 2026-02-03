/**
 * Safe Bed Seeding Script for Production
 * Adds Wards and Beds without deleting existing data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const Department = require('../models/Department');
const config = require('../config/config');
const { BED_STATUS, BED_TYPES } = require('../config/constants');

const seedDatabase = async () => {
    console.log('🔌 Connecting to MongoDB...');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connected');
    } catch (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }

    try {
        // 1. Fetch Departments
        const departments = await Department.find();
        console.log(`Found ${departments.length} departments.`);

        const genMedDept = departments.find((d) => d.departmentCode === 'DEPT-GEN');
        const cardDept = departments.find((d) => d.departmentCode === 'DEPT-CARD');
        const emergDept = departments.find((d) => d.departmentCode === 'DEPT-EMRG');
        const pedsDept = departments.find((d) => d.departmentCode === 'DEPT-PEDS');
        const gynoDept = departments.find((d) => d.departmentCode === 'DEPT-GYNO');

        // 2. Define Wards Data
        const wardsData = [
            { wardCode: 'WRD-GEN-M', name: 'General Ward - Male', type: 'general', department: genMedDept?._id, floor: '1st', building: 'Main', totalBeds: 20, nurseStation: 'NS-1A', contactNumber: '5001' },
            { wardCode: 'WRD-GEN-F', name: 'General Ward - Female', type: 'general', department: genMedDept?._id, floor: '1st', building: 'Main', totalBeds: 20, nurseStation: 'NS-1B', contactNumber: '5002' },
            { wardCode: 'WRD-SEMI-M', name: 'Semi-Private Ward - Male', type: 'semi-private', department: genMedDept?._id, floor: '2nd', building: 'Main', totalBeds: 10, nurseStation: 'NS-2A', contactNumber: '5003' },
            { wardCode: 'WRD-SEMI-F', name: 'Semi-Private Ward - Female', type: 'semi-private', department: genMedDept?._id, floor: '2nd', building: 'Main', totalBeds: 10, nurseStation: 'NS-2B', contactNumber: '5004' },
            { wardCode: 'WRD-PVT', name: 'Private Rooms', type: 'private', department: genMedDept?._id, floor: '3rd', building: 'Main', totalBeds: 15, nurseStation: 'NS-3A', contactNumber: '5005' },
            { wardCode: 'WRD-ICU', name: 'Intensive Care Unit', type: 'icu', department: genMedDept?._id, floor: '2nd', building: 'Critical Care', totalBeds: 10, nurseStation: 'NS-ICU', contactNumber: '5006' },
            { wardCode: 'WRD-CCU', name: 'Cardiac Care Unit', type: 'ccu', department: cardDept?._id, floor: '2nd', building: 'Critical Care', totalBeds: 8, nurseStation: 'NS-CCU', contactNumber: '5007' },
            { wardCode: 'WRD-EMRG', name: 'Emergency Ward', type: 'emergency', department: emergDept?._id, floor: 'Ground', building: 'Emergency', totalBeds: 12, nurseStation: 'NS-EMRG', contactNumber: '5008' },
            { wardCode: 'WRD-PEDS', name: 'Pediatric Ward', type: 'pediatric', department: pedsDept?._id, floor: '1st', building: 'Main', totalBeds: 15, nurseStation: 'NS-PEDS', contactNumber: '5009' },
            { wardCode: 'WRD-NICU', name: 'Neonatal ICU', type: 'nicu', department: pedsDept?._id, floor: '1st', building: 'Critical Care', totalBeds: 6, nurseStation: 'NS-NICU', contactNumber: '5010' },
            { wardCode: 'WRD-MAT', name: 'Maternity Ward', type: 'maternity', department: gynoDept?._id, floor: '3rd', building: 'Main', totalBeds: 20, nurseStation: 'NS-MAT', contactNumber: '5011' },
        ];

        // 3. Upsert Wards
        console.log('🏥 Seeding Wards...');
        const seededWards = [];
        for (const data of wardsData) {
            if (!data.department) {
                console.log(`Skipping ${data.wardCode}: Department not found`);
                continue;
            }
            const ward = await Ward.findOneAndUpdate(
                { wardCode: data.wardCode },
                data,
                { upsert: true, new: true }
            );
            seededWards.push(ward);
        }
        console.log(`✓ Processed ${seededWards.length} wards`);

        // 4. Seed Beds
        console.log('🛏️ Seeding Beds...');
        let bedCount = 0;
        for (const ward of seededWards) {
            let bedType;
            let tariff;
            switch (ward.type) {
                case 'general': bedType = BED_TYPES.GENERAL; tariff = 800; break;
                case 'semi-private': bedType = BED_TYPES.SEMI_PRIVATE; tariff = 1500; break;
                case 'private': bedType = BED_TYPES.PRIVATE; tariff = 3000; break;
                case 'icu':
                case 'ccu': bedType = BED_TYPES.ICU; tariff = 5000; break;
                case 'nicu': bedType = BED_TYPES.NICU; tariff = 6000; break;
                default: bedType = BED_TYPES.GENERAL; tariff = 1000;
            }

            for (let i = 1; i <= ward.totalBeds; i++) {
                const bedNumber = `${ward.wardCode}-${String(i).padStart(2, '0')}`;

                // Only create if not exists
                const existingBed = await Bed.findOne({ bedNumber });
                if (!existingBed) {
                    await Bed.create({
                        bedNumber,
                        ward: ward._id,
                        bedType,
                        status: BED_STATUS.AVAILABLE,
                        tariff,
                        features: ward.type === 'private' ? ['AC', 'Attached Bathroom', 'TV', 'WiFi'] : ward.type.includes('icu') || ward.type === 'ccu' ? ['Ventilator Support', 'Central Monitoring', 'Oxygen Supply'] : ['Common Bathroom', 'Fan'],
                        lastCleanedAt: new Date(),
                    });
                    bedCount++;
                }
            }
        }
        console.log(`✓ Added ${bedCount} new beds`);

    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedDatabase();
