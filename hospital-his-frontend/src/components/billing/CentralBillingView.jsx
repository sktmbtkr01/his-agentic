import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, FlaskConical, Pill, ScanLine, CheckCircle, Clock,
    AlertCircle, ChevronDown, ChevronUp, Banknote, CreditCard, Loader2, X
} from 'lucide-react';
import departmentBillingService from '../../services/departmentBilling.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * CentralBillingView - Shows unified department billing view for billing department
 * Displays department-wise breakdown with paid/unpaid status
 */
const CentralBillingView = ({ encounterId, patientName, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [billingData, setBillingData] = useState(null);
    const [expandedDept, setExpandedDept] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('cash');
    const [paymentRef, setPaymentRef] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (encounterId) {
            loadBillingData();
        }
    }, [encounterId]);

    const loadBillingData = async () => {
        try {
            setLoading(true);
            const data = await departmentBillingService.getCentralBillingView(encounterId);
            setBillingData(data);
        } catch (error) {
            toast.error('Failed to load billing data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async () => {
        if (!paymentModal || !paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Enter a valid amount');
            return;
        }

        setProcessing(true);
        try {
            await departmentBillingService.recordPayment(
                paymentModal._id,
                parseFloat(paymentAmount),
                paymentMode,
                paymentRef
            );
            toast.success('Payment recorded successfully');
            setPaymentModal(null);
            setPaymentAmount('');
            setPaymentRef('');
            loadBillingData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    const getDeptIcon = (dept) => {
        switch (dept) {
            case 'pharmacy': return <Pill className="text-emerald-500" />;
            case 'laboratory': return <FlaskConical className="text-blue-500" />;
            case 'radiology': return <ScanLine className="text-violet-500" />;
            default: return <Receipt className="text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle size={12} /> Paid</span>;
            case 'partial':
                return <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock size={12} /> Partial</span>;
            case 'pending':
                return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"><AlertCircle size={12} /> Unpaid</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">No Charges</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!billingData) {
        return (
            <div className="p-8 text-center text-gray-500">
                No billing data found for this encounter.
            </div>
        );
    }

    const { departmentBreakdown, totalAmount, totalPaid, totalBalance } = billingData;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Receipt size={24} className="text-primary" />
                            Central Billing View
                        </h2>
                        {patientName && (
                            <p className="text-sm text-gray-500 mt-1">Patient: {patientName}</p>
                        )}
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-50">
                <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                    <p className="text-2xl font-bold text-slate-800">₹{totalAmount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                    <p className="text-xs text-emerald-600 uppercase font-bold">Total Paid</p>
                    <p className="text-2xl font-bold text-emerald-700">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                    <p className="text-xs text-amber-600 uppercase font-bold">Balance Due</p>
                    <p className="text-2xl font-bold text-amber-700">₹{totalBalance.toLocaleString()}</p>
                </div>
            </div>

            {/* Department Breakdown */}
            <div className="p-6">
                <h3 className="font-bold text-slate-700 mb-4">Department Breakdown</h3>
                <div className="space-y-3">
                    {['pharmacy', 'laboratory', 'radiology'].map((dept) => {
                        const data = departmentBreakdown[dept];
                        const isExpanded = expandedDept === dept;

                        return (
                            <div key={dept} className="border border-gray-100 rounded-xl overflow-hidden">
                                {/* Department Header */}
                                <div
                                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : 'bg-white'
                                        }`}
                                    onClick={() => setExpandedDept(isExpanded ? null : dept)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-50">
                                            {getDeptIcon(dept)}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 capitalize">{dept}</h4>
                                            <p className="text-xs text-gray-500">
                                                {data.bills?.length || 0} bill(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800">₹{data.total.toLocaleString()}</p>
                                            {data.status !== 'none' && (
                                                <p className="text-xs text-emerald-600">
                                                    Paid: ₹{data.paid.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(data.status)}
                                        {data.bills?.length > 0 && (
                                            isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Bills */}
                                <AnimatePresence>
                                    {isExpanded && data.bills?.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-100"
                                        >
                                            <div className="p-4 bg-slate-50 space-y-2">
                                                {data.bills.map((bill) => (
                                                    <div
                                                        key={bill._id}
                                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
                                                    >
                                                        <div>
                                                            <p className="font-mono text-sm text-slate-700">{bill.billNumber}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {format(new Date(bill.billDate), 'dd/MM/yyyy HH:mm')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className="font-medium">₹{bill.grandTotal}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Balance: ₹{bill.balanceAmount}
                                                                </p>
                                                            </div>
                                                            {bill.paymentStatus === 'paid' ? (
                                                                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                                                    <CheckCircle size={14} /> PAID
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPaymentModal(bill);
                                                                        setPaymentAmount(bill.balanceAmount.toString());
                                                                    }}
                                                                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1"
                                                                >
                                                                    <Banknote size={14} /> Collect
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setPaymentModal(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                        >
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Banknote size={20} className="text-primary" />
                                Record Payment
                            </h3>

                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Bill Number</p>
                                    <p className="font-mono font-bold">{paymentModal.billNumber}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        max={paymentModal.balanceAmount}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Enter amount"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Max: ₹{paymentModal.balanceAmount}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Payment Mode</label>
                                    <div className="flex gap-2">
                                        {['cash', 'card', 'upi'].map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentMode(mode)}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${paymentMode === mode
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {mode === 'card' && <CreditCard size={14} className="inline mr-1" />}
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Reference (Optional)</label>
                                    <input
                                        type="text"
                                        value={paymentRef}
                                        onChange={(e) => setPaymentRef(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Transaction ID / Receipt #"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setPaymentModal(null)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRecordPayment}
                                    disabled={processing || !paymentAmount}
                                    className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    {processing ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CentralBillingView;
