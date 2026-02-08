import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Check, X, AlertCircle, Droplets, Activity,
    Moon, Brain, Flame, Calendar, TrendingUp, Sparkles,
    ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import nudgeService from '../services/nudgeService';

const SmartNudgeCard = ({ nudge, onRespond, onRemove }) => {
    const navigate = useNavigate();
    const [showReasoning, setShowReasoning] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState(nudge.effectiveness?.feedback || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get icon based on trigger type
    const getIcon = () => {
        const iconClass = "w-5 h-5";
        switch (nudge.generatedTrigger) {
            case 'low_hydration': return <Droplets className={`${iconClass} text-blue-500`} />;
            case 'declining_score': return <Activity className={`${iconClass} text-red-500`} />;
            case 'improving_score': return <TrendingUp className={`${iconClass} text-green-500`} />;
            case 'sleep_deficit': return <Moon className={`${iconClass} text-indigo-500`} />;
            case 'mood_pattern': return <Brain className={`${iconClass} text-purple-500`} />;
            case 'streak_celebration': return <Flame className={`${iconClass} text-orange-500`} />;
            case 'appointment_reminder': return <Calendar className={`${iconClass} text-cyan-500`} />;
            default: return <Bell className={`${iconClass} text-amber-500`} />;
        }
    };

    // Updated for Phase 4: Soft Wellness Aesthetics
    const getPriorityStyles = () => {
        // Mapping priorities to the new color system
        // Critical -> Warm Amber/Coral (Urgent)
        // High -> Activity Teal or Muted Coral
        // Medium -> Sage/Cream (Gentle)
        
        switch (nudge.priority) {
            case 'critical': return {
                bg: 'bg-rose-50',
                border: '', // Removed harsh border
                text: 'text-rose-900',
                iconBg: 'bg-rose-100 text-rose-600',
                badge: 'bg-rose-200 text-rose-800',
                button: 'bg-rose-500 text-white shadow-rose-200'
            };
            case 'high': return {
                bg: 'bg-amber-50',
                border: '',
                text: 'text-amber-900',
                iconBg: 'bg-amber-100 text-amber-600',
                badge: 'bg-amber-200 text-amber-800',
                button: 'bg-amber-500 text-white shadow-amber-200'
            };
            case 'medium': 
            default: return {
                bg: 'bg-sage-50', // Primary soft
                border: '',
                text: 'text-sage-900',
                iconBg: 'bg-sage-100 text-sage-600',
                badge: 'bg-sage-200 text-sage-800',
                button: 'bg-sage-600 text-white shadow-sage-200'
            };
        }
    };

    // Get type badge
    const getTypeBadge = () => {
        switch (nudge.type) {
            case 'alert': return { label: 'Alert', icon: AlertCircle };
            case 'celebration': return { label: 'Achievement', icon: Sparkles };
            case 'reminder': return { label: 'Reminder', icon: Calendar };
            case 'insight': return { label: 'Insight', icon: Brain };
            default: return { label: 'Tip', icon: Info };
        }
    };

    const styles = getPriorityStyles();
    const typeBadge = getTypeBadge();
    const TypeIcon = typeBadge.icon;

    // Handle action button click
    const handleActionClick = async () => {
        try {
            await nudgeService.trackActionClick(nudge._id);
            if (nudge.actionLink) {
                navigate(nudge.actionLink);
            }
        } catch (error) {
            console.error('Error tracking action click:', error);
            // Still navigate even if tracking fails
            if (nudge.actionLink) navigate(nudge.actionLink);
        }
    };

    // Handle respond (done/dismissed)
    const handleRespond = async (status) => {
        setIsSubmitting(true);
        try {
            await onRespond(nudge._id, status);
            onRemove?.(nudge._id);
        } catch (error) {
            console.error('Error responding to nudge:', error);
        }
        setIsSubmitting(false);
    };

    // Handle feedback
    const handleFeedback = async (feedback) => {
        try {
            await nudgeService.submitFeedback(nudge._id, feedback);
            setFeedbackGiven(feedback);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`p-6 rounded-[28px] ${styles.bg} mb-6 shadow-soft hover:shadow-lg transition-all duration-300 w-full relative overflow-hidden`}
        >
            {/* Header with icon, type badge, and priority indicator */}
            <div className="flex items-start gap-4">
                {/* Icon */}
                <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    className={`p-3 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm flex-shrink-0 ${styles.text}`}
                >
                    {getIcon()}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    {/* Type & Source badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                            <TypeIcon size={10} strokeWidth={2.5} />
                            {typeBadge.label}
                        </span>
                        {nudge.generationSource === 'llm_generated' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/60 text-stone-500 backdrop-blur-sm shadow-sm">
                                <Sparkles size={10} className="text-peach-500" />
                                Smart Insight
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h4 className={`font-display font-bold text-base mb-2 leading-tight ${styles.text}`}>
                        {nudge.title}
                    </h4>

                    {/* Message */}
                    <p className="text-sage-700 text-sm leading-relaxed mb-4 font-medium opacity-90">
                        {nudge.message}
                    </p>

                    {/* Reasoning (expandable) */}
                    {nudge.reasoning && (
                        <motion.div className="mb-4">
                            <button
                                onClick={() => setShowReasoning(!showReasoning)}
                                className="flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700 transition-colors font-medium backdrop-blur-md px-2 py-1 rounded-lg bg-white/30 w-fit"
                            >
                                <Info size={12} strokeWidth={2.5} />
                                Why this nudge?
                                {showReasoning ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <AnimatePresence>
                                {showReasoning && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-xs text-sage-600 mt-2 p-3 bg-white/40 rounded-xl italic leading-relaxed"
                                    >
                                        {nudge.reasoning}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 flex-wrap mt-2">
                        {/* Primary action */}
                        {nudge.actionLink && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleActionClick}
                                className={`px-5 py-2.5 text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all ${styles.button}`}
                            >
                                {nudge.actionLabel || 'Take Action'}
                            </motion.button>
                        )}

                        {/* Done button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRespond('done')}
                            disabled={isSubmitting}
                            className="w-9 h-9 flex items-center justify-center bg-white text-emerald-600 rounded-full shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            title="Mark as Done"
                        >
                            <Check size={16} strokeWidth={3} />
                        </motion.button>

                        {/* Dismiss button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRespond('dismissed')}
                            disabled={isSubmitting}
                            className="w-9 h-9 flex items-center justify-center bg-white text-stone-400 rounded-full shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors disabled:opacity-50"
                            title="Dismiss"
                        >
                            <X size={16} strokeWidth={3} />
                        </motion.button>

                        {/* Feedback buttons (only show if nudge has reasoning - LLM generated) */}
                        {nudge.generationSource === 'llm_generated' && !feedbackGiven && (
                            <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[10px] text-slate-400 mr-1">Helpful?</span>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleFeedback('helpful')}
                                    className="p-1 text-slate-400 hover:text-green-500 transition-colors"
                                    title="Helpful"
                                >
                                    <ThumbsUp size={12} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleFeedback('not_helpful')}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Not Helpful"
                                >
                                    <ThumbsDown size={12} />
                                </motion.button>
                            </div>
                        )}

                        {/* Show feedback confirmation */}
                        {feedbackGiven && (
                            <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                                {feedbackGiven === 'helpful' ? (
                                    <>
                                        <ThumbsUp size={10} className="text-green-500" />
                                        Thanks!
                                    </>
                                ) : (
                                    <>
                                        <ThumbsDown size={10} className="text-slate-400" />
                                        Noted
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SmartNudgeCard;
