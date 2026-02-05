
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Pill, Clock, CheckCircle, AlertTriangle,
    ChevronRight, Activity, Package, TrendingUp,
    RefreshCw, ArrowRight, ShieldAlert, Box, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import pharmacyService from '../../services/pharmacy.service';
import { WelcomeBanner } from '../../components/dashboard';

// --- Reusable Components (Local) ---

// Animated CountUp for numbers
const CountUp = ({ value, duration = 800 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime = null;
        let startValue = count;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            setCount(Math.floor(startValue + (value - startValue) * easeOut));
            if (progress < duration) requestAnimationFrame(animate);
            else setCount(value);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <span>{count}</span>;
};

// StatCard Component
const StatCard = ({ title, value, subtext, icon: Icon, color, onClick, isLoading, delay = 0, highlight }) => {
    const baseColorName = color.split('-')[1]; // e.g., 'blue' from 'bg-blue-500'
    const borderColor = `border-${baseColorName}-100`;
    const hoverBorder = `hover:border-${baseColorName}-200`;
    const bgGradient = `bg-gradient-to-br from-${baseColorName}-50 to-white`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)" }}
            onClick={onClick}
            className={`relative p-6 rounded-2xl border ${borderColor} ${bgGradient} ${hoverBorder} shadow-sm transition-all group ${onClick ? 'cursor-pointer' : ''} ${highlight ? `ring-2 ring-${baseColorName}-200` : ''}`}
        >
            <div className="relative z-10">
                <div className={`p-3 rounded-xl mb-4 inline-block ${color} bg-opacity-10 shadow-sm`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <p className="text-text-secondary text-xs font-bold tracking-wider uppercase mb-1">{title}</p>
                <h3 className="text-4xl font-extrabold text-text-primary tracking-tight mb-2">
                    {isLoading ? <div className="h-9 w-20 bg-surface-secondary animate-pulse rounded"></div> : <CountUp value={value} />}
                </h3>
                <div className="flex items-center text-xs font-medium text-text-secondary">
                    {subtext}
                    {onClick && <ChevronRight size={14} className="ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />}
                </div>
            </div>
            {/* Decorative Icon Background */}
            <Icon
                className={`absolute -bottom-4 -right-4 w-32 h-32 opacity-[0.03] text-${baseColorName}-600 transform group-hover:scale-110 group-hover:rotate-[-10deg] transition-all duration-700 pointer-events-none`}
            />
        </motion.div>
    );
};

// Priority/Status Badge
const StatusBadge = ({ status }) => {
    const styles = {
        'pending': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        'dispensed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        'partially-dispensed': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'cancelled': 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    const labels = {
        'pending': 'Pending',
        'dispensed': 'Dispensed',
        'partially-dispensed': 'Partial',
        'cancelled': 'Cancelled'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['pending']}`}>
            {labels[status] || status}
        </span>
    );
};

const PharmacistDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // State
    const [stats, setStats] = useState({
        pendingPrescriptions: 0,
        dispensedToday: 0,
        lowStockItems: 0,
        expiringBatches: 0
    });
    const [pendingQueue, setPendingQueue] = useState([]);
    const [expiringBatches, setExpiringBatches] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Greeting logic
    const greeting = useMemo(() => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, [currentTime]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pendingRes, expiringRes, inventoryRes] = await Promise.all([
                pharmacyService.getPendingPrescriptions(),
                pharmacyService.getExpiringBatches(30),
                pharmacyService.getInventory('')
            ]);

            const pending = pendingRes.data || [];
            const expiring = expiringRes.data || [];
            const inventory = inventoryRes.data || [];

            setPendingQueue(pending.slice(0, 5));
            setExpiringBatches(expiring.slice(0, 5));

            // Calculate low stock items (below reorder level)
            const lowStock = inventory.filter(item => item.totalQuantity <= (item.reorderLevel || 50));
            setLowStockItems(lowStock.slice(0, 5));

            setStats({
                pendingPrescriptions: pending.length,
                dispensedToday: pending.filter(p => p.status === 'dispensed' &&
                    new Date(p.dispensedAt).toDateString() === new Date().toDateString()).length,
                lowStockItems: lowStock.length,
                expiringBatches: expiring.length
            });
        } catch (error) {
            console.error("Error fetching pharmacy dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        fetchData();
    };

    return (
        <div className="min-h-screen pb-12 max-w-7xl mx-auto">
            {/* Premium Welcome Banner */}
            <WelcomeBanner
                userName={user?.name?.split(' ')[0] || 'Pharmacist'}
                role="pharmacist"
                onRefresh={handleRefresh}
                isRefreshing={loading}
                lastUpdated={new Date()}
                subtitle="Manage prescriptions, dispense medications, and track inventory."
            />

            {/* Quick Action Button */}
            <div className="flex justify-end mt-4 mb-6">
                <button
                    onClick={() => navigate('/pharmacy')}
                    className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 inline-flex items-center gap-2"
                >
                    Go to Pharmacy <ArrowRight size={18} />
                </button>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Dispense Queue"
                    value={stats.pendingPrescriptions}
                    subtext="Pending prescriptions"
                    icon={Pill}
                    color="bg-emerald-500"
                    isLoading={loading}
                    delay={0}
                    highlight={stats.pendingPrescriptions > 0}
                    onClick={() => navigate('/pharmacy')}
                />
                <StatCard
                    title="Dispensed Today"
                    value={stats.dispensedToday}
                    subtext="Prescriptions fulfilled"
                    icon={CheckCircle}
                    color="bg-blue-500"
                    isLoading={loading}
                    delay={0.1}
                />
                <StatCard
                    title="Low Stock"
                    value={stats.lowStockItems}
                    subtext="Items need reorder"
                    icon={Package}
                    color="bg-amber-500"
                    isLoading={loading}
                    delay={0.2}
                    highlight={stats.lowStockItems > 0}
                    onClick={() => navigate('/pharmacy')}
                />
                <StatCard
                    title="Expiring Soon"
                    value={stats.expiringBatches}
                    subtext="Batches in 30 days"
                    icon={AlertTriangle}
                    color="bg-red-500"
                    isLoading={loading}
                    delay={0.3}
                    highlight={stats.expiringBatches > 0}
                    onClick={() => navigate('/pharmacy')}
                />
            </div>

            {/* Main Content Split: Dispense Queue & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Priority / Pending Queue List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-surface rounded-3xl border border-border p-6 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-xl text-text-primary flex items-center gap-2">
                                <Pill className="text-emerald-500" size={20} /> Dispense Queue
                            </h3>
                            <p className="text-sm text-text-muted">Prescriptions waiting for dispensing</p>
                        </div>
                        <button onClick={() => navigate('/pharmacy')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            View All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {pendingQueue.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4 text-text-muted">
                                    <CheckCircle size={32} />
                                </div>
                                <h4 className="text-text-secondary font-bold">All caught up!</h4>
                                <p className="text-text-muted text-sm">No pending prescriptions to dispense.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingQueue.map((item, idx) => (
                                    <div
                                        key={item._id || idx}
                                        onClick={() => navigate('/pharmacy')}
                                        className="group p-4 rounded-xl border border-border hover:border-emerald-500/30 bg-surface hover:bg-emerald-500/5 transition-all cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-xs font-bold text-text-secondary group-hover:bg-surface group-hover:text-emerald-500 transition-colors">
                                                {item.patient?.firstName?.[0] || '?'}{item.patient?.lastName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-primary group-hover:text-emerald-500 transition-colors">
                                                    {item.patient?.firstName} {item.patient?.lastName}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                    <span>{item.medicines?.length || 0} medication(s)</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{item.prescriptionNumber || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Prescribed</p>
                                                <p className="text-xs font-medium text-text-secondary">
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </p>
                                            </div>
                                            <StatusBadge status={item.status || 'pending'} />
                                            <ChevronRight size={18} className="text-text-muted group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Right Column: Quick Stats & Alerts */}
                <div className="space-y-6">
                    {/* Performance Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200"
                    >
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-200" /> Today's Activity
                        </h3>
                        <p className="text-emerald-100 text-sm opacity-80 mb-6">Pharmacy performance snapshot</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1">Queue</p>
                                <p className="text-2xl font-bold">{stats.pendingPrescriptions}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1">Dispensed</p>
                                <p className="text-2xl font-bold">{stats.dispensedToday}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Alerts Card - Expiring */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-surface rounded-3xl border border-border p-6 shadow-sm"
                    >
                        <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-red-500" />
                            Expiring Batches
                        </h4>
                        {expiringBatches.length === 0 ? (
                            <div className="text-center py-4 text-text-muted text-sm">
                                No batches expiring soon
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {expiringBatches.map((batch, idx) => (
                                    <div
                                        key={batch._id || idx}
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm"
                                    >
                                        <p className="font-medium text-red-500">{batch.medicine?.name || 'Unknown'}</p>
                                        <p className="text-xs text-red-400">
                                            Batch: {batch.batchNumber} • Expires: {batch.expiryDate ? format(new Date(batch.expiryDate), 'dd MMM yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-surface rounded-3xl border border-border p-6 shadow-sm"
                    >
                        <h4 className="font-bold text-text-primary mb-4">Quick Actions</h4>
                        <div className="space-y-2">
                            <button onClick={() => navigate('/pharmacy')} className="w-full p-3 text-left rounded-xl hover:bg-surface-highlight transition-colors flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-transparent hover:border-border">
                                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                    <Pill size={18} />
                                </div>
                                Dispense Prescription
                            </button>
                            <button onClick={() => navigate('/pharmacy')} className="w-full p-3 text-left rounded-xl hover:bg-surface-highlight transition-colors flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-transparent hover:border-border">
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <Box size={18} />
                                </div>
                                Manage Inventory
                            </button>
                            <button onClick={() => navigate('/pharmacy')} className="w-full p-3 text-left rounded-xl hover:bg-surface-highlight transition-colors flex items-center gap-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-transparent hover:border-border">
                                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                                    <AlertTriangle size={18} />
                                </div>
                                View Drug Recalls
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistDashboard;
