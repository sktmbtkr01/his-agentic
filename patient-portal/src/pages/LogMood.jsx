import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import signalsService from '../services/signals.service';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, AlertCircle, Smile } from 'lucide-react';

// Mood options
const MOODS = [
    { id: 'great', label: 'Great', icon: '😄', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'good', label: 'Good', icon: '🙂', color: 'bg-lime-100 text-lime-700' },
    { id: 'okay', label: 'Okay', icon: '😐', color: 'bg-amber-100 text-amber-700' },
    { id: 'low', label: 'Low', icon: '😔', color: 'bg-orange-100 text-orange-700' },
    { id: 'bad', label: 'Bad', icon: '😞', color: 'bg-rose-100 text-rose-700' },
];

const LogMood = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedMood, setSelectedMood] = useState(null);
    const [stressLevel, setStressLevel] = useState(5);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedMood) return;

        setIsSubmitting(true);
        setError('');

        try {
            await signalsService.logSignal({
                category: 'mood',
                mood: {
                    type: selectedMood.id,
                    stressLevel,
                    notes: notes || undefined,
                },
            });

            navigate('/dashboard', {
                state: { message: 'Mood logged successfully' }
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log mood. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStressLabel = (level) => {
        if (level <= 2) return 'Very Relaxed';
        if (level <= 4) return 'Calm';
        if (level <= 6) return 'Moderate';
        if (level <= 8) return 'Stressed';
        return 'Very Stressed';
    };

    const getStressColor = (level) => {
        if (level <= 2) return 'text-emerald-500';
        if (level <= 4) return 'text-lime-500';
        if (level <= 6) return 'text-amber-500';
        if (level <= 8) return 'text-orange-500';
        return 'text-rose-500';
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24 relative overflow-x-hidden">
             {/* Glass Header */}
             <div className="sticky top-0 z-30 glass border-b border-slate-200/50 px-4 py-4 flex items-center justify-between">
                <button 
                    onClick={() => step === 1 ? navigate('/dashboard') : setStep(step - 1)}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-slate-800">Log Mood</h1>
                <div className="w-8 h-8 flex items-center justify-center font-bold text-xs text-amber-500 bg-amber-50 rounded-full">
                    {step}/2
                </div>
            </div>

            {/* Progress Bar */}
             <div className="h-1 w-full bg-slate-100">
                <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(step / 2) * 100}%` }}
                />
            </div>

            <div className="px-6 py-6 max-w-lg mx-auto">
                <AnimatePresence mode='wait'>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center gap-3"
                        >
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </motion.div>
                    )}

                    {/* Step 1: Select Mood & Stress */}
                    {step === 1 && (
                         <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-amber-50 text-amber-500">
                                    <Smile size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">How are you?</h2>
                                <p className="text-slate-500">Track your emotional wellbeing.</p>
                            </div>

                            {/* Mood Selection */}
                            <div className="grid grid-cols-5 gap-2 mb-10">
                                {MOODS.map((mood) => (
                                    <button
                                        key={mood.id}
                                        onClick={() => setSelectedMood(mood)}
                                        className={`flex flex-col items-center gap-2 transition-all duration-300 group
                                            ${selectedMood?.id === mood.id ? 'transform scale-110' : 'opacity-70 hover:opacity-100'}
                                        `}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-all
                                            ${selectedMood?.id === mood.id 
                                                ? `${mood.color} ring-4 ring-offset-2 ring-transparent shadow-lg` 
                                                : 'bg-white hover:bg-slate-50 border border-slate-100'
                                            }
                                        `}>
                                            {mood.icon}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wide uppercase ${selectedMood?.id === mood.id ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {mood.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Stress Level */}
                            <div className="card-premium p-6 mb-8 bg-white">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex justify-between">
                                    <span>Stress Level</span>
                                    <span className={`${getStressColor(stressLevel)} font-bold`}>{stressLevel}/10</span>
                                </h3>
                                
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={stressLevel}
                                    onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-4"
                                />
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-400">Relaxed</span>
                                    <span className={`text-sm font-bold ${getStressColor(stressLevel)}`}>{getStressLabel(stressLevel)}</span>
                                    <span className="text-xs font-semibold text-slate-400">Stressed</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!selectedMood}
                                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-all
                                    ${selectedMood 
                                        ? 'bg-amber-500 text-white hover:bg-amber-600' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                Continue
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2: Notes & Confirm */}
                    {step === 2 && (
                         <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="card-premium p-6 mb-6 bg-white flex flex-col items-center text-center gap-2">
                                <div className="text-6xl mb-2">{selectedMood?.icon}</div>
                                <h3 className="font-bold text-slate-800 text-xl">Feeling {selectedMood?.label}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                                    <span>Stress Level:</span>
                                    <span className={`font-bold ${getStressColor(stressLevel)}`}>{stressLevel} - {getStressLabel(stressLevel)}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="mb-8">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 block">Journal (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What influenced your mood today?"
                                    className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none resize-none text-slate-700 min-h-[140px]"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Check size={20} />
                                        <span>Log Mood</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LogMood;
