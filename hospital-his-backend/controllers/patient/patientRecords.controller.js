/**
 * Patient Records Controller
 * Handles document uploads, OCR, and timeline retrieval
 */
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');
const PatientDocument = require('../../models/PatientDocument');
const timelineService = require('../../services/timeline.service');

/**
 * @desc    Get unified medical timeline
 * @route   GET /api/v1/patient/records/timeline
 * @access  Private (Patient)
 */
exports.getTimeline = asyncHandler(async (req, res, next) => {
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sources: req.query.sources ? req.query.sources.split(',') : ['hospital', 'self', 'upload']
    };

    const timeline = await timelineService.getUnifiedTimeline(req.patient._id, filters);

    res.status(200).json({
        success: true,
        count: timeline.length,
        data: timeline
    });
});

/**
 * @desc    Upload a medical document
 * @route   POST /api/v1/patient/records/upload
 * @access  Private (Patient)
 */
exports.uploadDocument = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    const { title, type } = req.body;

    // Create document record
    const document = await PatientDocument.create({
        patient: req.patient._id,
        title: title || req.file.originalname,
        type: type || 'other',
        filePath: req.file.path,
        fileType: req.file.mimetype,
    });

    // Determine if OCR is possible (Images only for now, PDF later)
    let ocrData = { rawText: '', confidence: 0 };

    if (req.file.mimetype.startsWith('image/')) {
        try {
            console.log(`[OCR] Starting processing for ${document._id}`);
            const result = await Tesseract.recognize(
                req.file.path,
                'eng',
                { logger: m => console.log(`[OCR Progress] ${m.status}: ${Math.round(m.progress * 100)}%`) }
            );

            ocrData.rawText = result.data.text;
            ocrData.confidence = result.data.confidence;

            // Update document with OCR result
            document.ocrData = ocrData;
            await document.save();
            console.log(`[OCR] Completed for ${document._id}`);

        } catch (error) {
            console.error('[OCR] Failed:', error);
            // Don't fail the upload if OCR fails, just log it
        }
    }

    res.status(201).json({
        success: true,
        data: document
    });
});

/**
 * @desc    Confirm/Update OCR data
 * @route   PUT /api/v1/patient/records/ocr/:id/confirm
 * @access  Private (Patient)
 */
exports.confirmOCR = asyncHandler(async (req, res, next) => {
    const document = await PatientDocument.findById(req.params.id);

    if (!document) {
        return next(new ErrorResponse('Document not found', 404));
    }

    // Verify ownership
    if (document.patient.toString() !== req.patient._id.toString()) {
        return next(new ErrorResponse('Not authorized to access this document', 401));
    }

    const { rawText, extractedFields } = req.body;

    if (rawText) document.ocrData.rawText = rawText;
    if (extractedFields) document.ocrData.extractedFields = extractedFields;

    document.ocrConfirmed = true;
    await document.save();

    res.status(200).json({
        success: true,
        data: document
    });
});
