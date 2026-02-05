/**
 * Patient Records Controller
 * Handles document uploads, OCR, and timeline retrieval
 */
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');
const PatientDocument = require('../../models/PatientDocument');
const timelineService = require('../../services/timeline.service');
const documentOCRService = require('../../services/documentOCR.service');

// Document classification keywords
const DOCUMENT_CLASSIFIERS = {
    prescription: ['rx', 'prescription', 'medicine', 'tablet', 'capsule', 'syrup', 'dose', 'mg', 'ml', 'twice daily', 'once daily', 'before food', 'after food'],
    lab_report: ['lab', 'laboratory', 'test', 'report', 'hemoglobin', 'blood', 'urine', 'sugar', 'cholesterol', 'creatinine', 'reference range', 'normal range'],
    discharge_summary: ['discharge', 'summary', 'admitted', 'discharged', 'hospital', 'diagnosis', 'treatment given', 'advice on discharge']
};

/**
 * Classify document based on OCR text
 */
const classifyDocument = (text) => {
    const lowerText = text.toLowerCase();
    let maxScore = 0;
    let detectedType = 'other';

    for (const [docType, keywords] of Object.entries(DOCUMENT_CLASSIFIERS)) {
        let score = 0;
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                score++;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            detectedType = docType;
        }
    }

    return { type: detectedType, confidence: maxScore > 2 ? 'high' : maxScore > 0 ? 'medium' : 'low' };
};

/**
 * Extract structured fields from OCR text using regex patterns
 */
