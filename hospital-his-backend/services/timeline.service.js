/**
 * Timeline Service
 * Aggregates health events from multiple sources into a single chronological feed
 */
const Appointment = require('../models/Appointment');
const LabTest = require('../models/LabTest');
const { Signal } = require('../models/Signal');
const PatientDocument = require('../models/PatientDocument');

exports.getUnifiedTimeline = async (patientId, filters = {}) => {
    try {
        const { startDate, endDate, sources = ['hospital', 'self', 'upload'] } = filters;

        // Build date query
        const dateQuery = {};
        if (startDate || endDate) {
            dateQuery.$gte = startDate ? new Date(startDate) : new Date('2000-01-01');
            if (endDate) dateQuery.$lte = new Date(endDate);
        }

        const promises = [];

        // 1. Hospital Appointments
        if (sources.includes('hospital')) {
            try {
                const appointments = await Appointment.find({
                    patient: patientId,
                    date: dateQuery.$gte ? dateQuery : { $exists: true }
                })
                    .populate('doctor', 'firstName lastName specialization')
                    .lean();

                promises.push(appointments.map(d => ({
                    _id: d._id,
                    type: 'appointment',
                    date: d.date,
                    title: `Visit: Dr. ${d.doctor?.lastName || 'Unknown'}`,
                    subtitle: d.reason || d.type,
                    status: d.status,
                    source: 'hospital',
                    details: d
                })));
            } catch (e) {
                console.error('Error fetching appointments:', e.message);
            }

            // 2. Lab Results
            try {
                const labs = await LabTest.find({
                    patient: patientId,
                    createdAt: dateQuery.$gte ? dateQuery : { $exists: true }
                })
                    .populate('orderedBy', 'lastName')
                    .populate('test', 'testName')
                    .lean();

                promises.push(labs.map(d => ({
                    _id: d._id,
                    type: 'lab_result',
                    date: d.createdAt,
                    title: `Lab: ${d.test?.testName || 'Unknown Test'}`,
                    subtitle: d.status,
                    status: d.status,
                    source: 'hospital',
                    details: d
                })));
            } catch (e) {
                console.error('Error fetching labs:', e.message);
                if (e.message.includes('testName')) console.error(e.stack);
            }
        }

        // 3. Documents
        if (sources.includes('upload')) {
            try {
                const docs = await PatientDocument.find({
                    patient: patientId,
                    uploadedAt: dateQuery.$gte ? dateQuery : { $exists: true }
                }).lean();

                promises.push(docs.map(d => ({
                    _id: d._id,
                    type: 'document',
                    date: d.uploadedAt,
                    title: `Doc: ${d.title}`,
                    subtitle: d.ocrConfirmed ? 'Verified' : 'Pending Verification',
                    status: d.ocrConfirmed ? 'verified' : 'pending',
                    source: 'upload',
                    details: d
                })));
            } catch (e) {
                console.error('Error fetching documents:', e.message);
            }
        }

        // 4. Signals
        if (sources.includes('self')) {
            try {
                const signals = await Signal.find({
                    patient: patientId,
                    recordedAt: dateQuery.$gte ? dateQuery : { $exists: true }
                }).lean();

                promises.push(signals.map(d => ({
                    _id: d._id,
                    type: 'health_log',
                    date: d.recordedAt,
                    title: `Logged: ${d.category}`,
                    subtitle: getSignalSubtitle(d),
                    status: 'completed',
                    source: 'self',
                    details: d
                })));
            } catch (e) {
                console.error('Error fetching signals:', e.message);
            }
        }

        const flatResults = promises.flat();

        // Sort by date descending (newest first)
        return flatResults.sort((a, b) => new Date(b.date) - new Date(a.date));

    } catch (error) {
        console.error('Timeline aggregation error:', error);
        console.error(error.stack);
        throw error;
    }
};

function getSignalSubtitle(signal) {
    if (signal.category === 'vitals') return `BP: ${signal.vitals?.bloodPressure?.systolic}/${signal.vitals?.bloodPressure?.diastolic}`;
    if (signal.category === 'mood') return `Mood: ${signal.mood?.type}`;
    return 'Health Entry';
}
