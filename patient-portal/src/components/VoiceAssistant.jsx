/**
 * Voice Assistant Component for Patient Portal
 * Floating voice assistant for booking appointments via voice
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Phone, PhoneOff, Send, Volume2, VolumeX,
    Bot, User, X, MessageCircle, Loader2, Sparkles
} from 'lucide-react';
import voiceAgentService from '../services/voiceAgentService';

// Chat Message Component
const ChatMessage = ({ message, isAgent }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${isAgent ? 'justify-start' : 'justify-end'}`}
        >
            {isAgent && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                </div>
            )}
            <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isAgent
                    ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-tr-none'
                    }`}
            >
                {message.text}
            </div>
            {!isAgent && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User size={16} className="text-white" />
                </div>
            )}
        </motion.div>
    );
};

const VoiceAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [context, setContext] = useState({});

    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Speech synthesis
    const synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check connection on mount
    useEffect(() => {
        checkConnection();
        const interval = setInterval(checkConnection, 15000);
        return () => clearInterval(interval);
    }, []);

    const checkConnection = async () => {
        try {
            const health = await voiceAgentService.checkHealth();
            setIsConnected(health.status === 'healthy');
        } catch {
            setIsConnected(false);
        }
    };

    // Speak text using browser TTS
    const speak = useCallback((text) => {
        if (!synthesis || isMuted) return;

        synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 1.0;

        const voices = synthesis.getVoices();
        const voice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        synthesis.speak(utterance);
    }, [synthesis, isMuted]);

    // Voice recording with Browser SpeechRecognition
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize SpeechRecognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript.trim()) {
                    handleSendMessage(transcript);
                }
                setIsRecording(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
                if (event.error !== 'no-speech') {
                    addSystemMessage('❌ Microphone error. Please try typing.');
                }
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, [sessionId]); // Re-bind if session changes, though refs are stable

    const startRecording = () => {
        if (!recognitionRef.current) {
            addSystemMessage('❌ Voice input not supported in this browser.');
            return;
        }

        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Start recording error:', error);
            // Sometimes it throws if already started
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const addSystemMessage = (text) => {
        setMessages(prev => [...prev, { type: 'system', text, time: new Date() }]);
    };

    // Start call
    const handleStartCall = async () => {
        try {
            setIsLoading(true);
            const response = await voiceAgentService.startCall();

            setSessionId(response.session_id);
            setMessages([{
                type: 'agent',
                text: response.response_text || "Hello! I'm your LifelineX voice assistant. I can help you book appointments. Just tell me which department you'd like to visit.",
                time: new Date()
            }]);
            setContext({});

            speak(response.response_text);
        } catch (error) {
            console.error('Start call error:', error);
            // Fallback greeting if voice agent is unavailable
            setSessionId('local-' + Date.now());
            setMessages([{
                type: 'agent',
                text: "Hello! I'm your LifelineX assistant. Voice service is currently unavailable, but I can still help you navigate. Try saying 'book appointment' or 'view appointments'.",
                time: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // End call
    const handleEndCall = async () => {
        if (synthesis) synthesis.cancel();

        if (sessionId && !sessionId.startsWith('local-')) {
            try {
                await voiceAgentService.endCall(sessionId);
            } catch (error) {
                console.error('Error ending call:', error);
            }
        }

        setSessionId(null);
        addSystemMessage('📴 Session ended');
    };

    // Send message
    const handleSendMessage = async (text = inputText) => {
        if (!sessionId || !text.trim()) return;
        if (synthesis) synthesis.cancel();

        const userMessage = { type: 'user', text: text.trim(), time: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        // If using local fallback session
        if (sessionId.startsWith('local-')) {
            const lowerText = text.toLowerCase();
            let response = "I understand you want help. For now, please use the navigation to book appointments or view your appointments.";

            if (lowerText.includes('book') || lowerText.includes('appointment')) {
                response = "To book an appointment, please click the 'Book Appointment' button in the navigation or go to the Appointments page.";
            } else if (lowerText.includes('view') || lowerText.includes('my appointment')) {
                response = "To view your appointments, please go to the 'My Appointments' page from the navigation.";
            } else if (lowerText.includes('help')) {
                response = "I can help you with: 1) Booking appointments 2) Viewing your appointments 3) Checking health information. What would you like to do?";
            }

            setMessages(prev => [...prev, { type: 'agent', text: response, time: new Date() }]);
            speak(response);
            setIsLoading(false);
            return;
        }

        try {
            const response = await voiceAgentService.processMessage(sessionId, text.trim(), context);

            setContext(response.context || context);

            const agentMessage = {
                type: 'agent',
                text: response.response_text,
                time: new Date(),
                intent: response.intent
            };
            setMessages(prev => [...prev, agentMessage]);

            speak(response.response_text);

            if (response.is_complete) {
                addSystemMessage('✅ Task completed!');
            }

        } catch (error) {
            console.error('Process message error:', error);
            setMessages(prev => [...prev, {
                type: 'agent',
                text: "I'm having trouble processing that. Please try again or use the navigation buttons.",
                time: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Quick actions
    const quickActions = [
        { label: '📅 Book Appointment', message: 'I want to book an appointment' },
        { label: '👀 View Appointments', message: 'Show my appointments' },
        { label: '❓ Help', message: 'What can you help me with?' },
    ];

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200 flex items-center justify-center transform hover:-translate-y-1 transition-transform"
                style={{ display: isOpen ? 'none' : 'flex' }}
            >
                <Mic size={24} />
                {isConnected && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                )}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-4 z-50 w-[min(360px,90vw)] h-[520px] bg-white rounded-[28px] shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold flex items-center gap-1">
                                        Voice Assistant
                                        <Sparkles size={14} className="text-yellow-300" />
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs opacity-80">
                                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`} />
                                        {isConnected ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="p-2 rounded-full hover:bg-white/20 transition"
                                >
                                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full hover:bg-white/20 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50 to-white">
                            {!sessionId ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-4">
                                        <Bot size={32} className="text-teal-600" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-2">LifelineX Voice Assistant</h4>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Book appointments, check status, and get help - all through voice!
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleStartCall}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-200 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Phone size={18} />
                                        )}
                                        Start Conversation
                                    </motion.button>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, idx) => (
                                        msg.type === 'system' ? (
                                            <div key={idx} className="text-center">
                                                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                                    {msg.text}
                                                </span>
                                            </div>
                                        ) : (
                                            <ChatMessage
                                                key={idx}
                                                message={msg}
                                                isAgent={msg.type === 'agent'}
                                            />
                                        )
                                    ))}

                                    {isLoading && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                                                <Bot size={16} className="text-white" />
                                            </div>
                                            <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-tl-none">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isSpeaking && (
                                        <div className="text-center">
                                            <span className="text-xs text-teal-600 bg-teal-50 px-3 py-1 rounded-full flex items-center gap-1 w-fit mx-auto">
                                                <Volume2 size={12} className="animate-pulse" />
                                                Speaking...
                                            </span>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Quick Actions */}
                        {sessionId && (
                            <div className="px-4 py-2 border-t border-slate-100 bg-white">
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                    {quickActions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(action.message)}
                                            disabled={isLoading}
                                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full hover:bg-teal-50 hover:text-teal-600 transition whitespace-nowrap disabled:opacity-50"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        {sessionId && (
                            <div className="p-3 border-t border-slate-100 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={isRecording ? "🎤 Listening..." : "Type or tap mic..."}
                                        disabled={isLoading || isRecording}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleRecording}
                                        disabled={isLoading}
                                        className={`p-2 rounded-xl transition ${isRecording
                                            ? 'bg-red-500 text-white animate-pulse'
                                            : 'bg-teal-500 text-white hover:bg-teal-600'
                                            }`}
                                    >
                                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSendMessage()}
                                        disabled={isLoading || !inputText.trim()}
                                        className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </motion.button>
                                </div>

                                {/* End Call Button */}
                                <button
                                    onClick={handleEndCall}
                                    className="w-full mt-2 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-1"
                                >
                                    <PhoneOff size={14} />
                                    End Session
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VoiceAssistant;
