import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLiveBoard } from '../../features/emergency/emergencySlice';

const TRIAGE_COLORS = {
    critical: { bg: 'bg-red-600 dark:bg-red-600/20', text: 'text-white dark:text-red-400', border: 'border-red-600' },
    urgent: { bg: 'bg-orange-500 dark:bg-orange-500/20', text: 'text-white dark:text-orange-400', border: 'border-orange-500' },
    'less-urgent': { bg: 'bg-yellow-400 dark:bg-yellow-400/20', text: 'text-gray-900 dark:text-yellow-400', border: 'border-yellow-400' },
    'non-urgent': { bg: 'bg-green-500 dark:bg-green-500/20', text: 'text-white dark:text-green-400', border: 'border-green-500' },
};

const EmergencyQueue = ({ onSelectCase }) => {
    const dispatch = useDispatch();
    const { activeCases, isLoading } = useSelector((state) => state.emergency);

    useEffect(() => {
        dispatch(fetchLiveBoard());
    }, [dispatch]);

    // Filter to show only waiting patients (registered, triage)
    const waitingCases = activeCases.filter(
        (c) => c.status === 'registered' || c.status === 'triage'
    );

    const getPatientName = (patient) => {
        if (!patient) return 'Unknown';
        return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (waitingCases.length === 0) {
        return (
            <div className="bg-surface-secondary rounded-lg p-6 text-center border border-border">
                <p className="text-text-muted">No patients waiting in queue</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
                🚶 Waiting Queue ({waitingCases.length})
            </h3>

            {waitingCases.map((emergencyCase, index) => {
                const triageColor = TRIAGE_COLORS[emergencyCase.triageLevel] || TRIAGE_COLORS['non-urgent'];

                return (
                    <div
                        key={emergencyCase._id}
                        className={`border-l-4 ${triageColor.border} bg-surface rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow border border-t-border border-r-border border-b-border`}
                        onClick={() => onSelectCase && onSelectCase(emergencyCase)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-text-muted">#{index + 1}</span>
                                    <span className="font-semibold text-text-primary">
                                        {getPatientName(emergencyCase.patient)}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary mt-1">
                                    {emergencyCase.chiefComplaint}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`${triageColor.bg} ${triageColor.text} px-2 py-1 rounded text-xs font-medium`}>
                                    {emergencyCase.triageLevel}
                                </span>
                                <p className="text-sm text-text-muted mt-1">
                                    {emergencyCase.waitingTime || 'Just arrived'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EmergencyQueue;
