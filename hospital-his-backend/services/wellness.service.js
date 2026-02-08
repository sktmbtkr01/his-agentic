/**
 * Wellness Agent Service
 * Handles patient context building and LLM-powered chat responses
 */

const axios = require('axios');
const WellnessConversation = require('../models/WellnessConversation');
const Patient = require('../models/Patient');
const { Signal, SIGNAL_CATEGORIES } = require('../models/Signal');
const HealthScore = require('../models/HealthScore');
const CareNudge = require('../models/CareNudge');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');

// OpenRouter Configuration (fallback)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_AGENTIC_INVENTORY_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_WELLNESS_MODEL || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Google Gemini Configuration (primary)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Emergency keywords that should trigger safety response
const EMERGENCY_KEYWORDS = [
    'chest pain', 'heart attack', 'can\'t breathe', 'difficulty breathing',
    'shortness of breath', 'severe pain', 'suicidal', 'kill myself',
    'want to die', 'overdose', 'unconscious', 'seizure', 'stroke',
    'severe bleeding', 'choking'
];

/**
 * Build patient context for LLM prompt
 * @param {string} patientId 
 * @returns {Object} Patient context
 */
const getPatientContext = async (patientId) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // Start of today (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch all context data in parallel
    const [patient, healthScore, recentSignals, activeNudges, upcomingAppointments, recentPrescriptions, recentLabTests] = await Promise.all([
        Patient.findById(patientId).select('firstName lastName dateOfBirth gender allergies medicalHistory'),
        HealthScore.findOne({ patient: patientId }).sort({ calculatedAt: -1 }),
        Signal.find({
            patient: patientId,
            isActive: true,
            recordedAt: { $gte: sevenDaysAgo },
        }).sort({ recordedAt: -1 }).limit(20),
        CareNudge.find({
            patient: patientId,
            status: 'pending',
        }).sort({ createdAt: -1 }).limit(5),
        // Include appointments from today onwards (use regex for case-insensitive status match)
        Appointment.find({
            patient: patientId,
            scheduledDate: { $gte: todayStart, $lte: thirtyDaysFromNow },
            status: { $regex: /^(scheduled|confirmed)$/i },
        }).populate('doctor', 'name firstName lastName').populate('department', 'name').sort({ scheduledDate: 1 }).limit(5),
        // Recent prescriptions (last 30 days)
        Prescription.find({
            patient: patientId,
            createdAt: { $gte: thirtyDaysAgo },
        }).populate('doctor', 'name firstName lastName').populate('medicines.medicine', 'name').sort({ createdAt: -1 }).limit(5),
        // Recent lab tests with results (last 30 days)
        LabTest.find({
            patient: patientId,
            createdAt: { $gte: thirtyDaysAgo },
            status: { $in: ['Completed', 'COMPLETED', 'Result Available'] },
        }).populate('test', 'name').sort({ completedAt: -1 }).limit(5),
    ]);

    // Calculate age
    const age = patient?.dateOfBirth
        ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    // Organize signals by category
    const symptoms = recentSignals.filter(s => s.category === SIGNAL_CATEGORIES.SYMPTOM);
    const moods = recentSignals.filter(s => s.category === SIGNAL_CATEGORIES.MOOD);
    const lifestyle = recentSignals.filter(s => s.category === SIGNAL_CATEGORIES.LIFESTYLE);

    // Format symptoms for prompt
    const symptomSummary = symptoms.length > 0
        ? symptoms.slice(0, 5).map(s => `${s.symptom?.type} (${s.symptom?.severity})`).join(', ')
        : 'No recent symptoms logged';

    // Format moods for prompt
    const moodSummary = moods.length > 0
        ? moods.slice(0, 3).map(m => `${m.mood?.type} (stress: ${m.mood?.stressLevel}/10)`).join(', ')
        : 'No recent mood logs';

    // Format lifestyle for prompt
    const lifestyleSummary = lifestyle.length > 0
        ? lifestyle.slice(0, 3).map(l => {
            const parts = [];
            if (l.lifestyle?.sleep?.duration) parts.push(`sleep: ${l.lifestyle.sleep.duration}h`);
            if (l.lifestyle?.activity?.type) parts.push(`activity: ${l.lifestyle.activity.type}`);
            return parts.join(', ');
        }).join('; ')
        : 'No recent lifestyle logs';

    // Format nudges
    const nudgeSummary = activeNudges.length > 0
        ? activeNudges.map(n => n.title).join(', ')
        : 'No active recommendations';

    // Format appointments
    const appointmentSummary = upcomingAppointments.length > 0
        ? upcomingAppointments.map(apt => {
            const date = new Date(apt.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const time = apt.scheduledTime || '';
            const doctorName = apt.doctor?.name || apt.doctor?.firstName || 'Doctor';
            const deptName = apt.department?.name || apt.type || 'General';
            return `${date}${time ? ' at ' + time : ''} - Dr. ${doctorName} (${deptName})`;
        }).join('; ')
        : 'No upcoming appointments';

    // Format prescriptions
    const prescriptionSummary = recentPrescriptions.length > 0
        ? recentPrescriptions.map(rx => {
            const date = new Date(rx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const meds = rx.medicines?.slice(0, 3).map(m => m.medicine?.name || 'Unknown').join(', ') || 'Medicines';
            return `${date}: ${meds}`;
        }).join('; ')
        : 'No recent prescriptions';

    // Format lab tests
    const labTestSummary = recentLabTests.length > 0
        ? recentLabTests.map(test => {
            const date = new Date(test.completedAt || test.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const testName = test.test?.name || 'Lab Test';
            const hasAbnormal = test.results?.some(r => r.isAbnormal);
            return `${date}: ${testName}${hasAbnormal ? ' (abnormal values)' : ''}`;
        }).join('; ')
        : 'No recent lab results';

    return {
        patient: {
            firstName: patient?.firstName || 'there',
            age: age,
            gender: patient?.gender,
            allergies: patient?.allergies || [],
            conditions: patient?.medicalHistory?.chronicConditions || [],
        },
        healthScore: {
            current: healthScore?.score || null,
            trend: healthScore?.trend?.direction || 'stable',
            summary: healthScore?.summary || 'No health score available yet.',
        },
        recentSignals: {
            symptoms: symptomSummary,
            moods: moodSummary,
            lifestyle: lifestyleSummary,
        },
        activeNudges: nudgeSummary,
        upcomingAppointments: appointmentSummary,
        appointmentCount: upcomingAppointments.length,
        recentPrescriptions: prescriptionSummary,
        prescriptionCount: recentPrescriptions.length,
        recentLabTests: labTestSummary,
        labTestCount: recentLabTests.length,
        signalCounts: {
            symptoms: symptoms.length,
            moods: moods.length,
            lifestyle: lifestyle.length,
        },
    };
};

/**
 * Check if message contains emergency keywords
 * @param {string} message 
 * @returns {boolean}
 */
const checkForEmergency = (message) => {
    const lowerMessage = message.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Build system prompt with patient context
 * @param {Object} context 
 * @returns {string}
 */
const buildSystemPrompt = (context) => {
    return `You are "Wellness", a caring AI health companion in the LifelineX patient portal.

## Your Role
- You help patients understand and improve their health
- You provide supportive, non-judgmental guidance
- You encourage healthy behaviors without being preachy
- You NEVER diagnose or prescribe - always defer to doctors for medical decisions

## Patient Context
Name: ${context.patient.firstName}
Age: ${context.patient.age || 'Unknown'}
Current Health Score: ${context.healthScore.current !== null ? `${context.healthScore.current}/100 (${context.healthScore.trend})` : 'Not yet calculated'}
Health Summary: ${context.healthScore.summary}
Recent Symptoms (7 days): ${context.recentSignals.symptoms}
Recent Mood (7 days): ${context.recentSignals.moods}
Lifestyle Patterns: ${context.recentSignals.lifestyle}
Upcoming Appointments: ${context.upcomingAppointments}
Recent Prescriptions (30 days): ${context.recentPrescriptions}
Recent Lab Results (30 days): ${context.recentLabTests}
Active Recommendations: ${context.activeNudges}

## Communication Guidelines
1. Keep responses SHORT (2-3 sentences max unless asked for detail)
2. Use warm, conversational tone - like a supportive friend
3. Ask clarifying questions when needed
4. Celebrate small wins ("Great job logging today!")
5. When concerned, suggest talking to doctor without alarming
6. Suggest relevant actions when appropriate

## Response Format
- Be conversational, not clinical
- Use simple language, avoid medical jargon
- Include one suggested action when relevant (but don't force it)
- Never start with "As an AI..." or similar phrases
- Use occasional emojis sparingly for warmth (1-2 max per message)

## Safety Rules (CRITICAL)
- NEVER provide specific dosage recommendations
- NEVER diagnose conditions
- If patient describes emergency symptoms (chest pain, difficulty breathing, suicidal thoughts, etc.), 
  IMMEDIATELY advise calling emergency services (911) and express serious concern
- Always encourage consulting healthcare providers for medical questions
- If unsure about medical advice, say "I'd recommend discussing this with your doctor"

## Example Good Responses
- "You're doing well, ${context.patient.firstName}! Your score is holding steady. 💪"
- "I hear you. That sounds tough. Have you been able to rest today?"
- "Great question! I'd suggest logging how you're feeling so we can track patterns together."`;
};

/**
 * Generate response using LLM
 * @param {Object} context Patient context
 * @param {string} userMessage User's message
 * @param {Array} conversationHistory Previous messages
 * @returns {Object} Generated response with metadata
 */
const generateResponse = async (context, userMessage, conversationHistory = []) => {
    // Check for emergency first
    const isEmergency = checkForEmergency(userMessage);

    if (isEmergency) {
        return {
            response: `I'm very concerned about what you're describing. ${context.patient.firstName}, please call 911 or go to the emergency room immediately. These symptoms need urgent medical attention.\n\n⚠️ If you're in the US, you can also call the National Crisis Hotline: 988\n\nIs there someone with you who can help right now?`,
            sentiment: 'concerned',
            isEmergency: true,
            suggestedActions: [{
                type: 'call_emergency',
                label: 'Call 911',
                route: 'tel:911',
            }],
        };
    }

    // Try Gemini first, then OpenRouter, then mock
    if (GOOGLE_API_KEY) {
        try {
            return await generateWithGemini(context, userMessage, conversationHistory);
        } catch (error) {
            console.error('[Wellness] Gemini Error:', error.response?.data || error.message);
            // Fall through to OpenRouter
        }
    }

    if (OPENROUTER_API_KEY) {
        try {
            return await generateWithOpenRouter(context, userMessage, conversationHistory);
        } catch (error) {
            console.error('[Wellness] OpenRouter Error:', error.response?.data || error.message);
            // Fall through to mock
        }
    }

    console.log('[Wellness] Falling back to mock response');
    return getMockResponse(context, userMessage);
};

/**
 * Generate response using Google Gemini
 */
const generateWithGemini = async (context, userMessage, conversationHistory) => {
    const systemPrompt = buildSystemPrompt(context);

    // Build conversation for Gemini format
    const contents = [];
    
    // Add conversation history
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
        if (msg.role !== 'system') {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            });
        }
    }

    // Add current user message
    contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
    });

    const response = await axios.post(
        `${GEMINI_BASE_URL}?key=${GOOGLE_API_KEY}`,
        {
            contents: contents,
            systemInstruction: {
                parts: [{ text: systemPrompt }],
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            },
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
        throw new Error('Empty response from Gemini');
    }

    console.log(`[Wellness] Response generated using Gemini ${GEMINI_MODEL}`);
    return processLLMResponse(content, userMessage, context);
};

