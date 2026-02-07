/**
 * useWellnessChat Hook
 * Manages state and interactions for the Wellness Agent chat
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import wellnessAgentService from '../services/wellnessAgent.service';

const useWellnessChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Ref to track if we're currently initializing
    const initializingRef = useRef(false);

    /**
     * Initialize chat with greeting
     */
    const initializeChat = useCallback(async () => {
        // Prevent multiple initializations
        if (initializingRef.current || isInitialized) return;
        
        initializingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const result = await wellnessAgentService.startConversation();
            
            setConversationId(result.conversationId);
            setMessages([{
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: result.greeting,
                timestamp: new Date(),
                sentiment: 'positive',
                suggestedActions: [],
            }]);
            setIsInitialized(true);
        } catch (err) {
            console.error('Failed to initialize wellness chat:', err);
            setError('Failed to connect to Wellness. Please try again.');
            // Still show a fallback greeting
            setMessages([{
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: "Hi! I'm Wellness, your health companion. How can I help you today?",
                timestamp: new Date(),
                sentiment: 'positive',
                suggestedActions: [],
            }]);
            setIsInitialized(true);
        } finally {
            setIsLoading(false);
            initializingRef.current = false;
        }
    }, [isInitialized]);

    /**
     * Open the chat interface
     */
    const openChat = useCallback(() => {
        setIsOpen(true);
        if (!isInitialized) {
            initializeChat();
        }
    }, [isInitialized, initializeChat]);

    /**
     * Close the chat interface
     */
    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    /**
     * Toggle chat open/closed
     */
    const toggleChat = useCallback(() => {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }, [isOpen, openChat, closeChat]);

    /**
     * Send a message to the Wellness Agent
     */
    const sendMessage = useCallback(async (messageText) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = {
            id: `msg_${Date.now()}_user`,
            role: 'user',
            content: messageText.trim(),
            timestamp: new Date(),
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const result = await wellnessAgentService.sendMessage(
                messageText.trim(),
                conversationId
            );

            // Update conversation ID if new
            if (result.conversationId && result.conversationId !== conversationId) {
                setConversationId(result.conversationId);
            }

            // Add assistant response
            const assistantMessage = {
                id: `msg_${Date.now()}_assistant`,
                role: 'assistant',
                content: result.response,
                timestamp: new Date(),
                sentiment: result.sentiment,
                suggestedActions: result.suggestedActions || [],
                isEmergency: result.isEmergency || false,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message. Please try again.');
            
            // Add error message
            setMessages(prev => [...prev, {
                id: `msg_${Date.now()}_error`,
                role: 'assistant',
                content: "I'm having trouble responding right now. Please try again in a moment.",
                timestamp: new Date(),
                sentiment: 'neutral',
                suggestedActions: [],
                isError: true,
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, isLoading]);

    /**
     * Clear the chat and start fresh
     */
    const resetChat = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setIsInitialized(false);
        setError(null);
        initializeChat();
    }, [initializeChat]);

    /**
     * Clear any error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        isOpen,
        messages,
        isLoading,
        error,
        conversationId,
        isInitialized,
        
        // Actions
        openChat,
        closeChat,
        toggleChat,
        sendMessage,
        resetChat,
        clearError,
    };
};

export default useWellnessChat;
