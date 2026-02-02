import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Lock, Mail, User, Phone, ArrowRight, ArrowLeft,
    AlertCircle, CheckCircle, Key, Shield
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth.service';

/**
 * Staff Signup Page with Onboarding ID Validation
 * 
 * Two-step flow:
 * 1. Enter and validate onboarding ID
 * 2. Complete signup form (role is read-only from step 1)
 */

const ROLE_LABELS = {
    doctor: 'Doctor',
    nurse: 'Nurse',
    head_nurse: 'Head Nurse',
    lab_tech: 'Lab Technician',
    radiologist: 'Radiologist',
    pharmacist: 'Pharmacist',
    billing: 'Billing Staff',
    receptionist: 'Receptionist',
    inventory_manager: 'Inventory Manager',
    coder: 'Medical Coder',
    senior_coder: 'Senior Coder',
    insurance: 'Insurance Staff',
    compliance: 'Compliance Officer',
};

const Signup = () => {
    const navigate = useNavigate();

    // Step management
    const [step, setStep] = useState(1); // 1 = validate ID, 2 = signup form, 3 = success

    // Onboarding ID validation
    const [onboardingCode, setOnboardingCode] = useState('');
    const [validatedData, setValidatedData] = useState(null);
    const [idError, setIdError] = useState('');
    const [idLoading, setIdLoading] = useState(false);

    // Signup form
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Success data
    const [successData, setSuccessData] = useState(null);

    // Step 1: Validate Onboarding ID
    const handleValidateId = async (e) => {
        e.preventDefault();

        if (!onboardingCode.trim()) {
            setIdError('Please enter your onboarding ID');
            return;
        }

        setIdLoading(true);
        setIdError('');

        try {
            const response = await authService.validateOnboardingId(onboardingCode);

            if (response.success) {
                setValidatedData({
                    code: onboardingCode,
                    role: response.data.role,
                    department: response.data.department,
                });
                setStep(2);
            }
        } catch (error) {
            setIdError(error.response?.data?.error || 'Invalid onboarding ID. Please check and try again.');
        } finally {
            setIdLoading(false);
        }
    };

    // Step 2: Complete Signup
    const handleSignup = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.firstName || !formData.lastName) {
            setFormError('Please enter your full name');
            return;
        }

        if (!formData.email) {
            setFormError('Please enter your email address');
            return;
        }

        if (!formData.username || formData.username.length < 3) {
            setFormError('Username must be at least 3 characters');
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }

        setFormLoading(true);
        setFormError('');

        try {
            const response = await authService.signupWithOnboarding({
                onboardingCode: validatedData.code,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                username: formData.username,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
            });

            if (response.success) {
                setSuccessData(response.data);
                setStep(3);
            }
        } catch (error) {
            setFormError(error.response?.data?.error || 'Signup failed. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const onChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2"
            >
                {/* Left Side - Form */}
                <div className="p-12 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Validate Onboarding ID */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="mb-8">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                                        <Key size={24} />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
                                    <p className="text-slate-500 mt-2">
                                        Enter your onboarding ID provided by the administrator.
                                    </p>
                                </div>

                                <form onSubmit={handleValidateId} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Onboarding ID
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={onboardingCode}
                                                onChange={(e) => setOnboardingCode(e.target.value.toUpperCase())}
                                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono text-lg tracking-wider"
                                                placeholder="ONB-XXXX-XXXX-XXXX"
                                            />
                                            <Key className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Format: ONB-XXXX-XXXX-XXXX
                                        </p>
                                    </div>

                                    {idError && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            {idError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={idLoading}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {idLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Validate ID <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                                    <Link
                                        to="/login"
                                        className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={16} />
                                        Back to Login
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Signup Form */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="mb-6">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
                                    >
                                        <ArrowLeft size={14} />
                                        Back
                                    </button>
                                    <h1 className="text-2xl font-bold text-slate-800">Complete Your Profile</h1>
                                    <p className="text-slate-500 mt-1 text-sm">
                                        Fill in your details to create your account.
                                    </p>
                                </div>

                                {/* Role Display (Read-only) */}
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-indigo-600 font-medium">Assigned Role</div>
                                            <div className="text-lg font-bold text-slate-800">
                                                {ROLE_LABELS[validatedData?.role] || validatedData?.role}
                                            </div>
                                        </div>
                                    </div>
                                    {validatedData?.department && (
                                        <div className="mt-2 text-sm text-slate-500">
                                            Department: {validatedData.department.name}
                                        </div>
                                    )}
                                    <p className="text-xs text-indigo-500 mt-2">
                                        ⚠️ Role is assigned by admin and cannot be changed.
                                    </p>
                                </div>

                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={onChange}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={onChange}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Email *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={onChange}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                required
                                            />
                                            <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={onChange}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                            />
                                            <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Username *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={onChange}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                minLength={3}
                                                required
                                            />
                                            <User className="absolute left-3 top-3 text-slate-400" size={16} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Password *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={onChange}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                    minLength={6}
                                                    required
                                                />
                                                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Confirm Password *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={onChange}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                                    minLength={6}
                                                    required
                                                />
                                                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {formError && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            {formError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {formLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Create Account <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 3: Success */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={40} className="text-green-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-800 mb-4">Account Created!</h1>
                                <p className="text-slate-500 mb-6">
                                    Your account has been created successfully and is now pending approval from the administrator.
                                </p>

                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">⏳</span>
                                        <div>
                                            <div className="font-semibold text-slate-800">Awaiting Approval</div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                You will be able to access the system once your account is approved by the administrator.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {successData && (
                                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                        <div className="grid grid-cols-2 gap-4 text-sm text-left">
                                            <div>
                                                <div className="text-slate-400">Username</div>
                                                <div className="font-medium text-slate-800">{successData.username}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400">Email</div>
                                                <div className="font-medium text-slate-800">{successData.email}</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400">Role</div>
                                                <div className="font-medium text-slate-800 capitalize">
                                                    {ROLE_LABELS[successData.role] || successData.role}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400">Status</div>
                                                <div className="font-medium text-amber-600">Pending Approval</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all"
                                >
                                    <ArrowLeft size={18} />
                                    Back to Login
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side - Info */}
                <div className="bg-indigo-600 p-12 hidden md:flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/50 to-transparent" />

                    {/* Decorative Elements */}
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10"
                    >
                        <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 border border-white/20">
                            <Shield size={80} className="text-white/90" />
                        </div>
                    </motion.div>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-3">Admin-Controlled Onboarding</h2>
                        <p className="text-indigo-100 max-w-xs mx-auto">
                            Staff onboarding is fully admin-controlled. No one can create an account or choose a role without explicit authorization.
                        </p>
                    </div>

                    <div className="mt-8 relative z-10">
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                            <CheckCircle size={16} />
                            <span>Role assigned by admin</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-sm mt-2">
                            <CheckCircle size={16} />
                            <span>Cryptographically secure IDs</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-sm mt-2">
                            <CheckCircle size={16} />
                            <span>Approval required before access</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
