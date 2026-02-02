/**
 * Inventory Dashboard
 * Main dashboard for Inventory Manager role
 * Displays real-time stock overview, alerts, and quick actions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, CheckCircle, Clock, TrendingUp, ShieldCheck, FileText, AlertOctagon } from 'lucide-react';
import inventoryManagerService from '../../services/inventoryManager.service';
import './InventoryDashboard.css';

const InventoryDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        counts: {
            totalItems: 0,
            activeVendors: 0,
            lowStockItems: 0,
            overstockedItems: 0,
            nearExpiryItems: 0,
            expiredItems: 0,
            activeRecalls: 0
        },
        orderStats: [],
        recentOrders: [],
        insights: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await inventoryManagerService.getDashboard();
            if (response?.data) {
                setData(response.data);
            } else if (response) {
                setData(response);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, onClick, subtext }) => (
        <div
            className={`bg-surface dark:bg-surface-highlight p-6 rounded-xl shadow-sm border border-slate-100 dark:border-stone-700 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group`}
            onClick={onClick}
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform ${color}`} />
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', 'text-')}`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                {/* Trend Indicator (Mock) */}
                <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">
                    <TrendingUp size={12} className="mr-1" />
                    +2.4%
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-bold text-textPrimary mb-1">{value}</h3>
                <p className="text-textSecondary text-sm font-medium">{title}</p>
                {subtext && <p className="text-xs text-stone-400 mt-2">{subtext}</p>}
            </div>
        </div>
    );

    const InsightCard = ({ type, message }) => {
        const styles = {
            critical: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300',
            warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-300',
            info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300'
        };
        const icons = {
            critical: <AlertOctagon size={16} />,
            warning: <AlertTriangle size={16} />,
            info: <Clock size={16} />
        };

        return (
            <div className={`p-3 rounded-lg border flex items-start gap-3 mb-2 text-sm ${styles[type] || styles.info}`}>
                <div className="mt-0.5">{icons[type] || icons.info}</div>
                <p>{message}</p>
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center text-textSecondary">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error} <button onClick={fetchDashboardData} className="underline ml-2">Retry</button></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-textPrimary">Inventory Dashboard</h1>
                    <p className="text-textSecondary">Overview of stock health and procurement</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/inventory/items')}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:brightness-110 transition flex items-center gap-2 shadow-sm"
                    >
                        <Package size={18} />
                        Go to Inventory Management
                    </button>
                    <button
                        onClick={() => fetchDashboardData()}
                        className="bg-surface dark:bg-surface-highlight text-textSecondary border border-slate-200 dark:border-stone-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-stone-700 transition shadow-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Items"
                    value={data.counts.totalItems}
                    icon={Package}
                    color="bg-blue-500"
                    onClick={() => navigate('/inventory/items')}
                />
                <StatCard
                    title="Low Stock"
                    value={data.counts.lowStockItems}
                    icon={AlertTriangle}
                    color="bg-orange-500"
                    subtext="Items below reorder level"
                    onClick={() => navigate('/inventory/items?status=LOW_STOCK')}
                />
                <StatCard
                    title="Overstocked"
                    value={data.counts.overstockedItems}
                    icon={TrendingUp}
                    color="bg-indigo-500"
                    subtext="Exceeding max threshold"
                />
                <StatCard
                    title="Expired / Recalls"
                    value={data.counts.expiredItems + data.counts.activeRecalls}
                    icon={AlertOctagon}
                    color="bg-red-500"
                    subtext="Immediate action required"
                    onClick={() => navigate('/inventory/items?status=EXPIRED')}
                />
            </div>

            {/* Main Content Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Orders Overview Chart */}
                <div className="lg:col-span-2 bg-surface dark:bg-surface-highlight p-6 rounded-xl shadow-sm border border-slate-100 dark:border-stone-700">
                    <h2 className="text-lg font-bold text-textPrimary mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-textSecondary" />
                        Procurement Orders Overview
                    </h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.orderStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cccccc44" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--bg-surface)' }}
                                />
                                <Bar dataKey="value" fill="rgb(var(--color-primary))" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Insights & Audit */}
                <div className="space-y-6">
                    {/* Insights Panel */}
                    <div className="bg-surface dark:bg-surface-highlight p-6 rounded-xl shadow-sm border border-slate-100 dark:border-stone-700">
                        <h2 className="text-lg font-bold text-textPrimary mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Inventory Insights
                        </h2>
                        <div className="space-y-1">
                            {data.insights.length > 0 ? (
                                data.insights.map((insight, idx) => (
                                    <InsightCard key={idx} type={insight.type} message={insight.message} />
                                ))
                            ) : (
                                <p className="text-textSecondary text-sm">No critical insights at the moment. Operations normal.</p>
                            )}
                        </div>
                    </div>

                    {/* External Audit Panel */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-black p-6 rounded-xl shadow-sm text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck size={80} />
                        </div>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-indigo-300" />
                            External Compliance
                        </h2>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-indigo-200 text-sm">Last Audit</span>
                                <span className="font-mono font-medium">12 Dec 2025</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-indigo-200 text-sm">Next Due</span>
                                <span className="font-mono font-medium text-amber-300">12 Jun 2026</span>
                            </div>
                            <div>
                                <span className="text-indigo-200 text-xs uppercase tracking-wider">Auditor</span>
                                <p className="font-medium mt-1">ABC Healthcare Audits Pvt. Ltd.</p>
                            </div>
                            <div className="pt-2">
                                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded border border-emerald-500/30">
                                    • Compliance Status: Good
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-surface dark:bg-surface-highlight rounded-xl shadow-sm border border-slate-100 dark:border-stone-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-stone-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-textPrimary">Recent Purchase Orders</h2>
                    <button
                        onClick={() => navigate('/inventory/purchase-orders')}
                        className="text-primary text-sm hover:underline"
                    >
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-textSecondary">
                        <thead className="bg-slate-50 dark:bg-stone-800 text-textSecondary uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold">PO Number</th>
                                <th className="px-6 py-4 font-semibold">Vendor</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-stone-700">
                            {data.recentOrders.length > 0 ? (
                                data.recentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-stone-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-textPrimary">{order.poNumber}</td>
                                        <td className="px-6 py-4">{order.vendor?.vendorName || '-'}</td>
                                        <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                ${order.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                    order.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                        order.status === 'closed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                            'bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-400'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-textPrimary">
                                            ${(order.totalAmount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-textSecondary">
                                        No recent orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;
