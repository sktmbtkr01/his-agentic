import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FlaskConical, Pill, ScanLine, Receipt, Check, Loader2,
    AlertCircle, Banknote, X, CheckCircle, CreditCard
} from 'lucide-react';
import departmentBillingService from '../../services/departmentBilling.service';
import toast from 'react-hot-toast';

/**
 * DepartmentBillingPanel - For departments (Lab, Radiology, Pharmacy) to generate and collect bills
 */
const DepartmentBillingPanel = ({ department, patientId, encounterId, encounterModel }) => {
    const [loading, setLoading] = useState(true);
    const [unbilledOrders, setUnbilledOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [departmentBills, setDepartmentBills] = useState([]);
    const [paymentModal, setPaymentModal] = useState(null);
    const [paymentData, setPaymentData] = useState({ amount: '', mode: 'cash', reference: '' });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, [department, patientId, encounterId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [unbilled, bills] = await Promise.all([
                departmentBillingService.getUnbilledOrders(department, patientId, encounterId),
                encounterId ? departmentBillingService.getDepartmentBillsForEncounter(encounterId) : [],
            ]);
            setUnbilledOrders(unbilled);
            setDepartmentBills(bills.filter(b => b.department === department));
        } catch (error) {
            toast.error('Failed to load data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleSelectAll = () => {
        if (selectedOrders.length === unbilledOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(unbilledOrders.map(o => o._id));
        }
    };

    const handleGenerateBill = async () => {
        if (selectedOrders.length === 0) {
            toast.error('Select at least one order');
            return;
        }

        setGenerating(true);
        try {
            let response;
            switch (department) {
                case 'laboratory':
                    response = await departmentBillingService.generateLabBill(
                        selectedOrders, encounterId, encounterModel, patientId
                    );
                    break;
                case 'radiology':
                    response = await departmentBillingService.generateRadiologyBill(
                        selectedOrders, encounterId, encounterModel, patientId
                    );
                    break;
                case 'pharmacy':
                    response = await departmentBillingService.generatePharmacyBill(
                        selectedOrders, encounterId, encounterModel, patientId
                    );
                    break;
            }
            toast.success('Bill generated successfully');
            setSelectedOrders([]);
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to generate bill');
        } finally {
            setGenerating(false);
        }
    };

    const handleRecordPayment = async () => {
        if (!paymentModal || !paymentData.amount || parseFloat(paymentData.amount) <= 0) {
            toast.error('Enter a valid amount');
            return;
        }

        setProcessing(true);
        try {
            await departmentBillingService.recordPayment(
                paymentModal._id,
                parseFloat(paymentData.amount),
                paymentData.mode,
                paymentData.reference
            );
            toast.success('Payment recorded successfully');
            setPaymentModal(null);
            setPaymentData({ amount: '', mode: 'cash', reference: '' });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    const getDeptIcon = () => {
        switch (department) {
            case 'pharmacy': return <Pill className="text-emerald-500" size={24} />;
            case 'laboratory': return <FlaskConical className="text-blue-500" size={24} />;
            case 'radiology': return <ScanLine className="text-violet-500" size={24} />;
            default: return <Receipt size={24} />;
        }
    };

    const getDeptColor = () => {
        switch (department) {
            case 'pharmacy': return 'emerald';
            case 'laboratory': return 'blue';
            case 'radiology': return 'violet';
            default: return 'gray';
        }
    };

    const getOrderDisplay = (order) => {
        switch (department) {
            case 'laboratory':
                return {
                    title: order.test?.testName || 'Lab Test',
                    subtitle: order.testNumber,
                    price: order.test?.price || 0,
                };
            case 'radiology':
                return {
                    title: order.test?.testName || 'Radiology',
                    subtitle: `${order.testNumber} - ${order.test?.modality || ''}`,
                    price: order.test?.price || 0,
                };
            case 'pharmacy':
                return {
                    title: `Dispense - ${order.items?.length || 0} items`,
                    subtitle: order.dispenseNumber,
                    price: order.netAmount || 0,
                };
            default:
                return { title: 'Order', subtitle: '', price: 0 };
        }
    };

    const color = getDeptColor();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl border border-${color}-100 shadow-sm overflow-hidden`}>
            {/* Header */}
            <div className={`p-4 border-b border-${color}-100 bg-${color}-50/50`}>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 capitalize">
                    {getDeptIcon()}
                    {department} Billing
                </h3>
            </div>

            {/* Unbilled Orders */}
            {unbilledOrders.length > 0 && (
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            <AlertCircle size={14} className="text-amber-500" />
                            Unbilled Orders ({unbilledOrders.length})
                        </h4>
                        <button
                            onClick={handleSelectAll}
                            className="text-xs text-primary font-medium hover:underline"
                        >
                            {selectedOrders.length === unbilledOrders.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {unbilledOrders.map((order) => {
                            const display = getOrderDisplay(order);
                            const isSelected = selectedOrders.includes(order._id);

                            return (
                                <div
                                    key={order._id}
                                    onClick={() => handleSelectOrder(order._id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                                            ? `bg-${color}-50 border-${color}-200`
                                            : 'bg-white border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? `bg-${color}-500 border-${color}-500` : 'border-gray-300'
                                        }`}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-700 truncate">{display.title}</p>
                                        <p className="text-xs text-gray-400 font-mono">{display.subtitle}</p>
                                    </div>
                                    <p className="font-bold text-slate-700">₹{display.price}</p>
                                </div>
                            );
                        })}
                    </div>

                    {selectedOrders.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleGenerateBill}
                            disabled={generating}
                            className={`mt-3 w-full py-2.5 bg-${color}-500 text-white rounded-lg font-medium hover:bg-${color}-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                            {generating ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Receipt size={18} />
                            )}
                            {generating ? 'Generating...' : `Generate Bill (${selectedOrders.length} items)`}
                        </motion.button>
                    )}
                </div>
            )}

            {/* Generated Bills */}
            {departmentBills.length > 0 && (
                <div className="p-4">
                    <h4 className="text-sm font-semibold text-slate-600 mb-3">
                        Generated Bills ({departmentBills.length})
                    </h4>
                    <div className="space-y-2">
                        {departmentBills.map((bill) => (
                            <div
                                key={bill._id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                            >
                                <div>
                                    <p className="font-mono text-sm font-medium text-slate-700">{bill.billNumber}</p>
                                    <p className="text-xs text-gray-400">
                                        ₹{bill.grandTotal} | {bill.items?.length || 0} item(s)
                                    </p>
                                </div>
                                {bill.paymentStatus === 'paid' ? (
                                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <CheckCircle size={14} /> PAID
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setPaymentModal(bill);
                                            setPaymentData(prev => ({ ...prev, amount: bill.balanceAmount.toString() }));
                                        }}
                                        className={`px-3 py-1.5 bg-${color}-500 text-white rounded-lg text-xs font-bold hover:bg-${color}-600 transition-colors flex items-center gap-1`}
                                    >
                                        <Banknote size={14} /> Collect ₹{bill.balanceAmount}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {unbilledOrders.length === 0 && departmentBills.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                    <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No billing activity for this {department}.</p>
                </div>
            )}

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
                            <button
                                onClick={() => setPaymentModal(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={18} />
                            </button>

                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Banknote size={20} className={`text-${color}-500`} />
                                Collect Payment
                            </h3>

                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Bill</p>
                                    <p className="font-mono font-bold">{paymentModal.billNumber}</p>
                                    <p className="text-sm text-gray-500">Balance: ₹{paymentModal.balanceAmount}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                        max={paymentModal.balanceAmount}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Payment Mode</label>
                                    <div className="flex gap-2">
                                        {['cash', 'card', 'upi'].map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentData(prev => ({ ...prev, mode }))}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${paymentData.mode === mode
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Reference</label>
                                    <input
                                        type="text"
                                        value={paymentData.reference}
                                        onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setPaymentModal(null)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRecordPayment}
                                    disabled={processing}
                                    className={`flex-1 py-2.5 bg-${color}-500 text-white rounded-lg font-medium hover:bg-${color}-600 disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {processing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    {processing ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DepartmentBillingPanel;
