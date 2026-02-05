import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
    fetchLiveBoard,
    fetchDashboardStats,
    handleNewCase,
    handleTriageUpdate,
    handleStatusUpdate,
    setSelectedCase,
} from '../../features/emergency/emergencySlice';
import EmergencyQueue from './EmergencyQueue';
import EmergencyTriage from './EmergencyTriage';
import EmergencyTreatment from './EmergencyTreatment';
import DowntimeMode from './DowntimeMode';
import EmergencyRegistration from './EmergencyRegistration';

const TRIAGE_COLORS = {
    critical: { bg: 'bg-red-600 dark:bg-red-700/90', text: 'text-white', label: 'Critical' },
    urgent: { bg: 'bg-orange-500 dark:bg-orange-600/90', text: 'text-white', label: 'Urgent' },
    'less-urgent': { bg: 'bg-yellow-400 dark:bg-yellow-500/90', text: 'text-gray-900', label: 'Less Urgent' },
    'non-urgent': { bg: 'bg-green-500 dark:bg-green-600/90', text: 'text-white', label: 'Non-Urgent' },
};

const EMERGENCY_TAG_STYLES = {
    cardiac: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    stroke: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    trauma: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    sepsis: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    respiratory: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
    other: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600',
};

const STATUS_LABELS = {
    registered: 'Registered',
    triage: 'Triage',
    'in-treatment': 'In Treatment',
    observation: 'Observation',
    admitted: 'Admitted',
    discharged: 'Discharged',
    transferred: 'Transferred',
};