/**
 * Generate response using OpenRouter
 */
const generateWithOpenRouter = async (context, userMessage, conversationHistory) => {
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array with history
    const messages = [
        { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
        if (msg.role !== 'system') {
            messages.push({
                role: msg.role,
                content: msg.content,
            });
        }
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    const response = await axios.post(
        OPENROUTER_BASE_URL,
        {
            model: OPENROUTER_MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
        },
        {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5001',
                'X-Title': 'LifelineX Wellness Agent',
            },
        }
    );

    const content = response.data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('Empty response from OpenRouter');
    }

    console.log(`[Wellness] Response generated using OpenRouter ${OPENROUTER_MODEL}`);
    return processLLMResponse(content, userMessage, context);
};

/**
 * Process LLM response and extract metadata
 */
const processLLMResponse = (content, userMessage, context) => {
    // Determine sentiment based on response content
    let sentiment = 'neutral';
    if (content.includes('great') || content.includes('well done') || content.includes('💪') || content.includes('🎉')) {
        sentiment = 'positive';
    } else if (content.includes('concerned') || content.includes('recommend') || content.includes('doctor')) {
        sentiment = 'concerned';
    }

    // Extract suggested actions based on context
    const suggestedActions = extractSuggestedActions(content, userMessage, context);

    return {
        response: content,
        sentiment: sentiment,
        isEmergency: false,
        suggestedActions: suggestedActions,
    };
};

