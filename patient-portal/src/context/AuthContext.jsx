import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const accessToken = localStorage.getItem('patientAccessToken');
        const storedPatient = localStorage.getItem('patient');

        if (accessToken && storedPatient) {
            try {
                // Verify token by fetching profile
                const response = await api.get('/patient/auth/profile');
                setPatient(response.data.data);
            } catch (err) {
                // Token invalid, try refresh
                await refreshToken();
            }
        }
        setIsLoading(false);
    };

    const login = async (patientId, dateOfBirth) => {
        setError(null);
        try {
            const response = await api.post('/patient/auth/login', {
                patientId,
                dateOfBirth,
            });

            const { accessToken, refreshToken, patient: patientData } = response.data;

            // Store tokens
            localStorage.setItem('patientAccessToken', accessToken);
            localStorage.setItem('patientRefreshToken', refreshToken);
            localStorage.setItem('patient', JSON.stringify(patientData));

            setPatient(patientData);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed. Please try again.';
            setError(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            await api.post('/patient/auth/logout');
        } catch (err) {
            // Ignore errors on logout
        }

        // Clear storage
        localStorage.removeItem('patientAccessToken');
        localStorage.removeItem('patientRefreshToken');
        localStorage.removeItem('patient');
        setPatient(null);
    };

    const refreshToken = async () => {
        const refreshTokenValue = localStorage.getItem('patientRefreshToken');

        if (!refreshTokenValue) {
            logout();
            return false;
        }

        try {
            const response = await api.post('/patient/auth/refresh', {
                refreshToken: refreshTokenValue,
            });

            const { accessToken, refreshToken: newRefreshToken, patient: patientData } = response.data;

            localStorage.setItem('patientAccessToken', accessToken);
            localStorage.setItem('patientRefreshToken', newRefreshToken);
            localStorage.setItem('patient', JSON.stringify(patientData));

            setPatient(patientData);
            return true;
        } catch (err) {
            logout();
            return false;
        }
    };

    const value = {
        patient,
        isLoading,
        isAuthenticated: !!patient,
        error,
        login,
        logout,
        refreshToken,
        clearError: () => setError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
