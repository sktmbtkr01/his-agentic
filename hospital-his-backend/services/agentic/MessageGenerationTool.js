/**
 * MessageGenerationTool - The Agent's "Voice"
 * 
 * PURPOSE: Generate personalized, contextual nudge messages using LLM.
 * 
 * KEY INSIGHT: Generic messages get ignored. Personalized messages get action.
 * 
 * Example:
 *   Generic: "Remember to log your health today!"
 *   Personalized: "Hey Sarah, your sleep has been around 5 hours this week. 
 *                 Want to log how you slept last night?"
 * 
 * The LLM receives:
 * 1. Patient context (name, health score, recent patterns)
 * 2. Selected nudge type and why it was selected
 * 3. Risk assessment explaining the concern
 * 
 * And generates a warm, personalized message.
 */

const axios = require('axios');

// LLM Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Fallback templates when LLM is unavailable
const FALLBACK_TEMPLATES = {
    missing_log: {
        title: 'Time to Check In',
        message: "You haven't logged in a while. How are you feeling today?",
        actionLabel: 'Log Now',
        actionLink: '/log-symptom',
    },
    declining_score: {
        title: 'Health Check',
        message: "Your health score has been trending down. Let's take a look together.",
        actionLabel: 'View Details',
        actionLink: '/dashboard',
    },
    improving_score: {
        title: 'Great Progress! 🎉',
        message: "Your health score is improving! Keep up the great work.",
        actionLabel: 'View Score',
        actionLink: '/dashboard',
    },
    sleep_deficit: {
        title: 'Rest Matters',
        message: "Your sleep has been below optimal this week. Rest is key to feeling your best.",
        actionLabel: 'Log Sleep',
        actionLink: '/log-lifestyle',
    },
    mood_pattern: {
        title: 'How Are You Feeling?',
        message: "I noticed some patterns in your mood lately. Want to talk about it?",
        actionLabel: 'Log Mood',
        actionLink: '/log-mood',
    },
    streak_celebration: {
        title: 'Amazing Streak! 🔥',
        message: "You've been logging consistently. That dedication is inspiring!",
        actionLabel: 'Keep Going',
        actionLink: '/dashboard',
    },
    appointment_reminder: {
        title: 'Appointment Coming Up',
        message: "Don't forget your upcoming appointment. Any questions to prepare?",
        actionLabel: 'View Details',
        actionLink: '/appointments',
    },
    symptom_followup: {
        title: 'Checking In',
        message: "How are those symptoms you logged earlier? Any changes?",
        actionLabel: 'Update',
        actionLink: '/log-symptom',
    },
    wellness_checkin: {
        title: 'Hey There 👋',
        message: "Just checking in! How's everything going?",
        actionLabel: 'Chat',
        actionLink: '/wellness',
    },
};

class MessageGenerationTool {
    constructor() {
        this.name = 'MessageGenerationTool';
        this.description = 'Generates personalized nudge messages using LLM';
    }

    /**
     * Generate a personalized nudge message
     * 
     * @param {Object} context - Raw patient context
     * @param {Object} features - ML features
     * @param {Object} selectedNudge - The selected nudge type and metadata
     * @param {Array} risks - Relevant risks from assessment
     * @returns {Object} Generated message with title, message, action
     */
    async execute(context, features, selectedNudge, risks) {
        console.log(`[MessageGenerationTool] Generating ${selectedNudge.type} message...`);

        // Try LLM generation first
        if (GOOGLE_API_KEY) {
            try {
                const llmMessage = await this._generateWithLLM(context, features, selectedNudge, risks);
                if (llmMessage) {
                    console.log(`[MessageGenerationTool] LLM generated: "${llmMessage.title}"`);
                    return {
                        ...llmMessage,
                        generationSource: 'llm_generated',
                    };
                }
            } catch (error) {
                console.error('[MessageGenerationTool] LLM failed:', error.message);
            }
        }

        // Fallback to template
        console.log(`[MessageGenerationTool] Using fallback template`);
        const template = FALLBACK_TEMPLATES[selectedNudge.type] || FALLBACK_TEMPLATES.wellness_checkin;
        return {
            ...template,
            reasoning: this._generateBasicReasoning(selectedNudge.type, risks),
            generationSource: 'template',
        };
    }

    /**
     * Generate message using LLM
     */
    async _generateWithLLM(context, features, selectedNudge, risks) {
        const prompt = this._buildPrompt(context, features, selectedNudge, risks);

        const response = await axios.post(
            `${GEMINI_BASE_URL}?key=${GOOGLE_API_KEY}`,
            {
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Generate the nudge message now.' }],
                }],
                systemInstruction: {
                    parts: [{ text: prompt }],
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 400,
                },
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
        );

        const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) return null;

        // Parse JSON response
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonStr);
    }

    /**
     * Build the LLM prompt with full context
     */
    _buildPrompt(context, features, selectedNudge, risks) {
        const { raw } = context;
        const patient = raw.patient || {};

        return `You are generating a personalized health nudge for a patient wellness app.

## Patient Context
- Name: ${patient.firstName || 'there'}
- Health Score: ${features.healthScore}/100
- Score Trend: ${features.healthScoreTrend}
- Days Since Last Log: ${features.daysSinceLastLog}
- Average Sleep (7d): ${features.avgSleep7d} hours
- Average Mood (7d): ${features.avgMood7d}/5
- Logging Consistency: ${Math.round(features.loggingConsistency * 100)}%

## Selected Nudge Type: ${selectedNudge.type}
## Why This Nudge Was Selected:
${risks.map(r => `- ${r.reason} (${r.severity})`).join('\n') || '- General wellness check-in'}

## Guidelines
1. Keep the message SHORT (1-2 sentences max)
2. Be warm, encouraging, NEVER preachy or guilt-inducing
3. Reference specific patient data naturally
4. Include a clear but gentle call-to-action
5. Use at most 1 emoji
6. Never diagnose or give medical advice
7. Feel like a supportive friend, not a robot

## Action Links by Nudge Type
- missing_log, symptom_followup: /log-symptom
- sleep_deficit: /log-lifestyle  
- mood_pattern: /log-mood
- declining_score, improving_score, streak_celebration: /dashboard
- appointment_reminder: /appointments
- wellness_checkin: /wellness

## Output Format (JSON only, no markdown code blocks)
{
  "title": "Short catchy title (3-5 words)",
  "message": "Personalized nudge message (1-2 sentences)",
  "reasoning": "Brief internal explanation of why this nudge was generated",
  "actionLabel": "Button text (2-3 words)",
  "actionLink": "/appropriate-route"
}`;
    }

    /**
     * Generate basic reasoning when not using LLM
     */
    _generateBasicReasoning(nudgeType, risks) {
        if (risks.length === 0) {
            return 'Regular wellness check-in';
        }
        return risks.map(r => r.reason).join('; ');
    }

    /**
     * Validate generated message meets quality standards
     */
    validateMessage(message) {
        const issues = [];

        if (!message.title || message.title.length > 50) {
            issues.push('Title missing or too long');
        }
        if (!message.message || message.message.length > 200) {
            issues.push('Message missing or too long');
        }
        if (!message.actionLabel) {
            issues.push('Action label missing');
        }

        // Check for problematic content
        const badPatterns = [
            /you should/i,
            /you need to/i,
            /you must/i,
            /don't forget/i,  // Slightly naggy
            /as an ai/i,
            /i'm an ai/i,
        ];
        
        for (const pattern of badPatterns) {
            if (pattern.test(message.message)) {
                issues.push(`Message contains problematic pattern: ${pattern}`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
        };
    }
}

module.exports = new MessageGenerationTool();
