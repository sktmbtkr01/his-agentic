/**
 * Handwriting OCR Service
 * Converts handwritten canvas input to structured clinical text
 * 
 * PRIMARY ENGINE: Google Gemini 1.5/2.0 Flash (Cloud AI) - Understands context, fixes typos, handles messy writing
 * FALLBACK ENGINE: Tesseract.js (Local WASM) - Works offline, privacy-first
 * 
 * Design Principle: Intelligent Transcription
 * We use the AI's medical knowledge to correct spelling and format extracted text.
 */

const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AuditLog = require('../models/AuditLog');

// Configuration
const GEMINI_MODEL_NAME = "gemini-2.0-flash"; // Or gemini-1.5-flash for stability

class HandwritingOcrService {
    constructor() {
        // Tesseract State
        this.worker = null;
        this.isTesseractInitialized = false;

        // Gemini State
        this.genAI = null;
        this.geminiModel = null;

        // Initialize Gemini immediately if key exists
        if (process.env.GOOGLE_API_KEY) {
            try {
                this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
                this.geminiModel = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
                console.log(`[HandwritingOCR] Gemini initialized with model: ${GEMINI_MODEL_NAME}`);
            } catch (error) {
                console.error('[HandwritingOCR] Failed to initialize Gemini:', error.message);
            }
        } else {
            console.warn('[HandwritingOCR] No GOOGLE_API_KEY found. Handwriting will use Tesseract (lower accuracy).');
        }
    }

    /**
     * Convert handwriting image to text
     * PRIORITIZES GEMINI -> FALLS BACK TO TESSERACT
     * 
     * @param {string} imageData - Base64 encoded image from canvas
     * @param {string} section - 'symptoms' or 'diagnosis' or 'combined'
     * @param {string} userId - User ID for audit logging
     * @returns {Object} { text: string, confidence: number, section: string, method: string }
     */
    async convertHandwriting(imageData, section = 'combined', userId = null) {
        let result = null;
        let method = 'none';
        let error = null;
        const startTime = Date.now();

        // 1. Try Gemini (Primary)
        if (this.geminiModel) {
            try {
                result = await this._convertWithGemini(imageData, section);
                method = 'gemini-cloud';
            } catch (e) {
                console.warn('[HandwritingOCR] Gemini failed, falling back to Tesseract:', e.message);
                error = e.message;
            }
        }

        // 2. Fallback to Tesseract if Gemini failed or isn't configured
        if (!result) {
            try {
                console.log('[HandwritingOCR] Attempting Tesseract fallback...');
                result = await this._convertWithTesseract(imageData);
                method = 'tesseract-local';
            } catch (e) {
                console.error('[HandwritingOCR] All OCR methods failed:', e.message);
                error = e.message;
                throw new Error('Failed to read handwriting. Please try typing instead.');
            }
        }

        const processingTime = Date.now() - startTime;

        // 3. Log Audit
        if (userId) {
            await this.logConversionAttempt(userId, section, result.confidence, processingTime, method, error);
        }

        return {
            ...result,
            section,
            method,
            processingTimeMs: processingTime
        };
    }

    /**
     * ENGINE 1: Google Gemini (High Intelligence)
     */
    async _convertWithGemini(base64Image, section) {
        // Clean base64 header
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

        // Context-aware prompt based on section
        let promptContext = "";
        if (section === 'symptoms') {
            promptContext = "The text contains a list of medical symptoms complained by a patient.";
        } else if (section === 'diagnosis') {
            promptContext = "The text contains a medical diagnosis, disease names, or condition observations.";
        } else {
            promptContext = "The text contains medical notes including symptoms and diagnoses.";
        }

        const prompt = `
            You are an expert Medical Transcriptionist AI.
            Your task is to transact text from a doctor's handwriting on a digital tablet.
            
            CONTEXT: ${promptContext}
            
            INSTRUCTIONS:
            1. Read the handwritten text in the image.
            2. Correct minor spelling errors if they are obvious medical terms (e.g., 'diabetis' -> 'diabetes').
            3. Do NOT add any conversational text like "Here is the text". Just output the transcribed text.
            4. If the text is illegible, output "[Unreadable]".
            5. Preserve formatting (newlines).

            Output ONLY the transcribed text.
        `;

        const result = await this.geminiModel.generateContent([
            prompt,
            {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "image/png"
                }
            }
        ]);

        const text = result.response.text().trim();

        return {
            text: text === "[Unreadable]" ? "" : text,
            confidence: 95, // Gemini doesn't give confidence scores, assuming high for AI
            warnings: []
        };
    }

    /**
     * ENGINE 2: Tesseract.js (Offline Fallback)
     */
    async _convertWithTesseract(base64Image) {
        await this._initTesseractWorker();

        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(cleanBase64, 'base64');

        const { data } = await this.worker.recognize(imageBuffer);

        const result = {
            text: this._cleanText(data.text),
            confidence: Math.round(data.confidence),
            warnings: []
        };

        if (data.confidence < 50) {
            result.warnings.push('Low confidence transcription (Local Engine).');
        }

        return result;
    }

    /**
     * Initialize Tesseract worker (Lazy Load)
     */
    async _initTesseractWorker() {
        if (this.isTesseractInitialized && this.worker) return;

        console.log('[HandwritingOCR] Initializing Tesseract worker...');
        this.worker = await Tesseract.createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text' && Math.random() > 0.8) {
                    console.log(`[Tesseract] Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        this.isTesseractInitialized = true;
    }

    /**
     * Convert combined canvas with separate sections (Delegates to main function)
     */
    async convertSectionedHandwriting(canvasData, userId = null) {
        const results = {
            symptoms: { text: '', confidence: 0, warnings: [] },
            diagnosis: { text: '', confidence: 0, warnings: [] }
        };

        const promises = [];

        if (canvasData.symptoms) {
            promises.push(
                this.convertHandwriting(canvasData.symptoms, 'symptoms', userId)
                    .then(r => { results.symptoms = r; })
                    .catch(e => { results.symptoms.warnings.push(e.message); })
            );
        }

        if (canvasData.diagnosis) {
            promises.push(
                this.convertHandwriting(canvasData.diagnosis, 'diagnosis', userId)
                    .then(r => { results.diagnosis = r; })
                    .catch(e => { results.diagnosis.warnings.push(e.message); })
            );
        }

        await Promise.all(promises);
        return results;
    }

    /**
     * Clean and format Tesseract text
     */
    _cleanText(rawText) {
        if (!rawText) return '';
        return rawText
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,;:()-]/g, '')
            .replace(/\s+([.,;:])/g, '$1')
            .trim();
    }

    /**
     * Log conversion attempt for audit trail
     */
    async logConversionAttempt(userId, section, confidence, processingTime, method, error = null) {
        try {
            await AuditLog.create({
                user: userId,
                action: 'HANDWRITING_OCR_CONVERSION',
                resource: 'ClinicalNotes',
                details: {
                    section,
                    confidence,
                    processingTimeMs: processingTime,
                    method,
                    success: !error,
                    error: error || null
                },
                ipAddress: 'system',
                userAgent: 'HandwritingOcrService'
            });
        } catch (logError) {
            console.error('[HandwritingOCR] Audit log failed:', logError.message);
        }
    }

    /**
     * Terminate worker to free resources
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isTesseractInitialized = false;
        }
    }
}

// Export singleton instance
module.exports = new HandwritingOcrService();