const EmergencyDashboard = () => {
    const dispatch = useDispatch();
    const { activeCases, selectedCase, isLoading, isDowntime, dashboardStats } = useSelector(
        (state) => state.emergency
    );
    const { user } = useSelector((state) => state.auth);

    const [socket, setSocket] = useState(null);
    const [showTriageModal, setShowTriageModal] = useState(false);
    const [showTreatmentModal, setShowTreatmentModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for waiting time display
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch initial data
    useEffect(() => {
        dispatch(fetchLiveBoard());
        dispatch(fetchDashboardStats());
    }, [dispatch]);

    // Socket connection
    useEffect(() => {
        const socketInstance = io('http://localhost:5001', {
            withCredentials: true,
        });

        socketInstance.on('connect', () => {
            console.log('Connected to emergency socket');
            socketInstance.emit('join-emergency');
        });

        socketInstance.on('emergency:new', (data) => {
            dispatch(handleNewCase(data));
            dispatch(fetchDashboardStats());
        });

        socketInstance.on('emergency:triage', (data) => {
            dispatch(handleTriageUpdate(data));
            dispatch(fetchDashboardStats());
        });

        socketInstance.on('emergency:status', (data) => {
            dispatch(handleStatusUpdate(data));
            dispatch(fetchDashboardStats());
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [dispatch]);

    const handleCaseClick = useCallback((emergencyCase) => {
        dispatch(setSelectedCase(emergencyCase));
    }, [dispatch]);

    const handleStartTreatment = (emergencyCase) => {
        dispatch(setSelectedCase(emergencyCase));
        setShowTreatmentModal(true);
    };

    const handleChangeTriage = (emergencyCase) => {
        dispatch(setSelectedCase(emergencyCase));
        setShowTriageModal(true);
    };

    const calculateWaitingTime = (arrivalTime, treatmentStartTime) => {
        const start = new Date(arrivalTime);
        const end = treatmentStartTime ? new Date(treatmentStartTime) : currentTime;
        const diffMs = end - start;
        const safeDiff = Math.max(0, diffMs);
        const hours = Math.floor(safeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((safeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const getPatientName = (patient) => {
        if (!patient) return 'Unknown';
        return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';
    };

    const getPatientUHID = (patient) => {
        return patient?.patientId || 'N/A';
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Downtime Banner */}
            {isDowntime && <DowntimeMode />}

            {/* Header */}
            <header className="bg-red-600 dark:bg-red-700 text-white px-6 py-4 shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">🚨 Emergency Dashboard</h1>
                        <p className="text-red-100">Live ER Board</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setShowRegistrationModal(true)}
                            className="bg-white text-red-600 dark:bg-red-50 dark:text-red-700 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <span>+</span> Register Patient
                        </button>

                        {dashboardStats && (
                            <div className="flex gap-4 text-sm">
                                <div className="bg-red-700 dark:bg-red-800/60 px-3 py-1 rounded border border-red-600/30">
                                    Active: <span className="font-bold">{dashboardStats.activeCount}</span>
                                </div>
                                <div className="bg-red-700 dark:bg-red-800/60 px-3 py-1 rounded border border-red-600/30">
                                    Today: <span className="font-bold">{dashboardStats.todayCount}</span>
                                </div>
                            </div>
                        )}
                        <div className="text-sm border-l border-red-500 pl-4">
                            {currentTime.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            {dashboardStats?.triageBreakdown && (
                <div className="bg-surface border-b border-border px-6 py-3 flex gap-4 overflow-x-auto">
                    {Object.entries(TRIAGE_COLORS).map(([level, colors]) => (
                        <div key={level} className={`${colors.bg} ${colors.text} px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap`}>
                            <span className="font-semibold">{colors.label}:</span>
                            <span className="text-lg font-bold">
                                {dashboardStats.triageBreakdown[level] || 0}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content */}
            <main className="p-6">
                {isLoading && activeCases.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                ) : activeCases.length === 0 ? (
                    <div className="bg-surface rounded-lg shadow p-12 text-center border border-border">
                        <div className="text-6xl mb-4">🏥</div>
                        <h2 className="text-2xl font-semibold text-text-primary">No Active Cases</h2>
                        <p className="text-text-secondary mt-2">The emergency room is currently clear.</p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-lg shadow overflow-hidden border border-border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-secondary">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Triage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Patient Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        UHID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Chief Complaint
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Waiting Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-border">
                                {activeCases.map((emergencyCase) => {
                                    const triageColor = TRIAGE_COLORS[emergencyCase.triageLevel] || TRIAGE_COLORS['non-urgent'];
                                    return (
                                        <tr
                                            key={emergencyCase._id}
                                            className="hover:bg-surface-highlight cursor-pointer transition-colors"
                                            onClick={() => handleCaseClick(emergencyCase)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`${triageColor.bg} ${triageColor.text} px-3 py-1 rounded-full text-sm font-medium shadow-sm`}>
                                                    {triageColor.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-text-primary">
                                                    {getPatientName(emergencyCase.patient)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-text-secondary font-mono">
                                                    {getPatientUHID(emergencyCase.patient)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-text-primary max-w-xs truncate">
                                                    {emergencyCase.chiefComplaint}
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    {emergencyCase.emergencyTag && (
                                                        <span className={`text-xs px-2 py-0.5 rounded border ${EMERGENCY_TAG_STYLES[emergencyCase.emergencyTag] || EMERGENCY_TAG_STYLES.other}`}>
                                                            {emergencyCase.emergencyTag.toUpperCase()}
                                                        </span>
                                                    )}
                                                    {emergencyCase.appliedBundles?.length > 0 && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20" title="Order Set Bundle Applied">
                                                            ⚡ BUNDLE
                                                        </span>
                                                    )}
                                                    {emergencyCase.readyForDoctor && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" title="Marked Ready for Doctor">
                                                            👨‍⚕️ READY
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm font-semibold ${emergencyCase.waitingTimeMs > 30 * 60 * 1000 ? 'text-red-600 dark:text-red-400' : 'text-text-primary'
                                                    }`}>
                                                    {emergencyCase.waitingTime || calculateWaitingTime(emergencyCase.arrivalTime, emergencyCase.treatmentStartTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded bg-surface-secondary text-text-primary border border-border">
                                                    {STATUS_LABELS[emergencyCase.status] || emergencyCase.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {['doctor', 'nurse'].includes(user?.role) && (
                                                        <button
                                                            onClick={() => handleChangeTriage(emergencyCase)}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                                        >
                                                            Triage
                                                        </button>
                                                    )}
                                                    {['doctor', 'nurse'].includes(user?.role) && (
                                                        <button
                                                            onClick={() => handleStartTreatment(emergencyCase)}
                                                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                                                        >
                                                            {emergencyCase.status === 'in-treatment' ? 'Manage' : 'Treat'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Triage Modal */}
            {showTriageModal && selectedCase && (
                <EmergencyTriage
                    emergencyCase={selectedCase}
                    onClose={() => setShowTriageModal(false)}
                />
            )}

            {showTreatmentModal && selectedCase && (
                <EmergencyTreatment
                    emergencyCase={selectedCase}
                    onClose={() => setShowTreatmentModal(false)}
                    onRefresh={() => {
                        dispatch(fetchLiveBoard());
                        // Keep modal open unless status changed to discharge/admit
                    }}
                />
            )}

            {/* Registration Modal */}
            {showRegistrationModal && (
                <EmergencyRegistration
                    onClose={() => setShowRegistrationModal(false)}
                />
            )}
        </div>
    );
};

export default EmergencyDashboard;
