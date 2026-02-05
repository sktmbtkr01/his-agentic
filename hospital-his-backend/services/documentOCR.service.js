/**
 * AI-Powered Document OCR Service
 * Uses Python microservice with Google Gemini Vision for handwritten prescriptions
 * Falls back to local processing if microservice is unavailable
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// OCR Microservice URL
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8002';

/**
 * Extract text from image using Python OCR microservice
 */
const extractTextFromImage = async (imagePath) => {
    try {
        // First, try the Python OCR microservice (Gemini Vision + TrOCR)
        const result = await extractWithMicroservice(imagePath);
        if (result.success) {
            return result;
        }
    } catch (error) {
        console.log('[OCR] Microservice unavailable, trying direct Gemini API...');
    }
    
    // Fallback: Try direct Google Gemini API
    try {
        const result = await extractWithGeminiDirect(imagePath);
        if (result.success) {
            return result;
        }
    } catch (error) {
        console.log('[OCR] Direct Gemini failed:', error.message);
    }
    
    // Final fallback
    return {
        success: false,
        rawText: '',
        confidence: 0,
        method: 'none',
        error: 'All OCR methods failed. Please ensure OCR service is running.'
    };
};

/**
 * Call Python OCR microservice
 */
const extractWithMicroservice = async (imagePath) => {
    const absolutePath = path.resolve(imagePath);
    
    // Create form data with file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(absolutePath));
    
    const response = await axios.post(`${OCR_SERVICE_URL}/ocr`, formData, {
        headers: {
            ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout for large images
    });
    
    const data = response.data;
    
    return {
        success: data.success,
        rawText: data.text || '',
        medications: data.medications || [],
        summary: data.summary || '',
        patientFriendlyExplanation: data.patientFriendlyExplanation || '',
        confidence: data.confidence || 85,
        method: data.method || 'microservice'
    };
};

/**
 * Direct Google Gemini API call (fallback if microservice is down)
 */
const extractWithGeminiDirect = async (imagePath) => {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY not configured');
    }
    
    console.log('[OCR] Using Gemini API with key:', GOOGLE_API_KEY.substring(0, 10) + '...');
    
    const absolutePath = path.resolve(imagePath);
    const imageBuffer = fs.readFileSync(absolutePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determine mime type
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    
    // Try different Gemini model endpoints (newest first)
    const models = [
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash-001'
    ];
    
    let lastError = null;
    
    for (const model of models) {
        try {
            console.log(`[OCR] Trying model: ${model}`);
            
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
                {
                    contents: [{
                        parts: [
                            {
                                text: `You are a medical prescription OCR specialist. Extract ALL text from this prescription image.

INSTRUCTIONS:
1. Read every piece of text, including handwritten text in any language
2. For prescriptions, identify:
   - Doctor's name and credentials
   - Patient name (if visible)  
   - Date
   - Each medication with dosage and frequency
   - Any special instructions
3. Preserve the structure and layout

OUTPUT FORMAT:

---EXTRACTED TEXT---
[Full extracted text]

---MEDICATIONS---
1. [Medicine Name] - [Dosage] - [Frequency/Instructions]

---PATIENT FRIENDLY EXPLANATION---
[Explain each medication in simple terms, e.g., "Take Paracetamol 500mg twice daily - once in the morning and once at night"]

---SUMMARY---
[Brief summary of what this document is]`
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000,
                }
            );
            
            const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (text) {
                console.log(`[OCR] Gemini ${model} succeeded! Response length: ${text.length}`);
                
                // Parse the response
                const result = parseGeminiResponse(text);
                
                return {
                    success: true,
                    rawText: result.extractedText,
                    medications: result.medications,
                    summary: result.summary,
                    patientFriendlyExplanation: result.patientFriendly,
                    confidence: 85,
                    method: 'gemini-direct'
                };
            }
        } catch (error) {
            console.log(`[OCR] Model ${model} failed:`, error.response?.status, error.response?.data?.error?.message || error.message);
            lastError = error;
        }
    }
    
    // All models failed
    throw lastError || new Error('All Gemini models failed');
};

/**
 * Parse Gemini response into structured data
 */
const parseGeminiResponse = (response) => {
    const result = {
        extractedText: '',
        medications: [],
        summary: '',
        patientFriendly: ''
    };
    
    // Extract sections
    const extractedMatch = response.match(/---EXTRACTED TEXT---\s*([\s\S]*?)(?=---MEDICATIONS---|---SUMMARY---|---PATIENT FRIENDLY|$)/i);
    if (extractedMatch) {
        result.extractedText = extractedMatch[1].trim();
    }
    
    const medicationsMatch = response.match(/---MEDICATIONS---\s*([\s\S]*?)(?=---SUMMARY---|---PATIENT FRIENDLY|$)/i);
    if (medicationsMatch) {
        const medsText = medicationsMatch[1].trim();
        const medLines = medsText.split('\n').filter(line => line.trim());
        result.medications = medLines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(m => m);
    }
    
    const summaryMatch = response.match(/---SUMMARY---\s*([\s\S]*?)(?=---PATIENT FRIENDLY|$)/i);
    if (summaryMatch) {
        result.summary = summaryMatch[1].trim();
    }
    
    const patientFriendlyMatch = response.match(/---PATIENT FRIENDLY EXPLANATION---\s*([\s\S]*?)(?=---SUMMARY---|$)/i);
    if (patientFriendlyMatch) {
        result.patientFriendly = patientFriendlyMatch[1].trim();
    }
    
    // If no structured output, use whole response
    if (!result.extractedText) {
        result.extractedText = response;
    }
    
    return result;
};

/**
 * Translate prescription abbreviations
 */
const translatePrescription = async (prescriptionText) => {
    try {
        const response = await axios.post(`${OCR_SERVICE_URL}/translate`, {
            text: prescriptionText
        }, { timeout: 30000 });
        
        return {
            success: true,
            translation: response.data.translation
        };
    } catch (error) {
        console.error('Translation Error:', error.message);
        return {
            success: false,
            translation: prescriptionText,
            error: error.message
        };
    }
};

/**
 * Summarize lab report
 */
const summarizeLabReport = async (labReportText) => {
    // Use Gemini for summarization
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
        return { success: false, summary: '', error: 'API key not configured' };
    }
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: `Explain this lab report in simple, patient-friendly language.

For each test result:
1. Explain what the test measures
2. Whether the value is normal, high, or low
3. What abnormal values might mean
4. Always remind to consult doctor for proper interpretation

Lab Report:
${labReportText}`
                    }]
                }]
            },
            { timeout: 30000 }
        );
        
        const summary = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        return {
            success: true,
            summary
        };
    } catch (error) {
        console.error('Lab Summary Error:', error.message);
        return {
            success: false,
            summary: '',
            error: error.message
        };
    }
};

module.exports = {
    extractTextFromImage,
    translatePrescription,
    summarizeLabReport
};
