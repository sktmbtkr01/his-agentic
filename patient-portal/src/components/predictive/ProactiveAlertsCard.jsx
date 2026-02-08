/**
 * ProactiveAlertsCard Component
 * Phase 4: Displays AI-generated proactive health alerts
 * Show a slim summary banner linking to the full insights page.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import predictiveService from '../../services/predictiveService';

const ProactiveAlertsCard = ({ compact = false, maxAlerts = 5 }) => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await predictiveService.getActiveAlerts({ limit: maxAlerts });
                if (response.success) {
                    setAlerts(response.data.alerts);
                }
            } catch (err) {
                console.error('Failed to fetch alerts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, [maxAlerts]);

    if (loading) {
        return (
            <div className="h-20 rounded-[24px] bg-white animate-pulse border border-stone-100 shadow-sm" />
        );
    }

    const alertCount = alerts.length;
    const hasHighPriority = alerts.some(a => ['critical', 'high'].includes(a.severity));

    // Theme logic - Soft tints only
    const theme = hasHighPriority 
        ? { bg: 'bg-amber-50/60', border: 'border-amber-100', text: 'text-amber-900', accent: 'bg-amber-400', icon: Sparkles, iconColor: 'text-amber-600' }
        : { bg: 'bg-emerald-50/60', border: 'border-emerald-100', text: 'text-emerald-900', accent: 'bg-emerald-400', icon: Sparkles, iconColor: 'text-emerald-600' };

    const Icon = theme.icon;

    return (
        <div 
            onClick={() => navigate('/health-insights')}
            className={`relative overflow-hidden rounded-[24px] p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-md active:scale-[0.98] border ${theme.bg} ${theme.border} shadow-soft group`}
        >
            {/* Subtle Left Accent Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accent}`} />

            <div className="flex items-center gap-4 pl-2">
                <div className={`w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm ${theme.iconColor}`}>
                    <Icon size={20} />
                </div>
                
                <div>
                    <h3 className={`text-sm font-bold ${theme.text} mb-0.5`}>
                        {alertCount > 0 ? `${alertCount} Health Insights` : 'Health Insights Ready'}
                    </h3>
                    <p className={`text-xs font-medium opacity-70 ${theme.text}`}>
                        {alertCount > 0 ? "AI Analysis detected new patterns." : "View your predictive health trends."}
                    </p>
                </div>
            </div>

            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${theme.iconColor} group-hover:translate-x-1 transition-transform`}>
                View Insights 
                <ChevronRight size={14} />
            </div>
        </div>
    );
};

export default ProactiveAlertsCard;