/**
 * Extract suggested actions from response and context
 * @param {string} response LLM response
 * @param {string} userMessage User's original message
 * @param {Object} context Patient context
 * @returns {Array} Suggested actions
 */
const extractSuggestedActions = (response, userMessage, context) => {
    const actions = [];
    const lowerResponse = response.toLowerCase();
    const lowerMessage = userMessage.toLowerCase();

    // Check for symptom-related suggestions
    if (lowerResponse.includes('symptom') || lowerResponse.includes('feeling') ||
        lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('sick')) {
        actions.push({
            type: 'log_symptom',
            label: 'Log Symptom',
            route: '/log-symptom',
        });
    }

    // Check for mood-related suggestions
    if (lowerResponse.includes('mood') || lowerResponse.includes('stress') || lowerResponse.includes('feeling') ||
        lowerMessage.includes('stressed') || lowerMessage.includes('anxious') || lowerMessage.includes('sad')) {
        actions.push({
            type: 'log_mood',
            label: 'Log Mood',
            route: '/log-mood',
        });
    }

    // Check for lifestyle-related suggestions
    if (lowerResponse.includes('sleep') || lowerResponse.includes('exercise') || lowerResponse.includes('activity') ||
        lowerMessage.includes('tired') || lowerMessage.includes('sleep') || lowerMessage.includes('exercise')) {
        actions.push({
            type: 'log_lifestyle',
            label: 'Log Lifestyle',
            route: '/log-lifestyle',
        });
    }

    // If asking about health score
    if (lowerMessage.includes('score') || lowerMessage.includes('how am i doing')) {
        actions.push({
            type: 'view_score',
            label: 'View Health Score',
            route: '/dashboard',
        });
    }

    // Check for appointment-related suggestions
    if (lowerResponse.includes('appointment') || lowerResponse.includes('doctor') || lowerResponse.includes('visit') ||
        lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
        if (context.appointmentCount > 0) {
            actions.push({
                type: 'view_appointments',
                label: 'View Appointments',
                route: '/appointments',
            });
        } else {
            actions.push({
                type: 'book_appointment',
                label: 'Book Appointment',
                route: '/book-appointment',
            });
        }
    }

    // Check for prescription-related suggestions
    if (lowerResponse.includes('prescription') || lowerResponse.includes('medicine') || lowerResponse.includes('medication') ||
        lowerMessage.includes('prescription') || lowerMessage.includes('medicine') || lowerMessage.includes('medication')) {
        actions.push({
            type: 'view_prescriptions',
            label: 'View Prescriptions',
            route: '/prescriptions',
        });
    }

    // Check for lab result suggestions
    if (lowerResponse.includes('lab') || lowerResponse.includes('test') || lowerResponse.includes('result') ||
        lowerMessage.includes('lab') || lowerMessage.includes('test result') || lowerMessage.includes('blood')) {
        actions.push({
            type: 'view_lab_results',
            label: 'View Lab Results',
            route: '/lab-results',
        });
    }

    // Limit to 2 actions
    return actions.slice(0, 2);
};

