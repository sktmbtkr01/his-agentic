import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import signalsService from '../services/signals.service';

// Symptom options with icons
const SYMPTOMS = [
    { id: 'headache', label: 'Headache', icon: '🤕' },
    { id: 'fatigue', label: 'Fatigue', icon: '😴' },
    { id: 'nausea', label: 'Nausea', icon: '🤢' },
    { id: 'fever', label: 'Fever', icon: '🤒' },
    { id: 'cough', label: 'Cough', icon: '😷' },
    { id: 'body_ache', label: 'Body Ache', icon: '💪' },
    { id: 'chest_pain', label: 'Chest Pain', icon: '💔' },
    { id: 'shortness_of_breath', label: 'Shortness of Breath', icon: '😮‍💨' },
    { id: 'dizziness', label: 'Dizziness', icon: '😵' },
    { id: 'stomach_pain', label: 'Stomach Pain', icon: '🤮' },
    { id: 'back_pain', label: 'Back Pain', icon: '🔙' },
    { id: 'joint_pain', label: 'Joint Pain', icon: '🦴' },
    { id: 'sore_throat', label: 'Sore Throat', icon: '😖' },
    { id: 'runny_nose', label: 'Runny Nose', icon: '🤧' },
    { id: 'loss_of_appetite', label: 'Loss of Appetite', icon: '🍽️' },
    { id: 'insomnia', label: 'Insomnia', icon: '😫' },
    { id: 'anxiety', label: 'Anxiety', icon: '😰' },
    { id: 'other', label: 'Other', icon: '➕' },
];

const SEVERITIES = [
    { id: 'mild', label: 'Mild', color: 'bg-green-100 text-green-700 border-green-300' },
    { id: 'moderate', label: 'Moderate', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { id: 'severe', label: 'Severe', color: 'bg-red-100 text-red-700 border-red-300' },
];

const DURATIONS = [
    { value: 30, unit: 'minutes', label: '30 min' },
    { value: 1, unit: 'hours', label: '1 hour' },
    { value: 2, unit: 'hours', label: '2 hours' },
    { value: 4, unit: 'hours', label: '4 hours' },
    { value: 1, unit: 'days', label: '1 day' },
    { value: 2, unit: 'days', label: '2+ days' },
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
        <div className="page-container min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-6">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Link to="/dashboard" className="text-white/80 hover:text-white">
                        ← Back
                    </Link>
                    <h1 className="text-xl font-bold flex-1">Log Symptom</h1>
                    <span className="text-sm opacity-80">Step {step}/3</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {error && (
                    <div className="alert alert-error mb-4">{error}</div>
                )}

                {/* Step 1: Select Symptom */}
                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            What are you experiencing?
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            {SYMPTOMS.map((symptom) => (
                                <button
                                    key={symptom.id}
                                    onClick={() => {
                                        setSelectedSymptom(symptom);
                                        setStep(2);
                                    }}
                                    className={`card p-4 text-center hover:shadow-md transition ${selectedSymptom?.id === symptom.id ? 'ring-2 ring-teal-500' : ''
                                        }`}
                                >
                                    <span className="text-2xl mb-2 block">{symptom.icon}</span>
                                    <span className="text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                        {symptom.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Severity & Duration */}
                {step === 2 && (
                    <div>
                        <div className="text-center mb-6">
                            <span className="text-4xl mb-2 block">{selectedSymptom?.icon}</span>
                            <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                {selectedSymptom?.label}
                            </h2>
                        </div>

                        {/* Severity */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium mb-3" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                How severe is it?
                            </h3>
                            <div className="flex gap-3">
                                {SEVERITIES.map((sev) => (
                                    <button
                                        key={sev.id}
                                        onClick={() => setSeverity(sev.id)}
                                        className={`flex-1 py-3 px-4 rounded-lg border text-center font-medium transition ${sev.color} ${severity === sev.id ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        {sev.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium mb-3" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                How long have you had this? (optional)
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {DURATIONS.map((dur, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setDuration(duration?.label === dur.label ? null : dur)}
                                        className={`py-2 px-3 rounded-lg border text-sm transition ${duration?.label === dur.label
                                                ? 'border-teal-500 bg-teal-50 text-teal-700'
                                                : 'border-stone-200 hover:border-stone-300'
                                            }`}
                                        style={{ color: duration?.label !== dur.label ? 'rgb(var(--color-text-primary))' : undefined }}
                                    >
                                        {dur.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="btn btn-secondary flex-1"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="btn btn-primary flex-1"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Notes & Confirm */}
                {step === 3 && (
                    <div>
                        <div className="text-center mb-6">
                            <span className="text-4xl mb-2 block">{selectedSymptom?.icon}</span>
                            <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                {selectedSymptom?.label}
                            </h2>
                            <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                {SEVERITIES.find((s) => s.id === severity)?.label} severity
                                {duration ? ` • ${duration.label}` : ''}
                            </p>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="label">Additional Notes (optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional details about your symptom..."
                                className="input min-h-[100px] resize-none"
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(2)}
                                className="btn btn-secondary flex-1"
                                disabled={isSubmitting}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="btn btn-primary flex-1"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="spinner"></span>
                                        Saving...
                                    </span>
                                ) : (
                                    'Log Symptom'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogSymptom;
