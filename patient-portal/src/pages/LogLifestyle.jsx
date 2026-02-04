import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import signalsService from '../services/signals.service';

const SLEEP_QUALITIES = [
    { id: 'poor', label: 'Poor', icon: '😫', color: 'bg-red-100 text-red-700' },
    { id: 'fair', label: 'Fair', icon: '😕', color: 'bg-orange-100 text-orange-700' },
    { id: 'good', label: 'Good', icon: '🙂', color: 'bg-lime-100 text-lime-700' },
    { id: 'excellent', label: 'Excellent', icon: '😴', color: 'bg-green-100 text-green-700' },
];

const ACTIVITY_TYPES = [
    { id: 'sedentary', label: 'Sedentary', icon: '🪑', desc: 'Little to no exercise' },
    { id: 'light', label: 'Light', icon: '🚶', desc: 'Walking, easy tasks' },
    { id: 'moderate', label: 'Moderate', icon: '🏃', desc: 'Brisk walk, light sports' },
    { id: 'active', label: 'Active', icon: '💪', desc: 'Exercise, sports' },
    { id: 'very_active', label: 'Very Active', icon: '🏋️', desc: 'Intense workout' },
];

const MEAL_QUALITIES = [
    { id: 'poor', label: 'Poor', icon: '🍟', desc: 'Fast food, skipped meals' },
    { id: 'fair', label: 'Fair', icon: '🥪', desc: 'Okay, could be better' },
    { id: 'good', label: 'Good', icon: '🥗', desc: 'Balanced meals' },
    { id: 'excellent', label: 'Excellent', icon: '🥦', desc: 'Very healthy, nutritious' },
];