/**
 * Mock response when API not available
 * @param {Object} context 
 * @param {string} userMessage 
 * @returns {Object}
 */
const getMockResponse = (context, userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    const name = context.patient.firstName;

    // Health score question
    if (lowerMessage.includes('how am i') || lowerMessage.includes('score') || lowerMessage.includes('doing')) {
        const score = context.healthScore.current;
        if (score !== null) {
            return {
                response: `You're doing ${score >= 70 ? 'well' : 'okay'}, ${name}! Your health score is ${score}/100 and it's ${context.healthScore.trend}. ${context.healthScore.summary}`,
                sentiment: score >= 70 ? 'positive' : 'neutral',
                isEmergency: false,
                suggestedActions: [{
                    type: 'view_score',
                    label: 'View Details',
                    route: '/dashboard',
                }],
            };
        }
    }

    // Feeling unwell
    if (lowerMessage.includes('not feeling') || lowerMessage.includes('sick') || lowerMessage.includes('pain')) {
        return {
            response: `I'm sorry to hear that, ${name}. Would you like to log your symptoms so we can track how you're feeling? This can help your doctor understand your patterns better.`,
            sentiment: 'concerned',
            isEmergency: false,
            suggestedActions: [{
                type: 'log_symptom',
                label: 'Log Symptom',
                route: '/log-symptom',
            }],
        };
    }

    // Greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return {
            response: `Hi ${name}! 👋 I'm Wellness, your health companion. How are you feeling today?`,
            sentiment: 'positive',
            isEmergency: false,
            suggestedActions: [],
        };
    }

    // Appointment questions
    if (lowerMessage.includes('appointment') || lowerMessage.includes('doctor visit') || lowerMessage.includes('when is my')) {
        if (context.appointmentCount > 0) {
            return {
                response: `You have ${context.appointmentCount} upcoming appointment${context.appointmentCount > 1 ? 's' : ''}, ${name}! 📅 ${context.upcomingAppointments}`,
                sentiment: 'positive',
                isEmergency: false,
                suggestedActions: [{
                    type: 'view_appointments',
                    label: 'View Appointments',
                    route: '/appointments',
                }],
            };
        } else {
            return {
                response: `You don't have any upcoming appointments scheduled, ${name}. Would you like to book one?`,
                sentiment: 'neutral',
                isEmergency: false,
                suggestedActions: [{
                    type: 'book_appointment',
                    label: 'Book Appointment',
                    route: '/book-appointment',
                }],
            };
        }
    }

    // Prescription questions
    if (lowerMessage.includes('prescription') || lowerMessage.includes('medicine') || lowerMessage.includes('medication') || lowerMessage.includes('drug')) {
        if (context.prescriptionCount > 0) {
            return {
                response: `You have ${context.prescriptionCount} recent prescription${context.prescriptionCount > 1 ? 's' : ''}, ${name}! 💊 ${context.recentPrescriptions}`,
                sentiment: 'positive',
                isEmergency: false,
                suggestedActions: [{
                    type: 'view_prescriptions',
                    label: 'View Prescriptions',
                    route: '/prescriptions',
                }],
            };
        } else {
            return {
                response: `You don't have any recent prescriptions in the last 30 days, ${name}. If you need medication, please consult with your doctor.`,
                sentiment: 'neutral',
                isEmergency: false,
                suggestedActions: [{
                    type: 'book_appointment',
                    label: 'Book Appointment',
                    route: '/book-appointment',
                }],
            };
        }
    }

    // Lab result questions
    if (lowerMessage.includes('lab') || lowerMessage.includes('test result') || lowerMessage.includes('blood test') || lowerMessage.includes('report')) {
        if (context.labTestCount > 0) {
            return {
                response: `You have ${context.labTestCount} recent lab result${context.labTestCount > 1 ? 's' : ''}, ${name}! 🔬 ${context.recentLabTests}`,
                sentiment: 'positive',
                isEmergency: false,
                suggestedActions: [{
                    type: 'view_lab_results',
                    label: 'View Lab Results',
                    route: '/lab-results',
                }],
            };
        } else {
            return {
                response: `You don't have any recent lab results in the last 30 days, ${name}. If your doctor ordered tests, results may still be processing.`,
                sentiment: 'neutral',
                isEmergency: false,
                suggestedActions: [{
                    type: 'view_appointments',
                    label: 'View Appointments',
                    route: '/appointments',
                }],
            };
        }
    }

    // Default response
    return {
        response: `Thanks for sharing that, ${name}. Is there anything specific about your health I can help you with today? I can help you log symptoms, track your mood, or understand your health patterns.`,
        sentiment: 'neutral',
        isEmergency: false,
        suggestedActions: [
            { type: 'log_symptom', label: 'Log Symptom', route: '/log-symptom' },
            { type: 'log_mood', label: 'Log Mood', route: '/log-mood' },
        ],
    };
};

