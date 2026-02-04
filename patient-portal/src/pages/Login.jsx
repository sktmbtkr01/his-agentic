import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <div className="min-h-screen flex items-center justify-center px-4 py-12 page-container">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="logo-text text-3xl mb-2">LifelineX</h1>
                    <p className="text-stone-600 dark:text-stone-400">Patient Portal</p>
                </div>

                {/* Login Card */}
                <div className="card card-elevated">
                    <h2 className="text-xl font-semibold text-center mb-6" style={{ color: 'rgb(var(--color-text-primary))' }}>
                        Welcome Back
                    </h2>

                    {error && (
                        <div className="alert alert-error mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Patient ID */}
                        <div>
                            <label htmlFor="patientId" className="label">
                                Patient ID
                            </label>
                            <input
                                type="text"
                                id="patientId"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                                placeholder="e.g., PAT000001"
                                className="input"
                                required
                                autoComplete="off"
                            />
                            <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-muted))' }}>
                                Enter your Patient ID from your hospital records
                            </p>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label htmlFor="dateOfBirth" className="label">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="input"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !patientId || !dateOfBirth}
                            className="btn btn-primary w-full py-3 text-base"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="spinner"></span>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgb(var(--color-surface-highlight))' }}>
                        <p className="text-sm text-center" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            Need help? Contact the hospital reception or call{' '}
                            <a href="tel:+911234567890" className="font-medium" style={{ color: 'rgb(var(--color-primary))' }}>
                                +91 123 456 7890
                            </a>
                        </p>
                    </div>
                </div>

                {/* Security Notice */}
                <p className="text-xs text-center mt-6" style={{ color: 'rgb(var(--color-text-muted))' }}>
                    🔒 Your health data is protected with end-to-end encryption
                </p>
            </div>
        </div>
    );
};

export default Login;