const LogLifestyle = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sleep');

    // Sleep data
    const [sleepHours, setSleepHours] = useState(7);
    const [sleepQuality, setSleepQuality] = useState(null);

    // Activity data
    const [activityType, setActivityType] = useState(null);
    const [activityDuration, setActivityDuration] = useState(30);

    // Hydration data
    const [waterGlasses, setWaterGlasses] = useState(4);

    // Meals data
    const [mealCount, setMealCount] = useState(3);
    const [mealQuality, setMealQuality] = useState(null);

    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        // Build lifestyle data based on what's filled
        const lifestyleData = { notes: notes || undefined };

        if (sleepQuality) {
            lifestyleData.sleep = {
                duration: sleepHours,
                quality: sleepQuality,
            };
        }

        if (activityType) {
            lifestyleData.activity = {
                type: activityType,
                duration: activityDuration,
            };
        }

        lifestyleData.hydration = { glasses: waterGlasses };

        if (mealQuality) {
            lifestyleData.meals = {
                count: mealCount,
                quality: mealQuality,
            };
        }

        try {
            await signalsService.logSignal({
                category: 'lifestyle',
                lifestyle: lifestyleData,
            });

            setSuccess('Lifestyle logged successfully!');
            setTimeout(() => {
                navigate('/dashboard', {
                    state: { message: 'Lifestyle logged successfully' }
                });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log lifestyle. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { id: 'sleep', label: 'Sleep', icon: '🌙' },
        { id: 'activity', label: 'Activity', icon: '🏃' },
        { id: 'hydration', label: 'Hydration', icon: '💧' },
        { id: 'meals', label: 'Meals', icon: '🍽️' },
    ];

    return (
        <div className="page-container min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-6">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Link to="/dashboard" className="text-white/80 hover:text-white">
                        ← Back
                    </Link>
                    <h1 className="text-xl font-bold flex-1">Log Lifestyle</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 bg-white shadow-sm z-10" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex gap-1 py-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${activeTab === tab.id
                                        ? 'bg-teal-100 text-teal-700'
                                        : 'hover:bg-stone-100'
                                    }`}
                                style={{ color: activeTab !== tab.id ? 'rgb(var(--color-text-secondary))' : undefined }}
                            >
                                <span className="mr-1">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {error && <div className="alert alert-error mb-4">{error}</div>}
                {success && <div className="alert alert-success mb-4">{success}</div>}

                {/* Sleep Tab */}
                {activeTab === 'sleep' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            🌙 How did you sleep?
                        </h2>

                        {/* Sleep Duration */}
                        <div className="card mb-4">
                            <label className="label">Hours of Sleep</label>
                            <div className="text-center mb-4">
                                <span className="text-4xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                                    {sleepHours}
                                </span>
                                <span className="text-lg" style={{ color: 'rgb(var(--color-text-muted))' }}> hours</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="12"
                                step="0.5"
                                value={sleepHours}
                                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                            />
                            <div className="flex justify-between text-xs mt-2" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                <span>0h</span>
                                <span>12h</span>
                            </div>
                        </div>

                        {/* Sleep Quality */}
                        <div className="card">
                            <label className="label">Sleep Quality</label>
                            <div className="grid grid-cols-4 gap-2">
                                {SLEEP_QUALITIES.map((quality) => (
                                    <button
                                        key={quality.id}
                                        onClick={() => setSleepQuality(quality.id)}
                                        className={`p-3 rounded-lg text-center transition ${quality.color} ${sleepQuality === quality.id ? 'ring-2 ring-offset-2 ring-teal-500' : 'opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <span className="text-2xl block mb-1">{quality.icon}</span>
                                        <span className="text-xs font-medium">{quality.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            🏃 How active were you today?
                        </h2>

                        <div className="card mb-4">
                            <label className="label">Activity Level</label>
                            <div className="space-y-2">
                                {ACTIVITY_TYPES.map((activity) => (
                                    <button
                                        key={activity.id}
                                        onClick={() => setActivityType(activity.id)}
                                        className={`w-full p-3 rounded-lg flex items-center gap-3 transition border ${activityType === activity.id
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-stone-200 hover:border-stone-300'
                                            }`}
                                    >
                                        <span className="text-2xl">{activity.icon}</span>
                                        <div className="text-left flex-1">
                                            <span
                                                className="font-medium block"
                                                style={{ color: activityType === activity.id ? 'rgb(13, 148, 136)' : 'rgb(var(--color-text-primary))' }}
                                            >
                                                {activity.label}
                                            </span>
                                            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                                {activity.desc}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activityType && activityType !== 'sedentary' && (
                            <div className="card">
                                <label className="label">Activity Duration (minutes)</label>
                                <div className="text-center mb-4">
                                    <span className="text-4xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                                        {activityDuration}
                                    </span>
                                    <span className="text-lg" style={{ color: 'rgb(var(--color-text-muted))' }}> min</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="180"
                                    step="5"
                                    value={activityDuration}
                                    onChange={(e) => setActivityDuration(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                />
                                <div className="flex justify-between text-xs mt-2" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                    <span>5 min</span>
                                    <span>3 hours</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Hydration Tab */}
                {activeTab === 'hydration' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            💧 How much water did you drink?
                        </h2>

                        <div className="card">
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-2">💧</div>
                                <span className="text-5xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                                    {waterGlasses}
                                </span>
                                <span className="text-xl" style={{ color: 'rgb(var(--color-text-muted))' }}> glasses</span>
                                <p className="text-sm mt-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                    (~{waterGlasses * 250}ml)
                                </p>
                            </div>

                            <div className="flex justify-center gap-4 mb-4">
                                <button
                                    onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                                    className="w-14 h-14 rounded-full bg-stone-100 text-2xl hover:bg-stone-200 transition"
                                >
                                    −
                                </button>
                                <button
                                    onClick={() => setWaterGlasses(Math.min(20, waterGlasses + 1))}
                                    className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 text-2xl hover:bg-teal-200 transition"
                                >
                                    +
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[4, 6, 8, 10].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setWaterGlasses(preset)}
                                        className={`py-2 px-3 rounded-lg text-sm transition ${waterGlasses === preset
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-stone-100 hover:bg-stone-200'
                                            }`}
                                        style={{ color: waterGlasses !== preset ? 'rgb(var(--color-text-primary))' : undefined }}
                                    >
                                        {preset} glasses
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Meals Tab */}
                {activeTab === 'meals' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            🍽️ How were your meals today?
                        </h2>

                        <div className="card mb-4">
                            <label className="label">Number of Meals</label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setMealCount(count)}
                                        className={`w-12 h-12 rounded-full text-lg font-medium transition ${mealCount === count
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-stone-100 hover:bg-stone-200'
                                            }`}
                                        style={{ color: mealCount !== count ? 'rgb(var(--color-text-primary))' : undefined }}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <label className="label">Meal Quality</label>
                            <div className="space-y-2">
                                {MEAL_QUALITIES.map((quality) => (
                                    <button
                                        key={quality.id}
                                        onClick={() => setMealQuality(quality.id)}
                                        className={`w-full p-3 rounded-lg flex items-center gap-3 transition border ${mealQuality === quality.id
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-stone-200 hover:border-stone-300'
                                            }`}
                                    >
                                        <span className="text-2xl">{quality.icon}</span>
                                        <div className="text-left flex-1">
                                            <span
                                                className="font-medium block"
                                                style={{ color: mealQuality === quality.id ? 'rgb(13, 148, 136)' : 'rgb(var(--color-text-primary))' }}
                                            >
                                                {quality.label}
                                            </span>
                                            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                                {quality.desc}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes & Submit */}
                <div className="mt-6">
                    <div className="card mb-4">
                        <label className="label">Additional Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any other details about your day..."
                            className="input min-h-[80px] resize-none"
                            rows={3}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn btn-primary w-full py-3"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="spinner"></span>
                                Saving...
                            </span>
                        ) : (
                            'Log Lifestyle'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogLifestyle;