/**
 * Process a chat message
 * @param {string} patientId 
 * @param {string} message 
 * @param {string} conversationId Optional
 * @returns {Object} Response with conversation data
 */
const processMessage = async (patientId, message, conversationId = null) => {
    // Get or create conversation
    let conversation;

    if (conversationId) {
        conversation = await WellnessConversation.findOne({
            conversationId: conversationId,
            patient: patientId,
        });
    }

    if (!conversation) {
        conversation = await WellnessConversation.getActiveConversation(patientId);
    }

    // Get patient context
    const context = await getPatientContext(patientId);

    // If no active conversation, create one
    if (!conversation) {
        conversation = await WellnessConversation.create({
            patient: patientId,
            context: {
                healthScoreAtStart: context.healthScore.current,
                triggeredBy: 'user_initiated',
            },
            messages: [],
        });
    }

    // Add user message
    conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
    });

    // Generate response
    const responseData = await generateResponse(context, message, conversation.messages);

    // Add assistant response
    conversation.messages.push({
        role: 'assistant',
        content: responseData.response,
        timestamp: new Date(),
        metadata: {
            sentiment: responseData.sentiment,
            suggestedActions: responseData.suggestedActions,
            isEmergency: responseData.isEmergency,
        },
    });

    // Update conversation
    conversation.lastActivity = new Date();
    await conversation.save();

    return {
        response: responseData.response,
        conversationId: conversation.conversationId,
        sentiment: responseData.sentiment,
        suggestedActions: responseData.suggestedActions,
        isEmergency: responseData.isEmergency,
    };
};

