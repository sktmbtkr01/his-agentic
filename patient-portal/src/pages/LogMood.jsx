import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import signalsService from '../services/signals.service';

// Mood options
const MOODS = [
    { id: 'great', label: 'Great', icon: '😄', color: 'bg-green-100 text-green-700' },
    { id: 'good', label: 'Good', icon: '🙂', color: 'bg-lime-100 text-lime-700' },
    { id: 'okay', label: 'Okay', icon: '😐', color: 'bg-amber-100 text-amber-700' },
    { id: 'low', label: 'Low', icon: '😔', color: 'bg-orange-100 text-orange-700' },
    { id: 'bad', label: 'Bad', icon: '😞', color: 'bg-red-100 text-red-700' },
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
        if (level <= 2) return 'text-green-500';
        if (level <= 4) return 'text-lime-500';
        if (level <= 6) return 'text-amber-500';
        if (level <= 8) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <div className="page-container min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-6">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Link to="/dashboard" className="text-white/80 hover:text-white">
                        ← Back
                    </Link>
                    <h1 className="text-xl font-bold flex-1">Log Mood</h1>
                    <span className="text-sm opacity-80">Step {step}/2</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {error && (
                    <div className="alert alert-error mb-4">{error}</div>
                )}

                {/* Step 1: Select Mood & Stress */}
                {step === 1 && (
                    <div>
                        {/* Mood Selection */}
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            How are you feeling today?
                        </h2>
                        <div className="flex gap-3 mb-8">
                            {MOODS.map((mood) => (
                                <button
                                    key={mood.id}
                                    onClick={() => setSelectedMood(mood)}
                                    className={`flex-1 card p-4 text-center transition ${mood.color} ${selectedMood?.id === mood.id ? 'ring-2 ring-offset-2 ring-teal-500 scale-105' : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <span className="text-3xl mb-2 block">{mood.icon}</span>
                                    <span className="text-sm font-medium">{mood.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Stress Level */}
                        <div className="card mb-6">
                            <h3 className="text-sm font-medium mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                Stress Level
                            </h3>
                            <div className="text-center mb-4">
                                <span className={`text-4xl font-bold ${getStressColor(stressLevel)}`}>
                                    {stressLevel}
                                </span>
                                <span className="text-lg" style={{ color: 'rgb(var(--color-text-muted))' }}>/10</span>
                                <p className={`text-sm mt-1 ${getStressColor(stressLevel)}`}>
                                    {getStressLabel(stressLevel)}
                                </p>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={stressLevel}
                                onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                            />
                            <div className="flex justify-between text-xs mt-2" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                <span>Relaxed</span>
                                <span>Stressed</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!selectedMood}
                            className="btn btn-primary w-full"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Step 2: Notes & Confirm */}
                {step === 2 && (
                    <div>
                        <div className="text-center mb-6">
                            <span className="text-5xl mb-2 block">{selectedMood?.icon}</span>
                            <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                Feeling {selectedMood?.label}
                            </h2>
                            <p className={`text-sm mt-1 ${getStressColor(stressLevel)}`}>
                                Stress: {stressLevel}/10 • {getStressLabel(stressLevel)}
                            </p>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="label">What's on your mind? (optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any thoughts, triggers, or context you'd like to note..."
                                className="input min-h-[120px] resize-none"
                                rows={5}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
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
                                    'Log Mood'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogMood;
