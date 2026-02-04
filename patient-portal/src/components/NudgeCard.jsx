import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, AlertCircle, Droplets, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NudgeCard = ({ nudge, onRespond }) => {
    const navigate = useNavigate();

    const getIcon = () => {
        switch (nudge.generatedTrigger) {
            case 'low_hydration': return <Droplets className="text-blue-500" />;
            case 'declining_score': return <Activity className="text-red-500" />;
            default: return <Bell className="text-amber-500" />;
        }
    };

    const getPriorityColor = () => {
        switch (nudge.priority) {
            case 'high': return 'bg-red-50 border-red-200';
            case 'medium': return 'bg-amber-50 border-amber-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 rounded-xl border mb-3 flex items-start gap-4 shadow-sm ${getPriorityColor()}`}
        >
            <div className="bg-white p-2 rounded-full shadow-sm">
                {getIcon()}
            </div>

            <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm mb-1">{nudge.title}</h4>
                <p className="text-slate-600 text-xs mb-3 leading-relaxed">
                    {nudge.message}
                </p>

                <div className="flex items-center gap-2">
                    {nudge.actionLink && (
                        <button
                            onClick={() => navigate(nudge.actionLink)}
                            className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                            Take Action
                        </button>
                    )}
                    <button
                        onClick={() => onRespond(nudge._id, 'done')}
                        className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Mark as Done"
                    >
                        <Check size={14} />
                    </button>
                    <button
                        onClick={() => onRespond(nudge._id, 'dismissed')}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default NudgeCard;