const extractStructuredFields = (text, docType) => {
    const fields = {
        date: null,
        doctorName: null,
        hospitalName: null,
        keywords: []
    };

    // Date patterns (DD/MM/YYYY, DD-MM-YYYY, Month DD, YYYY)
    const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
        /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi
    ];

    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match && match[0]) {
            fields.date = match[0];
            break;
        }
    }

    // Doctor name patterns
    const drPatterns = [
        /(?:Dr\.?\s*|Doctor\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
        /(?:Physician|Consultant)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi
    ];

    for (const pattern of drPatterns) {
        const match = pattern.exec(text);
        if (match && match[1]) {
            fields.doctorName = match[1].trim();
            break;
        }
    }

    // Hospital/Clinic name (look for common suffixes)
    const hospitalPattern = /([A-Z][A-Za-z\s]+(?:Hospital|Clinic|Medical Center|Healthcare|Diagnostics|Labs?))/g;
    const hospitalMatch = hospitalPattern.exec(text);
    if (hospitalMatch) {
        fields.hospitalName = hospitalMatch[1].trim();
    }

    // Extract keywords based on document type
    if (docType === 'prescription') {
        const medicinePattern = /(?:Tab\.|Cap\.|Syp\.|Inj\.)\s*([A-Za-z0-9\s]+\d*\s*(?:mg|ml|gm)?)/gi;
        let match;
        while ((match = medicinePattern.exec(text)) !== null) {
            fields.keywords.push(match[1].trim());
        }
    } else if (docType === 'lab_report') {
        const testPattern = /(Hemoglobin|RBC|WBC|Platelet|Sugar|Glucose|Creatinine|Cholesterol|TSH|T3|T4|Urea|Albumin)/gi;
        let match;
        while ((match = testPattern.exec(text)) !== null) {
            if (!fields.keywords.includes(match[1])) {
                fields.keywords.push(match[1]);
            }
        }
    }

    return fields;
};

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

    // Normalize file path to use forward slashes for URL compatibility
    const normalizedPath = req.file.path.replace(/\\/g, '/');

    // Create document record
    const document = await PatientDocument.create({
        patient: req.patient._id,
        title: title || req.file.originalname,
        type: type || 'other',
        filePath: normalizedPath,
        fileType: req.file.mimetype,
    });

    // Determine if OCR is possible
    let ocrData = { rawText: '', confidence: 0, extractedFields: {}, medications: [], summary: '', patientFriendlyExplanation: '' };

    try {
        if (req.file.mimetype.startsWith('image/')) {
            // Use AI Vision OCR for images (handles handwritten text much better)
            console.log(`[OCR] Starting AI Vision processing for ${document._id}`);
            const aiResult = await documentOCRService.extractTextFromImage(req.file.path);
            
            if (aiResult.success) {
                ocrData.rawText = aiResult.rawText;
                ocrData.confidence = aiResult.confidence;
                ocrData.medications = aiResult.medications || [];
                ocrData.summary = aiResult.summary || '';
                ocrData.patientFriendlyExplanation = aiResult.patientFriendlyExplanation || '';
                ocrData.method = 'ai-vision';
                console.log(`[OCR] AI Vision complete. Confidence: ${ocrData.confidence}%`);
            } else {
                // Fallback to Tesseract if AI fails
                console.log(`[OCR] AI Vision failed, falling back to Tesseract`);
                const result = await Tesseract.recognize(
                    req.file.path,
                    'eng',
                    { logger: m => console.log(`[OCR Progress] ${m.status}: ${Math.round(m.progress * 100)}%`) }
                );
                ocrData.rawText = result.data.text;
                ocrData.confidence = result.data.confidence;
                ocrData.method = 'tesseract';
            }

        } else if (req.file.mimetype === 'application/pdf') {
            // Process PDFs with pdf-parse
            console.log(`[OCR] Starting PDF text extraction for ${document._id}`);
            const pdfBuffer = fs.readFileSync(req.file.path);
            const pdfData = await pdfParse(pdfBuffer);

            ocrData.rawText = pdfData.text;
            ocrData.confidence = 95; // PDF text extraction is usually very accurate
            ocrData.method = 'pdf-parse';
            console.log(`[OCR] PDF extraction complete. Pages: ${pdfData.numpages}, Characters: ${pdfData.text.length}`);
            
            // If it's a prescription, translate to patient-friendly language
            if (type === 'prescription' || ocrData.rawText.toLowerCase().includes('prescription')) {
                const translation = await documentOCRService.translatePrescription(ocrData.rawText);
                if (translation.success) {
                    ocrData.patientFriendlyExplanation = translation.translation;
                }
            }
            // If it's a lab report, provide summary
            else if (type === 'lab_report' || ocrData.rawText.toLowerCase().includes('lab') || ocrData.rawText.toLowerCase().includes('test')) {
                const summary = await documentOCRService.summarizeLabReport(ocrData.rawText);
                if (summary.success) {
                    ocrData.summary = summary.summary;
                }
            }
        }

        // Auto-classify document if type is 'other' and we have text
        if (ocrData.rawText && (!type || type === 'other')) {
            const classification = classifyDocument(ocrData.rawText);
            if (classification.confidence !== 'low') {
                document.type = classification.type;
                ocrData.classificationConfidence = classification.confidence;
                console.log(`[OCR] Auto-classified as: ${document.type} (${classification.confidence})`);
            }
        }

        // Extract structured fields if we have text
        if (ocrData.rawText) {
            ocrData.extractedFields = extractStructuredFields(ocrData.rawText, document.type);
        }

        // Update document with OCR result
        document.ocrData = ocrData;
        await document.save();
        console.log(`[OCR] Completed for ${document._id} - Type: ${document.type}`);

    } catch (error) {
        console.error('[OCR] Failed:', error.message);
        // Don't fail the upload if OCR fails, just log it
    }

    res.status(201).json({
        success: true,
        data: document
    });
});

/**
 * @desc    Get a single document by ID
 * @route   GET /api/v1/patient/records/documents/:id
 * @access  Private (Patient)
 */
exports.getDocument = asyncHandler(async (req, res, next) => {
    const document = await PatientDocument.findById(req.params.id);

    if (!document) {
        return next(new ErrorResponse('Document not found', 404));
    }

    // Verify ownership
    if (document.patient.toString() !== req.patient._id.toString()) {
        return next(new ErrorResponse('Not authorized to access this document', 401));
    }

    res.status(200).json({
        success: true,
        data: document
    });
});

/**
 * @desc    Get all documents for patient
 * @route   GET /api/v1/patient/records/documents
 * @access  Private (Patient)
 */
exports.getDocuments = asyncHandler(async (req, res, next) => {
    const { type, confirmed } = req.query;
    
    const query = { patient: req.patient._id };
    
    if (type) query.type = type;
    if (confirmed !== undefined) query.ocrConfirmed = confirmed === 'true';

    const documents = await PatientDocument.find(query)
        .sort({ uploadedAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        count: documents.length,
        data: documents
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
