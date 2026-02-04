import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import sentinelService from '../../services/sentinelService';
import {
    ArrowLeft,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Clock,
    User,
    Droplet,
    Smile,
    Moon
} from 'lucide-react';

const PatientSentinel = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await sentinelService.getPatientReport(patientId);
                setData(response.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load Sentinel Report');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [patientId]);

    if (loading) return <div className="p-8 text-center">Loading Sentinel Data...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!data) return <div className="p-8 text-center">No data found</div>;

    const { patient, healthScore, activityLog } = data;

    // Helper for Signal Icons
    const getSignalIcon = (category, type) => {
        switch (category) {
            case 'symptom': return <AlertTriangle className="text-red-500" size={18} />;
            case 'mood': return <Smile className="text-yellow-500" size={18} />;
            case 'lifestyle':
                if (type === 'hydration') return <Droplet className="text-blue-500" size={18} />;
                if (type === 'sleep') return <Moon className="text-indigo-500" size={18} />;
                return <Activity className="text-green-500" size={18} />;
            default: return <Activity size={18} />;
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="max-w-5xl mx-auto pb-12 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-primary" /> Sentinel Analysis
                </h1>
            </div>

            {/* Patient Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                        <p className="text-sm text-slate-500">ID: {patient.id} • {patient.age} Y • {patient.gender}</p>
                    </div>
                </div>
                <div className="text-right">
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                        View Full EMR
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Health Score Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Health Score</h3>

                        <div className="flex flex-col items-center justify-center py-6">
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${getScoreColor(healthScore?.score || 0).split(' ')[2]}`}>
                                <div className="text-center">
                                    <span className={`text-4xl font-bold ${getScoreColor(healthScore?.score || 0).split(' ')[0]}`}>
                                        {healthScore?.score ?? 'N/A'}
                                    </span>
                                    <span className="block text-xs text-slate-400 uppercase tracking-wider">Score</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                                {healthScore?.trend?.direction === 'improving' && <TrendingUp className="text-green-500" />}
                                {healthScore?.trend?.direction === 'declining' && <TrendingDown className="text-red-500" />}
                                {healthScore?.trend?.direction === 'stable' && <Minus className="text-slate-400" />}
                                <span className="capitalize text-slate-600">{healthScore?.trend?.direction} Trend</span>
                            </div>
                        </div>

                        <div className="space-y-3 mt-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="text-xs text-slate-500 block mb-1">Clinical Summary</span>
                                <p className="text-sm text-slate-700">{healthScore?.summary}</p>
                            </div>
                            {healthScore?.insights?.length > 0 && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <span className="text-xs text-blue-600 font-semibold block mb-1">AI Insight</span>
                                    <p className="text-sm text-blue-800">{healthScore.insights[0]}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Patient Activity</h3>

                        <div className="space-y-4">
                            {activityLog.length === 0 ? (
                                <p className="text-slate-500 text-center py-8">No recent activity detected.</p>
                            ) : (
                                activityLog.map((log) => (
                                    <div key={log._id} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                        <div className="mt-1 p-2 rounded-lg bg-slate-50">
                                            {getSignalIcon(log.category, log.symptom?.type || log.lifestyle?.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-slate-800 capitalize">
                                                    {log.category}: {
                                                        log.symptom?.type ||
                                                        log.mood?.type ||
                                                        (log.lifestyle?.sleep ? 'Log: Sleep' : 'Log: Activity')
                                                    }
                                                </h4>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(log.recordedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-600 mt-1">
                                                {log.symptom && (
                                                    <span>Severity: <strong className={log.symptom.severity === 'severe' ? 'text-red-500' : ''}>{log.symptom.severity}</strong></span>
                                                )}
                                                {log.mood && (
                                                    <span>Stress Level: {log.mood.stressLevel}/10</span>
                                                )}
                                                {log.lifestyle?.sleep && (
                                                    <span>Duration: {log.lifestyle.sleep.duration}h</span>
                                                )}
                                            </p>

                                            {(log.symptom?.notes || log.mood?.notes) && (
                                                <p className="text-xs text-slate-500 mt-1 italic">"{log.symptom?.notes || log.mood?.notes}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientSentinel;
