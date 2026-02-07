/**
 * WellnessAgentChat Component
 * AI-powered health companion chat interface
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    MessageCircle, 
    X, 
    Send, 
    Sparkles, 
    ChevronRight,
    AlertTriangle,
    RefreshCw,
    Mic,
    MicOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useWellnessChat from '../../hooks/useWellnessChat';

// ============================================
// Sub-Components
// ============================================

/**
 * Floating Action Button to open chat
 */
const WellnessFAB = ({ onClick, hasUnread }) => (
    <motion.button
        onClick={onClick}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/40 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
    >
        <Sparkles size={24} />
        {hasUnread && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
    </motion.button>
);

/**
 * Chat Header with agent info
 */
const ChatHeader = ({ onClose, onReset }) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
                <Sparkles size={20} className="text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Wellness</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your health companion</p>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <button 
                onClick={onReset}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                title="Start new conversation"
            >
                <RefreshCw size={18} />
            </button>
            <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
                <X size={20} />
            </button>
        </div>
    </div>
);

/**
 * Single message bubble
 */
const ChatMessage = ({ message, onActionClick }) => {
    const isUser = message.role === 'user';
    const isEmergency = message.isEmergency;
    const isError = message.isError;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
        >
            <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
                {/* Message Bubble */}
                <div
                    className={`px-4 py-2.5 rounded-2xl ${
                        isUser
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : isEmergency
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-bl-md'
                            : isError
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-bl-md'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md'
                    }`}
                >
                    {isEmergency && (
                        <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                            <AlertTriangle size={16} />
                            <span className="text-xs font-semibold uppercase">Urgent</span>
                        </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Suggested Actions */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestedActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => onActionClick(action)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                {action.label}
                                <ChevronRight size={12} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <p className={`text-xs mt-1 ${isUser ? 'text-right' : 'text-left'} text-slate-400`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </motion.div>
    );
};

/**
 * Typing indicator
 */
const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-start mb-3"
    >
        <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.1,
                        }}
                    />
                ))}
            </div>
        </div>
    </motion.div>
);

/**
 * Message input area
 */
const ChatInput = ({ onSend, isLoading }) => {
    const [input, setInput] = useState('');
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit}
            className="flex items-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
            <div className="flex-1 relative">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Wellness anything..."
                    className="w-full px-4 py-2.5 pr-12 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none max-h-24"
                    rows={1}
                    disabled={isLoading}
                />
            </div>
            <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
                <Send size={18} />
            </button>
        </form>
    );
};

// ============================================
// Main Component
// ============================================

const WellnessAgentChat = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const { isAuthenticated } = useAuth();
    
    const {
        isOpen,
        messages,
        isLoading,
        error,
        openChat,
        closeChat,
        toggleChat,
        sendMessage,
        resetChat,
        clearError,
    } = useWellnessChat();

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Handle suggested action clicks
    const handleActionClick = (action) => {
        if (action.route) {
            if (action.route.startsWith('tel:')) {
                window.location.href = action.route;
            } else {
                navigate(action.route);
                closeChat();
            }
        }
    };

    // Only render for authenticated users
    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            {/* FAB - Show when chat is closed */}
            <AnimatePresence>
                {!isOpen && (
                    <WellnessFAB onClick={openChat} hasUnread={false} />
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                        {/* Header */}
                        <ChatHeader onClose={closeChat} onReset={resetChat} />

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
                            {/* Error Banner */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl"
                                >
                                    <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
                                    <button
                                        onClick={clearError}
                                        className="text-xs text-amber-600 dark:text-amber-400 underline mt-1"
                                    >
                                        Dismiss
                                    </button>
                                </motion.div>
                            )}

                            {/* Messages */}
                            {messages.map((message) => (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    onActionClick={handleActionClick}
                                />
                            ))}

                            {/* Typing Indicator */}
                            <AnimatePresence>
                                {isLoading && <TypingIndicator />}
                            </AnimatePresence>

                            {/* Scroll anchor */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <ChatInput onSend={sendMessage} isLoading={isLoading} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default WellnessAgentChat;
