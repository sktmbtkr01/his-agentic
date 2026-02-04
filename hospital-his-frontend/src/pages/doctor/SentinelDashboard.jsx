import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sentinelService from '../../services/sentinelService';
import {
    AlertTriangle,
    ArrowRight,
    TrendingDown,
    Activity,
    User,
    Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

const SentinelDashboard = () => {
    const navigate = useNavigate();
    const [atRiskPatients, setAtRiskPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRisks = async () => {
            try {
                const response = await sentinelService.getAtRiskPatients();
                // Backend returns { success: true, count: N, data: [{ patient: {id, name}, score, trend }] }
                // So response.data is the array of risk objects.
                const riskData = response.data || [];
                setAtRiskPatients(riskData);
            } catch (error) {
                console.error("Failed to load risk dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRisks();
    }, []);

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-primary" /> Sentinel Alerts Dashboard
                </h1>
                <p className="text-slate-500">Monitoring patients with declining health trends or critical risks.</p>
            </header>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-slate-500">Scanning patient population...</p>
                </div>
            ) : atRiskPatients.length === 0 ? (
                <div className="bg-green-50 rounded-2xl p-12 text-center border border-green-100">
                    <Activity className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-green-800 mb-2">All Clear</h2>
                    <p className="text-green-700">No patients currently flagged as high risk by the Sentinel system.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {atRiskPatients.map((item, idx) => (
                        <motion.div
                            key={item.patient?.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                            onClick={() => navigate(`/dashboard/sentinel/${item.patient?.id}`)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{item.patient?.name}</h3>
                                    <p className="text-sm text-slate-500">
                                        ID: {item.patient?.id} • Score: <span className="font-bold text-red-600">{item.score}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden md:block">
                                    <div className="flex items-center gap-1 text-red-600 font-medium text-sm">
                                        {item.trend?.direction === 'declining' && <TrendingDown size={16} />}
                                        <span className="capitalize">{item.trend?.direction || 'Critical'}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Last updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </p>
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SentinelDashboard;
