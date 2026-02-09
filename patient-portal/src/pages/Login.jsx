import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Calendar, ArrowRight, Activity, Lock, Phone } from 'lucide-react';

const Login = () => {
    const [patientId, setPatientId] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(patientId, dateOfBirth);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bone-100 relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sage-200/40 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-peach-200/40 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sage-600 text-white mb-4 shadow-lg shadow-sage-200 transform rotate-3"
                    >
                        <Activity size={32} />
                    </motion.div>
                    <h1 className="font-serif text-4xl text-sage-900 mb-1 tracking-tight">LifelineX</h1>
                    <p className="text-sage-600 font-medium tracking-wide text-sm uppercase">Patient Portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-soft">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-serif text-sage-900 mb-2">Welcome Back</h2>
                        <p className="text-sage-500 text-sm">Please sign in to access your health records</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 mb-6 flex items-start gap-3"
                        >
                            <div className="mt-0.5 min-w-[16px]">⚠️</div>
                            <p>{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient ID */}
                        <div className="space-y-2">
                            <label htmlFor="patientId" className="block text-sm font-medium text-sage-700 ml-1">
                                Patient ID
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400 group-focus-within:text-sage-600 transition-colors">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    id="patientId"
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                                    placeholder="e.g., PAT000001"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-sage-200 bg-white/50 focus:bg-white focus:border-sage-400 focus:ring-4 focus:ring-sage-100 transition-all outline-none text-sage-900 placeholder:text-sage-300 font-medium uppercase"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-sage-700 ml-1">
                                Date of Birth
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400 group-focus-within:text-sage-600 transition-colors">
                                    <Calendar size={20} />
                                </div>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-sage-200 bg-white/50 focus:bg-white focus:border-sage-400 focus:ring-4 focus:ring-sage-100 transition-all outline-none text-sage-900 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !patientId || !dateOfBirth}
                            className="w-full py-4 rounded-xl bg-sage-600 text-white font-semibold text-lg hover:bg-sage-700 active:scale-[0.98] transition-all shadow-lg shadow-sage-200 hover:shadow-sage-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer / Help */}
                <div className="mt-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-white/50 backdrop-blur-sm text-sm text-sage-700">
                        <Phone size={14} className="text-sage-500" />
                        <span>Support: <a href="tel:+911234567890" className="font-bold text-sage-800 hover:text-sage-900 transition-colors">+91 123 456 7890</a></span>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-sage-500 opacity-80">
                        <Lock size={12} />
                        <span>End-to-end encrypted & secure</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
