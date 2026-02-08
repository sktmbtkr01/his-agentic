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

    // Get priority-based styling
    const getPriorityStyles = () => {
        switch (nudge.priority) {
            case 'critical': return {
                bg: 'bg-gradient-to-br from-red-50 to-red-100',
                border: 'border-red-300',
                badge: 'bg-red-500 text-white',
            };
            case 'high': return {
                bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
                border: 'border-amber-300',
                badge: 'bg-amber-500 text-white',
            };
            case 'medium': return {
                bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
                border: 'border-blue-200',
                badge: 'bg-blue-500 text-white',
            };
            default: return {
                bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
                border: 'border-slate-200',
                badge: 'bg-slate-400 text-white',
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
            className={`p-4 rounded-2xl border ${styles.bg} ${styles.border} mb-3 shadow-sm hover:shadow-lg transition-all duration-300`}
        >
            {/* Header with icon, type badge, and priority indicator */}
            <div className="flex items-start gap-3">
                {/* Icon */}
                <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    className="p-2.5 rounded-xl bg-white shadow-sm flex-shrink-0"
                >
                    {getIcon()}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Type & Source badges */}
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${styles.badge}`}>
                            <TypeIcon size={10} />
                            {typeBadge.label}
                        </span>
                        {nudge.generationSource === 'llm_generated' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                <Sparkles size={10} />
                                AI
                            </span>
                        )}
                         {nudge.meta?.modelVersion && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600 border border-slate-300">
                                <span>v</span>{nudge.meta.modelVersion}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">
                        {nudge.title}
                    </h4>

                    {/* Message */}
                    <p className="text-slate-600 text-xs leading-relaxed mb-3">
                        {nudge.message}
                    </p>

                    {/* Reasoning (expandable) */}
                    {nudge.reasoning && (
                        <motion.div className="mb-3">
                            <button
                                onClick={() => setShowReasoning(!showReasoning)}
                                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <Info size={12} />
                                Why this nudge?
                                {showReasoning ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <AnimatePresence>
                                {showReasoning && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[11px] text-slate-500 mt-1.5 pl-4 border-l-2 border-slate-300 italic"
                                    >
                                        {nudge.reasoning}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Primary action */}
                        {nudge.actionLink && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleActionClick}
                                className="px-3 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-200"
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
                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Mark as Done"
                        >
                            <Check size={14} />
                        </motion.button>

                        {/* Dismiss button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRespond('dismissed')}
                            disabled={isSubmitting}
                            className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                            title="Dismiss"
                        >
                            <X size={14} />
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
