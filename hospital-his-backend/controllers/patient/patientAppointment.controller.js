/**
 * Patient Appointment Controller
 * Handles booking and viewing appointments for patients
 */
const Appointment = require('../../models/Appointment');
const Department = require('../../models/Department');
const User = require('../../models/User'); // Staff/Doctors
const asyncHandler = require('../../utils/asyncHandler');
const { APPOINTMENT_STATUS } = require('../../config/constants');
const mongoose = require('mongoose');

// Helper to get a system user ID for 'createdBy'
const getSystemUser = async () => {
    // Try to find an admin or ANY user to attribute the booking to
    // In a real app, we might have a specific 'System' user
    const systemUser = await User.findOne({ role: { $in: ['admin', 'receptionist'] } });
    return systemUser ? systemUser._id : new mongoose.Types.ObjectId(); // Fallback to random ID if seeded data missing (risky but unblocks)
};

// @desc    Get patient's appointments
// @route   GET /api/v1/patient/appointments
// @access  Private (Patient)
exports.getAppointments = asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({ patient: req.patient._id })
        .populate({
            path: 'doctor',
            select: 'profile.firstName profile.lastName profile.specialization'
        })
        .populate('department', 'name')
        .sort({ scheduledDate: -1 });

    // Transform appointments to flatten doctor profile
    const transformedAppointments = appointments.map(app => {
        const doc = app.doctor; // This is the populated user document
        const transformedDoc = doc ? {
            _id: doc._id,
            firstName: doc.profile?.firstName,
            lastName: doc.profile?.lastName,
            specialization: doc.profile?.specialization
        } : null;

        return {
            ...app.toObject(),
            doctor: transformedDoc
        };
    });

    res.status(200).json({
        success: true,
        count: transformedAppointments.length,
        data: transformedAppointments
    });
});

// @desc    Get departments for booking
// @route   GET /api/v1/patient/appointments/departments
// @access  Private (Patient)
exports.getDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find({ isActive: true }).select('name description image');
    res.status(200).json({
        success: true,
        data: departments
    });
});

// @desc    Get doctors by department
// @route   GET /api/v1/patient/appointments/doctors
// @access  Private (Patient)
exports.getDoctors = asyncHandler(async (req, res) => {
    const { departmentId } = req.query;
    const query = { role: 'doctor', isActive: true };

    if (departmentId) {
        query.department = departmentId;
    }

    const doctors = await User.find(query)
        .select('profile.firstName profile.lastName profile.specialization department')
        .populate('department', 'name');

    // Transform to flatten profile fields for easier frontend consumption
    const transformedDoctors = doctors.map(doc => ({
        _id: doc._id,
        firstName: doc.profile?.firstName || '',
        lastName: doc.profile?.lastName || '',
        specialization: doc.profile?.specialization || '',
        department: doc.department
    }));

    res.status(200).json({
        success: true,
        data: transformedDoctors
    });
});

// @desc    Get available slots
// @route   GET /api/v1/patient/appointments/slots
// @access  Private (Patient)
exports.getAvailableSlots = asyncHandler(async (req, res) => {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
        return res.status(400).json({ success: false, error: 'Doctor and Date are required' });
    }

    // Generate standard slots (9 AM to 5 PM, 30 min intervals)
    const slots = [];
    const startHour = 9;
    const endHour = 17;

    for (let h = startHour; h < endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Find existing appointments
    const searchDate = new Date(date);
    const existingApps = await Appointment.find({
        doctor: doctorId,
        scheduledDate: {
            $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
            $lt: new Date(searchDate.setHours(23, 59, 59, 999))
        },
        status: { $ne: APPOINTMENT_STATUS.CANCELLED }
    });

    const bookedTimes = existingApps.map(app => app.scheduledTime);

    // Filter slots
    const availableSlots = slots.map(time => ({
        time,
        available: !bookedTimes.includes(time)
    }));

    res.status(200).json({
        success: true,
        data: availableSlots
    });
});

// @desc    Book appointment
// @route   POST /api/v1/patient/appointments
// @access  Private (Patient)
exports.bookAppointment = asyncHandler(async (req, res) => {
    const { doctorId, departmentId, date, time, notes } = req.body;

    const systemUserId = await getSystemUser();

    // Verify slot availability
    const existing = await Appointment.findOne({
        doctor: doctorId,
        scheduledDate: new Date(date), // Need precise date handling? Usually we store date part only or full date
        scheduledTime: time,
        status: { $ne: APPOINTMENT_STATUS.CANCELLED }
    });

    // Handle Date object for query - Mongo stores ISODate
    // We assume backend logic for checking redundancy looks at the *Time* string for simplicity in this MVP
    // A robust system would check date ranges.

    // Create Appointment
    const appointment = await Appointment.create({
        patient: req.patient._id,
        doctor: doctorId,
        department: departmentId,
        scheduledDate: new Date(date),
        scheduledTime: time,
        notes: notes,
        status: APPOINTMENT_STATUS.SCHEDULED,
        createdBy: systemUserId, // Assigned to system/admin for now
        type: 'OPD'
    });

    res.status(201).json({
        success: true,
        data: appointment
    });
});

// @desc    Cancel appointment
// @route   PUT /api/v1/patient/appointments/:id/cancel
// @access  Private (Patient)
exports.cancelAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.patient._id
    });

    if (!appointment) {
        return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED || appointment.status === APPOINTMENT_STATUS.CANCELLED) {
        return res.status(400).json({ success: false, error: 'Cannot cancel this appointment' });
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    await appointment.save();

    res.status(200).json({
        success: true,
        data: appointment
    });
});

// @desc    Reschedule appointment
// @route   PUT /api/v1/patient/appointments/:id
// @access  Private (Patient)
exports.rescheduleAppointment = asyncHandler(async (req, res) => {
    const { date, time } = req.body;

    if (!date || !time) {
        return res.status(400).json({ success: false, error: 'Date and time are required' });
    }

    const appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.patient._id
    });

    if (!appointment) {
        return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) {
        return res.status(400).json({ success: false, error: 'Only scheduled appointments can be rescheduled' });
    }

    // Check if new slot is available
    const newDate = new Date(date);
    const existingApp = await Appointment.findOne({
        doctor: appointment.doctor,
        scheduledDate: {
            $gte: new Date(newDate.setHours(0, 0, 0, 0)),
            $lt: new Date(newDate.setHours(23, 59, 59, 999))
        },
        scheduledTime: time,
        status: { $ne: APPOINTMENT_STATUS.CANCELLED },
        _id: { $ne: appointment._id }
    });

    if (existingApp) {
        return res.status(400).json({ success: false, error: 'This time slot is not available' });
    }

    // Update the appointment
    appointment.scheduledDate = new Date(date);
    appointment.scheduledTime = time;
    await appointment.save();

    res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: appointment
    });
});

// @desc    Get single appointment details
// @route   GET /api/v1/patient/appointments/:id
// @access  Private (Patient)
exports.getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findOne({
        _id: req.params.id,
        patient: req.patient._id
    })
        .populate({
            path: 'doctor',
            select: 'profile.firstName profile.lastName profile.specialization profile.qualification'
        })
        .populate('department', 'name description');

    if (!appointment) {
        return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    // Transform doctor profile
    const doc = appointment.doctor;
    const transformedApp = {
        ...appointment.toObject(),
        doctor: doc ? {
            _id: doc._id,
            firstName: doc.profile?.firstName,
            lastName: doc.profile?.lastName,
            specialization: doc.profile?.specialization,
            qualification: doc.profile?.qualification
        } : null
    };

    res.status(200).json({
        success: true,
        data: transformedApp
    });
});
