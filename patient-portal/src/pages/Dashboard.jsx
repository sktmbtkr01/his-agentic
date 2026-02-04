import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import HealthScoreCard from '../components/HealthScoreCard';
import NudgeCard from '../components/NudgeCard';
import nudgeService from '../services/nudgeService';
import { AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const { patient, logout } = useAuth();
    const [nudges, setNudges] = useState([]);

    useEffect(() => {
        const fetchNudges = async () => {
            try {
                const response = await nudgeService.getActiveNudges();
                setNudges(response.data || []);
            } catch (error) {
                console.error("Failed to fetch nudges", error);
            }
        };
        fetchNudges();
    }, []);

    const handleNudgeResponse = async (nudgeId, status) => {
        try {
            await nudgeService.respondToNudge(nudgeId, status);
            // Remove from list visually
            setNudges(prev => prev.filter(n => n._id !== nudgeId));
        } catch (error) {
            console.error("Failed to respond to nudge", error);
        }
    };

    const quickActions = [
        { label: 'Log Symptom', icon: '🩺', to: '/log-symptom', color: 'bg-red-50 text-red-600' },
        { label: 'Log Mood', icon: '😊', to: '/log-mood', color: 'bg-yellow-50 text-yellow-600' },
        { label: 'Log Lifestyle', icon: '🏃', to: '/log-lifestyle', color: 'bg-green-50 text-green-600' },
        { label: 'View History', icon: '📋', to: '/history', color: 'bg-blue-50 text-blue-600' },
    ];

    return (
        <div className="page-container min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-6">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-teal-100 text-sm">Welcome back,</p>
                            <h1 className="text-xl font-bold">{patient?.fullName || patient?.firstName}</h1>
                        </div>
                        <button
                            onClick={logout}
                            className="px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 -mt-4">
                {/* Health Score Card */}
                <div className="mb-6 h-[280px]">
                    <HealthScoreCard />
                </div>

                {/* Quick Actions */}
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'rgb(var(--color-text-primary))' }}>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            to={action.to}
                            className="card flex flex-col items-center py-6 hover:shadow-md transition"
                        >
                            <span className={`text-3xl mb-2 ${action.color} w-14 h-14 rounded-full flex items-center justify-center`}>
                                {action.icon}
                            </span>
                            <span className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                {action.label}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Care Nudges */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'rgb(var(--color-text-primary))' }}>
                        Care Suggestions
                    </h2>
                    <AnimatePresence>
                        {nudges.length > 0 ? (
                            nudges.map(nudge => (
                                <NudgeCard
                                    key={nudge._id}
                                    nudge={nudge}
                                    onRespond={handleNudgeResponse}
                                />
                            ))
                        ) : (
                            <div className="card p-6 text-center">
                                <span className="text-3xl block mb-2">✨</span>
                                <p className="font-medium text-slate-600">You're all caught up!</p>
                                <p className="text-xs text-slate-400">Great job staying on top of your health.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation Links */}
                <div className="mt-6 space-y-2">
                    <Link to="/profile" className="card flex items-center justify-between hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">👤</span>
                            <span className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>My Profile</span>
                        </div>
                        <span style={{ color: 'rgb(var(--color-text-muted))' }}>→</span>
                    </Link>
                    <Link to="/appointments" className="card flex items-center justify-between hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📅</span>
                            <span className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>Appointments</span>
                        </div>
                        <span style={{ color: 'rgb(var(--color-text-muted))' }}>→</span>
                    </Link>
                    <Link to="/prescriptions" className="card flex items-center justify-between hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">💊</span>
                            <span className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>Prescriptions</span>
                        </div>
                        <span style={{ color: 'rgb(var(--color-text-muted))' }}>→</span>
                    </Link>
                    <Link to="/lab-results" className="card flex items-center justify-between hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🔬</span>
                            <span className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>Lab Results</span>
                        </div>
                        <span style={{ color: 'rgb(var(--color-text-muted))' }}>→</span>
                    </Link>
                    <Link to="/lifelens" className="card flex items-center justify-between hover:shadow-md transition border-l-4 border-l-purple-500 bg-purple-50/50">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🧠</span>
                            <div>
                                <span className="font-medium block" style={{ color: 'rgb(var(--color-text-primary))' }}>LifeLens 360</span>
                                <span className="text-xs text-purple-600">Health Intelligence</span>
                            </div>
                        </div>
                        <span style={{ color: 'rgb(var(--color-text-muted))' }}>→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
