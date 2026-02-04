/**
 * LLM Client Service - Lab Report Summarization
 * Uses Google Gemini API (primary) with OpenRouter as fallback
 */

const axios = require('axios');

// Google Gemini Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// OpenRouter Configuration (fallback)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Build the prompt for lab report summarization
 */
const buildPrompt = (extractedText) => `You are a clinical lab report analyzer helping physicians quickly understand lab results.

LAB DATA:
${extractedText}

Note: The data above may include manually entered lab values (with NORMAL/ABNORMAL/CRITICAL flags) and/or text extracted from a PDF report. Analyze all available information.

INSTRUCTIONS:
- Write a clear, concise summary in PARAGRAPH format
- Use bullet points only when listing multiple abnormal values
- Start with an overall assessment paragraph
- Highlight critical/abnormal findings with clinical significance
- Mention normal results briefly
- End with clinical recommendations if applicable

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
    "summary": "A 2-3 paragraph clinical summary of the lab report. First paragraph: Overall assessment and key findings. Second paragraph: Details on any abnormal values and their clinical significance. Third paragraph (if needed): Recommendations or observations.",
    "abnormalValues": [
        {"parameter": "Parameter Name", "value": "Measured Value", "significance": "Brief clinical significance"}
    ],
    "overallStatus": "normal|attention_needed|critical",
    "clinicalRecommendation": "Any suggested follow-up or clinical action",
    "disclaimer": "AI-generated summary. Not a diagnosis. Doctor must verify."
}`;

/**
 * Summarize using Google Gemini API
 */
const summarizeWithGemini = async (extractedText) => {
    const prompt = buildPrompt(extractedText);

    const response = await axios.post(
        `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
        {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2000,
            }
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 60000
        }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
        throw new Error('Empty response from Gemini');
    }

    return {
        content,
        model: GEMINI_MODEL,
        provider: 'gemini'
    };
};

/**
 * Summarize using OpenRouter API (fallback)
 */
const summarizeWithOpenRouter = async (extractedText) => {
    const prompt = buildPrompt(extractedText);

    const response = await axios.post(
        OPENROUTER_BASE_URL,
        {
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        },
        {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://his-agentic.vercel.app',
                'X-Title': 'Hospital HIS Lab Report Summarizer',
            },
            timeout: 60000
        }
    );

    const content = response.data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('Empty response from OpenRouter');
    }

    return {
        content,
        model: OPENROUTER_MODEL,
        provider: 'openrouter'
    };
};

/**
 * Parse JSON from LLM response (handle markdown wrapping)
 */
const parseJsonResponse = (content) => {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    return JSON.parse(jsonStr);
};

/**
 * Summarize a lab report using available LLM
 * Priority: Gemini (if GOOGLE_API_KEY) -> OpenRouter (if OPENROUTER_API_KEY) -> Mock
 * 
 * @param {string} extractedText - Raw text extracted from the PDF
 * @returns {Promise<Object>} - Structured summary JSON
 */
const summarizeLabReport = async (extractedText) => {
    // Try Gemini first (primary)
    if (GOOGLE_API_KEY) {
        try {
            console.log('[LLM] Using Google Gemini for summarization...');
            const result = await summarizeWithGemini(extractedText);
            const summary = parseJsonResponse(result.content);
            summary.generatedAt = new Date().toISOString();
            summary.model = result.model;
            summary.provider = result.provider;
            console.log(`[LLM] Summary generated successfully using ${result.model}`);
            return summary;
        } catch (error) {
            console.error('[LLM] Gemini API error:', error.response?.data || error.message);
            console.log('[LLM] Falling back to OpenRouter...');
        }
    }

    // Try OpenRouter as fallback
    if (OPENROUTER_API_KEY) {
        try {
            console.log('[LLM] Using OpenRouter for summarization...');
            const result = await summarizeWithOpenRouter(extractedText);
            const summary = parseJsonResponse(result.content);
            summary.generatedAt = new Date().toISOString();
            summary.model = result.model;
            summary.provider = result.provider;
            console.log(`[LLM] Summary generated successfully using ${result.model}`);
            return summary;
        } catch (error) {
            console.error('[LLM] OpenRouter API error:', error.response?.data || error.message);
        }
    }

    // No API keys configured or all failed
    if (!GOOGLE_API_KEY && !OPENROUTER_API_KEY) {
        console.warn('[LLM] No API keys configured, returning mock summary');
        return getMockSummary();
    }

    throw new Error('All LLM providers failed. Please check API keys and try again.');
};

/**
 * Fallback mock summary when API is not configured
 */
const getMockSummary = () => ({
    summary: "API keys not configured. This is mock data for testing purposes. Please configure GOOGLE_API_KEY or OPENROUTER_API_KEY in environment variables.",
    keyFindings: [
        {
            parameter: "Hemoglobin",
            value: "14.2 g/dL",
            referenceRange: "12.0-17.5 g/dL",
            status: "normal",
        },
    ],
    abnormalValues: [],
    overallStatus: "normal",
    clinicalRecommendation: "No action needed (mock data)",
    disclaimer: "AI-generated summary. Not a diagnosis. Doctor must verify.",
    generatedAt: new Date().toISOString(),
    model: "mock",
    provider: "mock"
});

module.exports = {
    summarizeLabReport,
};
