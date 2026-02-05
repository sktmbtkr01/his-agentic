import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import signalsService from '../services/signals.service';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, AlertCircle } from 'lucide-react';

// Symptom options with icons
const SYMPTOMS = [
    { id: 'headache', label: 'Headache', icon: '🤕' },
    { id: 'fatigue', label: 'Fatigue', icon: '😴' },
    { id: 'nausea', label: 'Nausea', icon: '🤢' },
    { id: 'fever', label: 'Fever', icon: '🤒' },
    { id: 'cough', label: 'Cough', icon: '😷' },
    { id: 'body_ache', label: 'Body Ache', icon: '💪' },
    { id: 'chest_pain', label: 'Chest Pain', icon: '💔' },
    { id: 'shortness_of_breath', label: 'S.O.B.', icon: '😮‍💨' },
    { id: 'dizziness', label: 'Dizziness', icon: '😵' },
    { id: 'stomach_pain', label: 'Stomach', icon: '🤮' },
    { id: 'back_pain', label: 'Back Pain', icon: '🔙' },
    { id: 'joint_pain', label: 'Joint Pain', icon: '🦴' },
    { id: 'sore_throat', label: 'Sore Throat', icon: '😖' },
    { id: 'runny_nose', label: 'Runny Nose', icon: '🤧' },
    { id: 'loss_of_appetite', label: 'No Appetite', icon: '🍽️' },
    { id: 'insomnia', label: 'Insomnia', icon: '😫' },
    { id: 'anxiety', label: 'Anxiety', icon: '😰' },
    { id: 'other', label: 'Other', icon: '➕' },
];

const SEVERITIES = [
    { id: 'mild', label: 'Mild', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'moderate', label: 'Moderate', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'severe', label: 'Severe', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const DURATIONS = [
    { value: 30, unit: 'minutes', label: '30m' },
    { value: 1, unit: 'hours', label: '1h' },
    { value: 3, unit: 'hours', label: '3h' },
    { value: 6, unit: 'hours', label: '6h' },
    { value: 1, unit: 'days', label: '1d' },
    { value: 3, unit: 'days', label: '3d+' },
];

const LogSymptom = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedSymptom, setSelectedSymptom] = useState(null);
    const [severity, setSeverity] = useState('moderate');
    const [duration, setDuration] = useState(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedSymptom) return;

        setIsSubmitting(true);
        setError('');

        try {
            await signalsService.logSignal({
                category: 'symptom',
                symptom: {
                    type: selectedSymptom.id,
                    severity,
                    duration: duration ? { value: duration.value, unit: duration.unit } : undefined,
                    notes: notes || undefined,
                },
            });

            navigate('/dashboard', {
                state: { message: `${selectedSymptom.label} logged successfully` }
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log symptom. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
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
                <h1 className="text-lg font-bold text-slate-800">Log Symptom</h1>
                <div className="w-8 h-8 flex items-center justify-center font-bold text-xs text-rose-500 bg-rose-50 rounded-full">
                    {step}/3
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-slate-100">
                <div 
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
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

                    {/* Step 1: Select Symptom */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="text-xl font-bold text-slate-800 mb-2">What's wrong?</h2>
                            <p className="text-slate-500 mb-6">Select the symptom that describes your feeling.</p>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {SYMPTOMS.map((symptom) => (
                                    <button
                                        key={symptom.id}
                                        onClick={() => {
                                            setSelectedSymptom(symptom);
                                            setStep(2);
                                        }}
                                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 border border-transparent
                                            ${selectedSymptom?.id === symptom.id 
                                                ? 'bg-rose-50 border-rose-200 shadow-inner' 
                                                : 'bg-white shadow-sm hover:shadow-md hover:-translate-y-1'
                                            }
                                        `}
                                    >
                                        <span className="text-3xl filter drop-shadow-sm">{symptom.icon}</span>
                                        <span className="text-xs font-semibold text-slate-600 text-center leading-tight">
                                            {symptom.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Severity & Duration */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Selected Context */}
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-white rounded-3xl mx-auto shadow-lg shadow-rose-500/10 flex items-center justify-center text-5xl mb-4">
                                    {selectedSymptom?.icon}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedSymptom?.label}</h2>
                            </div>

                            {/* Severity */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Severity</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {SEVERITIES.map((sev) => (
                                        <button
                                            key={sev.id}
                                            onClick={() => setSeverity(sev.id)}
                                            className={`py-4 rounded-2xl font-semibold text-sm transition-all duration-300 border flex flex-col items-center gap-1
                                                ${severity === sev.id 
                                                    ? `${sev.color} ring-2 ring-offset-2 ring-transparent shadow-md transform scale-105` 
                                                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            {sev.id === 'mild' && '😌'}
                                            {sev.id === 'moderate' && '😐'}
                                            {sev.id === 'severe' && '😫'}
                                            <span>{sev.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Duration</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {DURATIONS.map((dur, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setDuration(duration?.label === dur.label ? null : dur)}
                                            className={`py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 border
                                                ${duration?.label === dur.label
                                                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-500/30'
                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {dur.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(3)}
                                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-rose-500/20 active:scale-95 transition-transform"
                            >
                                Continue
                            </button>
                        </motion.div>
                    )}

                    {/* Step 3: Notes & Confirm */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                           <div className="card-premium p-6 mb-6 bg-white flex items-center gap-4">
                                <div className="text-4xl">{selectedSymptom?.icon}</div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{selectedSymptom?.label}</h3>
                                    <p className="text-sm text-slate-500">
                                        <span className="capitalize font-medium text-rose-500">{severity}</span>
                                        {duration && (
                                            <span className="ml-2 pl-2 border-l border-slate-200">{duration.label} duration</span>
                                        )}
                                    </p>
                                </div>
                           </div>

                            {/* Notes */}
                            <div className="mb-8">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 block">Additional Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Describe your pain level or specific details..."
                                    className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none resize-none text-slate-700 min-h-[140px]"
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
                                        <span>Log Entry</span>
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

export default LogSymptom;