/**
 * Get conversation history
 * @param {string} patientId 
 * @param {string} conversationId 
 * @returns {Object} Conversation data
 */
const getConversationHistory = async (patientId, conversationId) => {
    const conversation = await WellnessConversation.findOne({
        conversationId: conversationId,
        patient: patientId,
    });

    if (!conversation) {
        return null;
    }

    return {
        conversationId: conversation.conversationId,
        messages: conversation.messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            sentiment: m.metadata?.sentiment,
            suggestedActions: m.metadata?.suggestedActions,
        })),
        status: conversation.status,
        createdAt: conversation.createdAt,
    };
};

/**
 * Start a new conversation with greeting
 * @param {string} patientId 
 * @returns {Object} New conversation with greeting
 */
const startConversation = async (patientId) => {
    // Get context
    const context = await getPatientContext(patientId);

    // Create new conversation
    const conversation = await WellnessConversation.create({
        patient: patientId,
        context: {
            healthScoreAtStart: context.healthScore.current,
            triggeredBy: 'user_initiated',
        },
        messages: [],
    });

    // Generate personalized greeting
    let greeting = `Hi ${context.patient.firstName}! 👋 I'm Wellness, your health companion. How can I help you today?`;

    // Add context-aware greeting variations
    if (context.healthScore.current !== null) {
        if (context.healthScore.current >= 80) {
            greeting = `Hi ${context.patient.firstName}! 👋 Great to see you! Your health score is looking strong at ${context.healthScore.current}. What can I help you with?`;
        } else if (context.healthScore.current < 60) {
            greeting = `Hi ${context.patient.firstName}! 👋 I noticed your health score has dipped a bit. Want to chat about how you're feeling?`;
        }
    }

    // Add greeting as assistant message
    conversation.messages.push({
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        metadata: {
            sentiment: 'positive',
            suggestedActions: [],
        },
    });

    await conversation.save();

    return {
        conversationId: conversation.conversationId,
        greeting: greeting,
        context: {
            healthScore: context.healthScore.current,
            trend: context.healthScore.trend,
        },
    };
};

module.exports = {
    getPatientContext,
    processMessage,
    startConversation,
    getConversationHistory,
    generateResponse,
    checkForEmergency,
};
