import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import signalsService from '../services/signals.service';

const CATEGORY_CONFIG = {
    symptom: { icon: '🩺', label: 'Symptom', color: 'bg-red-100 text-red-700' },
    mood: { icon: '😊', label: 'Mood', color: 'bg-yellow-100 text-yellow-700' },
    lifestyle: { icon: '🏃', label: 'Lifestyle', color: 'bg-green-100 text-green-700' },
    vitals: { icon: '❤️', label: 'Vitals', color: 'bg-purple-100 text-purple-700' },
};

const SEVERITY_COLORS = {
    mild: 'bg-green-100 text-green-700',
    moderate: 'bg-amber-100 text-amber-700',
    severe: 'bg-red-100 text-red-700',
};

const MOOD_ICONS = {
    great: '😄',
    good: '🙂',
    okay: '😐',
    low: '😔',
    bad: '😞',
};

const SignalHistory = () => {
    const [signals, setSignals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchSignals();
    }, [activeFilter]);

    const fetchSignals = async (page = 1) => {
        setIsLoading(true);
        setError('');

        try {
            const params = { page, limit: 20 };
            if (activeFilter !== 'all') {
                params.category = activeFilter;
            }

            const result = await signalsService.getSignals(params);
            setSignals(result.data || []);
            setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            await signalsService.deleteSignal(id);
            setSignals(signals.filter((s) => s._id !== id));
        } catch (err) {
            setError('Failed to delete entry');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const renderSignalContent = (signal) => {
        switch (signal.category) {
            case 'symptom':
                return (
                    <div>
                        <h3 className="font-medium capitalize" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            {signal.symptom?.type?.replace(/_/g, ' ')}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_COLORS[signal.symptom?.severity] || ''}`}>
                                {signal.symptom?.severity}
                            </span>
                            {signal.symptom?.duration && (
                                <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                    {signal.symptom.duration.value} {signal.symptom.duration.unit}
                                </span>
                            )}
                        </div>
                        {signal.symptom?.notes && (
                            <p className="text-sm mt-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                {signal.symptom.notes}
                            </p>
                        )}
                    </div>
                );

            case 'mood':
                return (
                    <div>
                        <h3 className="font-medium flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            <span className="text-xl">{MOOD_ICONS[signal.mood?.type] || '😐'}</span>
                            <span className="capitalize">{signal.mood?.type}</span>
                        </h3>
                        {signal.mood?.stressLevel && (
                            <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                Stress: {signal.mood.stressLevel}/10
                            </p>
                        )}
                        {signal.mood?.notes && (
                            <p className="text-sm mt-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                {signal.mood.notes}
                            </p>
                        )}
                    </div>
                );

            case 'lifestyle':
                const items = [];
                if (signal.lifestyle?.sleep) {
                    items.push(`Sleep: ${signal.lifestyle.sleep.duration}h (${signal.lifestyle.sleep.quality})`);
                }
                if (signal.lifestyle?.activity) {
                    items.push(`Activity: ${signal.lifestyle.activity.type} - ${signal.lifestyle.activity.duration}min`);
                }
                if (signal.lifestyle?.hydration) {
                    items.push(`Water: ${signal.lifestyle.hydration.glasses} glasses`);
                }
                if (signal.lifestyle?.meals) {
                    items.push(`Meals: ${signal.lifestyle.meals.count} (${signal.lifestyle.meals.quality})`);
                }
                return (
                    <div>
                        <h3 className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>Lifestyle Log</h3>
                        <ul className="text-sm mt-1 space-y-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            {items.map((item, i) => (
                                <li key={i}>• {item}</li>
                            ))}
                        </ul>
                        {signal.lifestyle?.notes && (
                            <p className="text-sm mt-2" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                {signal.lifestyle.notes}
                            </p>
                        )}
                    </div>
                );

            case 'vitals':
                const vitalItems = [];
                if (signal.vitals?.bloodPressure) {
                    vitalItems.push(`BP: ${signal.vitals.bloodPressure.systolic}/${signal.vitals.bloodPressure.diastolic}`);
                }
                if (signal.vitals?.heartRate) {
                    vitalItems.push(`Heart Rate: ${signal.vitals.heartRate} bpm`);
                }
                if (signal.vitals?.temperature) {
                    vitalItems.push(`Temperature: ${signal.vitals.temperature}°C`);
                }
                if (signal.vitals?.weight) {
                    vitalItems.push(`Weight: ${signal.vitals.weight} kg`);
                }
                return (
                    <div>
                        <h3 className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>Vitals Log</h3>
                        <ul className="text-sm mt-1 space-y-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            {vitalItems.map((item, i) => (
                                <li key={i}>• {item}</li>
                            ))}
                        </ul>
                    </div>
                );

            default:
                return <p>Unknown signal type</p>;
        }
    };

    const filters = [
        { id: 'all', label: 'All', icon: '📋' },
        { id: 'symptom', label: 'Symptoms', icon: '🩺' },
        { id: 'mood', label: 'Mood', icon: '😊' },
        { id: 'lifestyle', label: 'Lifestyle', icon: '🏃' },
    ];

    return (
        <div className="page-container min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-6">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Link to="/dashboard" className="text-white/80 hover:text-white">
                        ← Back
                    </Link>
                    <h1 className="text-xl font-bold flex-1">Signal History</h1>
                    <span className="text-sm opacity-80">{pagination.total} entries</span>
                </div>
            </div>

            {/* Filters */}
            <div className="sticky top-0 bg-white shadow-sm z-10" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex gap-2 py-3 overflow-x-auto">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${activeFilter === filter.id
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-stone-100 hover:bg-stone-200'
                                    }`}
                                style={{ color: activeFilter !== filter.id ? 'rgb(var(--color-text-primary))' : undefined }}
                            >
                                {filter.icon} {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4">
                {error && <div className="alert alert-error mb-4">{error}</div>}

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="spinner mx-auto mb-4" style={{ width: '2rem', height: '2rem' }}></div>
                        <p style={{ color: 'rgb(var(--color-text-secondary))' }}>Loading history...</p>
                    </div>
                ) : signals.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="text-5xl mb-4 block">📝</span>
                        <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            No entries yet
                        </h2>
                        <p className="mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            Start logging your health signals to see them here
                        </p>
                        <Link to="/dashboard" className="btn btn-primary">
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {signals.map((signal) => {
                            const config = CATEGORY_CONFIG[signal.category] || { icon: '📋', label: 'Signal', color: 'bg-stone-100' };
                            return (
                                <div key={signal._id} className="card relative">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${config.color}`}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1">
                                            {renderSignalContent(signal)}
                                            <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                                {formatDate(signal.recordedAt)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(signal._id)}
                                            className="text-red-400 hover:text-red-600 text-sm p-1"
                                            title="Delete"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button
                            onClick={() => fetchSignals(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="btn btn-secondary text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => fetchSignals(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="btn btn-secondary text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignalHistory;
