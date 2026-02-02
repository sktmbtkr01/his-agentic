import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { login, reset } from '../../features/auth/authSlice';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [pendingApproval, setPendingApproval] = useState(null);

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    // Error handling effect
    useEffect(() => {
        if (isError) {
            dispatch(reset());
        }
    }, [isError, message, dispatch]);

    // Success/Navigation effect
    useEffect(() => {
        if (isSuccess || user) {
            // Check if this is a pending approval response
            if (user?.pendingApproval) {
                setPendingApproval(user);
                dispatch(reset());
                return;
            }

            if (user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, isSuccess, navigate, dispatch]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (isSuccess) dispatch(reset());
        };
    }, [dispatch, isSuccess]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        setPendingApproval(null);
        const userData = {
            email,
            password,
        };
        dispatch(login(userData));
    };

    // Show pending approval screen
    if (pendingApproval) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full p-12 text-center"
                >
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">⏳</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">Approval Pending</h1>
                    <p className="text-slate-500 mb-6">
                        Your account is awaiting approval from the administrator. You will be able to access the system once your account is approved.
                    </p>
                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                        <div className="text-sm text-slate-500 mb-1">Logged in as</div>
                        <div className="font-semibold text-slate-800">{pendingApproval.user?.email}</div>
                        <div className="text-sm text-slate-500 mt-2 mb-1">Role</div>
                        <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                            {pendingApproval.user?.role?.replace('_', ' ')}
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-6">
                        Please contact your administrator if you have been waiting for more than 24 hours.
                    </p>
                    <button
                        onClick={() => setPendingApproval(null)}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-all"
                    >
                        Back to Login
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2"
            >
                {/* Left Side - Form */}
                <div className="p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4">
                            <Activity size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
                        <p className="text-slate-500 mt-2">Please sign in to access your dashboard.</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="doctor@hospital.com"
                                />
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            </div>
                        </div>

                        {isError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {message || "Login failed"}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                                <span className="text-sm text-slate-600">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-primary font-medium hover:underline">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    {/* Onboarding Signup Link */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <Link
                            to="/signup"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-all"
                        >
                            <UserPlus size={18} />
                            Create Account with Onboarding ID
                        </Link>
                        <p className="text-xs text-center text-slate-400 mt-3">
                            New staff? Get your onboarding ID from the administrator.
                        </p>
                    </div>
                </div>

                {/* Right Side - Image/Info */}
                <div className="bg-primary/5 p-12 hidden md:flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-8 relative z-10"
                    >
                        <div className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center">
                            <img src="https://img.freepik.com/free-vector/doctors-concept-illustration_114360-1515.jpg?w=740&t=st=1709491633~exp=1709492233~hmac=6b93a89e4a8c99f9e5a5a1f5a5a1f5a5a1f5a5a1f5" alt="Login" className="w-48 opacity-80" />
                        </div>
                    </motion.div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure & Compliant</h2>
                        <p className="text-slate-500 max-w-xs mx-auto">Access patient records, manage appointments, and track vitals with bank-grade security.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

