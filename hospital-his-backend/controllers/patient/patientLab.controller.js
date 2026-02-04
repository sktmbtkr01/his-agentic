/**
 * Patient Lab Controller
 * Handles viewing of lab orders and results for patients
 */
const LabTest = require('../../models/LabTest');
const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');
const { LAB_TEST_STATUS } = require('../../config/constants');

/**
 * @desc    Get patient's lab tests (orders and results)
 * @route   GET /api/v1/patient/labs
 * @access  Private (Patient)
 */
exports.getLabTests = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { patient: req.patient._id };

    // Filter by status group if requested
    if (status === 'completed') {
        query.status = LAB_TEST_STATUS.COMPLETED;
    } else if (status === 'pending') {
        query.status = { $ne: LAB_TEST_STATUS.COMPLETED };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const labTests = await LabTest.find(query)
            .populate('test', 'testName category sampleType')
            .populate('orderedBy', 'profile.firstName profile.lastName profile.specialization')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LabTest.countDocuments(query);

        // Transform data for frontend
        const transformedTests = labTests.map(test => ({
            _id: test._id,
            testNumber: test.testNumber,
            testName: test.test?.testName || 'Unknown Test',
            category: test.test?.category,
            status: test.status,
            orderedDate: test.createdAt,
            sampleCollectedAt: test.sampleCollectedAt,
            completedAt: test.completedAt,
            orderedBy: test.orderedBy ? {
                firstName: test.orderedBy.profile?.firstName,
                lastName: test.orderedBy.profile?.lastName,
                specialization: test.orderedBy.profile?.specialization
            } : null,
            isAbnormal: test.results?.some(r => r.isAbnormal) || false,
            isCritical: test.results?.some(r => r.isCritical) || false,
            visitType: test.visitModel // OPD/IPD/Emergency
        }));

        res.status(200).json({
            success: true,
            count: transformedTests.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: transformedTests
        });
    } catch (error) {
        console.error('Error in getLabTests:', error);
        next(error);
    }
});


/**
 * @desc    Get single lab test details
 * @route   GET /api/v1/patient/labs/:id
 * @access  Private (Patient)
 */
exports.getLabTestById = asyncHandler(async (req, res, next) => {
    const labTest = await LabTest.findOne({
        _id: req.params.id,
        patient: req.patient._id
    })
        .populate('test', 'testName category description sampleType parameters units')
        .populate('orderedBy', 'profile.firstName profile.lastName profile.specialization')
        .populate('departmentBill');

    if (!labTest) {
        return next(new ErrorResponse('Lab test not found', 404));
    }

    // Try to parse AI summary if it's a string
    let parsedAiSummary = null;
    if (labTest.aiSummary) {
        try {
            // Check if it's already an object or needs parsing
            parsedAiSummary = typeof labTest.aiSummary === 'string'
                ? JSON.parse(labTest.aiSummary)
                : labTest.aiSummary;
        } catch (e) {
            // If parsing fails, use raw string text (it might be plain text)
            parsedAiSummary = { summary: labTest.aiSummary };
        }
    }

    // Prepare PDF URL if exists
    // If it's a relative path in 'uploads', prepend API base or serve via static route
    // The backend serves /uploads statically, so we just ensure it starts with /uploads
    const reportUrl = labTest.reportPdf ? `/${labTest.reportPdf.replace(/\\/g, '/')}` : null;
    // Also support generated reportUrl field
    const generatedReportUrl = labTest.reportUrl;

    const responseData = {
        _id: labTest._id,
        testNumber: labTest.testNumber,
        testName: labTest.test?.testName || 'Unknown Test',
        description: labTest.test?.description,
        category: labTest.test?.category,
        status: labTest.status,
        timelines: {
            ordered: labTest.createdAt,
            collected: labTest.sampleCollectedAt,
            completed: labTest.completedAt
        },
        orderedBy: labTest.orderedBy ? {
            firstName: labTest.orderedBy.profile?.firstName,
            lastName: labTest.orderedBy.profile?.lastName,
            specialization: labTest.orderedBy.profile?.specialization
        } : null,
        results: labTest.results || [],
        remarks: labTest.remarks,
        aiSummary: parsedAiSummary,
        summaryGeneratedAt: labTest.summaryGeneratedAt,
        reportUrl: generatedReportUrl || reportUrl, // Prefer generated, fallback to upload
        isAbnormal: labTest.results?.some(r => r.isAbnormal) || false,
        isCritical: labTest.results?.some(r => r.isCritical) || false
    };

    res.status(200).json({
        success: true,
        data: responseData
    });
});
