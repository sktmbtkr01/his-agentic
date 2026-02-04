/**
 * Patient Prescription Controller
 * Handles prescription viewing and refill requests for patients
 */
const Prescription = require('../../models/Prescription');
const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');

/**
 * @desc    Get patient's active prescriptions
 * @route   GET /api/v1/patient/prescriptions
 * @access  Private (Patient)
 */
exports.getPrescriptions = asyncHandler(async (req, res) => {
    const prescriptions = await Prescription.find({
        patient: req.patient._id,
        isDispensed: false // Active prescriptions only
    })
        .populate('doctor', 'profile.firstName profile.lastName profile.specialization')
        .populate('medicines.medicine', 'name genericName category strength form')
        .sort({ createdAt: -1 });

    // Transform data for frontend
    const transformedPrescriptions = prescriptions.map(rx => ({
        _id: rx._id,
        prescriptionNumber: rx.prescriptionNumber,
        doctor: rx.doctor ? {
            _id: rx.doctor._id,
            firstName: rx.doctor.profile?.firstName,
            lastName: rx.doctor.profile?.lastName,
            specialization: rx.doctor.profile?.specialization
        } : null,
        medicines: rx.medicines.map(med => ({
            _id: med._id,
            name: med.medicine?.name || 'Unknown',
            genericName: med.medicine?.genericName,
            category: med.medicine?.category,
            strength: med.medicine?.strength,
            form: med.medicine?.form,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity
        })),
        specialInstructions: rx.specialInstructions,
        isDispensed: rx.isDispensed,
        dispensedAt: rx.dispensedAt,
        createdAt: rx.createdAt,
        status: rx.isDispensed ? 'dispensed' : 'active'
    }));

    res.status(200).json({
        success: true,
        count: transformedPrescriptions.length,
        data: transformedPrescriptions
    });
});

/**
 * @desc    Get single prescription details
 * @route   GET /api/v1/patient/prescriptions/:id
 * @access  Private (Patient)
 */
exports.getPrescriptionById = asyncHandler(async (req, res, next) => {
    const prescription = await Prescription.findOne({
        _id: req.params.id,
        patient: req.patient._id
    })
        .populate('doctor', 'profile.firstName profile.lastName profile.specialization profile.qualification')
        .populate('medicines.medicine', 'name genericName category strength form manufacturer notes');

    if (!prescription) {
        return next(new ErrorResponse('Prescription not found', 404));
    }

    // Transform data for frontend
    const transformedRx = {
        _id: prescription._id,
        prescriptionNumber: prescription.prescriptionNumber,
        doctor: prescription.doctor ? {
            _id: prescription.doctor._id,
            firstName: prescription.doctor.profile?.firstName,
            lastName: prescription.doctor.profile?.lastName,
            specialization: prescription.doctor.profile?.specialization,
            qualification: prescription.doctor.profile?.qualification
        } : null,
        medicines: prescription.medicines.map(med => ({
            _id: med._id,
            name: med.medicine?.name || 'Unknown',
            genericName: med.medicine?.genericName,
            category: med.medicine?.category,
            strength: med.medicine?.strength,
            form: med.medicine?.form,
            manufacturer: med.medicine?.manufacturer,
            notes: med.medicine?.notes,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity
        })),
        specialInstructions: prescription.specialInstructions,
        isDispensed: prescription.isDispensed,
        dispensedAt: prescription.dispensedAt,
        dispensedBy: prescription.dispensedBy,
        createdAt: prescription.createdAt,
        updatedAt: prescription.updatedAt,
        status: prescription.isDispensed ? 'dispensed' : 'active'
    };

    res.status(200).json({
        success: true,
        data: transformedRx
    });
});

/**
 * @desc    Get patient's prescription history (all prescriptions)
 * @route   GET /api/v1/patient/prescriptions/history
 * @access  Private (Patient)
 */
exports.getPrescriptionHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const prescriptions = await Prescription.find({
        patient: req.patient._id
    })
        .populate('doctor', 'profile.firstName profile.lastName profile.specialization')
        .populate('medicines.medicine', 'name genericName category strength form')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Prescription.countDocuments({ patient: req.patient._id });

    // Transform data for frontend
    const transformedPrescriptions = prescriptions.map(rx => ({
        _id: rx._id,
        prescriptionNumber: rx.prescriptionNumber,
        doctor: rx.doctor ? {
            _id: rx.doctor._id,
            firstName: rx.doctor.profile?.firstName,
            lastName: rx.doctor.profile?.lastName,
            specialization: rx.doctor.profile?.specialization
        } : null,
        medicines: rx.medicines.map(med => ({
            _id: med._id,
            name: med.medicine?.name || 'Unknown',
            genericName: med.medicine?.genericName,
            category: med.medicine?.category,
            strength: med.medicine?.strength,
            form: med.medicine?.form,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
            quantity: med.quantity
        })),
        specialInstructions: rx.specialInstructions,
        isDispensed: rx.isDispensed,
        dispensedAt: rx.dispensedAt,
        createdAt: rx.createdAt,
        status: rx.isDispensed ? 'dispensed' : 'active'
    }));

    res.status(200).json({
        success: true,
        count: transformedPrescriptions.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: transformedPrescriptions
    });
});

/**
 * @desc    Request a prescription refill
 * @route   POST /api/v1/patient/prescriptions/:id/refill
 * @access  Private (Patient)
 */
exports.requestRefill = asyncHandler(async (req, res, next) => {
    const prescription = await Prescription.findOne({
        _id: req.params.id,
        patient: req.patient._id
    });

    if (!prescription) {
        return next(new ErrorResponse('Prescription not found', 404));
    }

    // Check if prescription is dispensed (can only refill dispensed prescriptions)
    if (!prescription.isDispensed) {
        return next(new ErrorResponse('Cannot request refill for active prescription. Please wait until current prescription is dispensed.', 400));
    }

    // For now, we'll just return a success message
    // In a full implementation, this would create a refill request record
    // and notify the pharmacy/doctor for approval

    res.status(200).json({
        success: true,
        message: 'Refill request submitted successfully. You will be notified once it is approved.',
        data: {
            prescriptionId: prescription._id,
            prescriptionNumber: prescription.prescriptionNumber,
            requestedAt: new Date(),
            status: 'pending'
        }
    });
});
