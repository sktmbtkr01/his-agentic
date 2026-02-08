const mongoose = require('mongoose');
const Patient = require('./models/Patient');
// Need to load dotenv if available, but falling back to hardcoded string if not, or we can just try to rely on default first.
// However, the check_db.js uses hardcoded, but server.js likely uses .env.
// Let's try to load .env first to be safe, if not found, use the hardcoded one from check_db.js.
require('dotenv').config();

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management_db';

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('✅ Connected to DB');
        await findJay();
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    });

async function findJay() {
    try {
        console.log("Searching for 'Jay Guri'...");
        // Case insensitive search for First Name 'Jay' and Last Name 'Guri'
        // or potentially reversed.

        // Option 1: Exact Match (Case Insensitive)
        const patients = await Patient.find({
            firstName: { $regex: new RegExp('^Jay$', 'i') },
            lastName: { $regex: new RegExp('^Guri$', 'i') }
        });

        if (patients.length > 0) {
            console.log(`Found ${patients.length} patient(s) matching exactly 'Jay Guri':`);
            console.log(JSON.stringify(patients, null, 2));
        } else {
            console.log("No exact match found for 'Jay Guri'. Trying looser search...");

            // Loose search: maybe "Jay" is part of the name
            const loosePatients = await Patient.find({
                $or: [
                    { firstName: { $regex: new RegExp('Jay', 'i') } },
                    { lastName: { $regex: new RegExp('Guri', 'i') } },
                    // Also check if they combined it in one field
                    { firstName: { $regex: new RegExp('Jay Guri', 'i') } }
                ]
            });

            if (loosePatients.length > 0) {
                console.log(`Found ${loosePatients.length} patient(s) with partial matches:`);
                loosePatients.forEach(p => {
                    console.log(`- ID: ${p.patientId} | Name: ${p.firstName} ${p.lastName} | Phone: ${p.phone}`);
                });
            } else {
                console.log("No patients found with name resembling 'Jay Guri'.");
            }
        }

    } catch (error) {
        console.error('Error finding patient:', error);
    }
}
