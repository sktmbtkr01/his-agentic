import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const ThemeContext = createContext();

// Role to theme color mapping
const ROLE_THEMES = {
    doctor: 'doctor',
    nurse: 'nurse',
    admin: 'admin',
    lab_technician: 'lab',
    lab: 'lab',
    radiologist: 'radiologist',
    radiology: 'radiologist',
    pharmacist: 'pharmacist',
    pharmacy: 'pharmacist',
    receptionist: 'receptionist',
    front_desk: 'receptionist',
    billing: 'billing',
    billing_staff: 'billing',
    // Default fallback
    default: 'doctor'
};

export const ThemeProvider = ({ children }) => {
    // Get user from Redux store for role-based theming
    const { user } = useSelector((state) => state.auth);
    
    // Theme state (light/dark)
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Role theme state
    const [roleTheme, setRoleTheme] = useState(() => {
        const savedRole = localStorage.getItem('roleTheme');
        return savedRole || 'doctor';
    });

    // Determine role theme based on user role
    useEffect(() => {
        if (user?.role) {
            const mappedRole = ROLE_THEMES[user.role.toLowerCase()] || ROLE_THEMES.default;
            setRoleTheme(mappedRole);
            localStorage.setItem('roleTheme', mappedRole);
        }
    }, [user?.role]);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        // Temporarily disable transitions to prevent flash
        root.classList.add('no-transitions');

        // Remove old theme classes
        root.classList.remove('light', 'dark');

        // Add new theme class
        root.classList.add(theme);

        // Set data-role attribute for role-specific CSS
        root.setAttribute('data-role', roleTheme);

        // Save theme preference
        localStorage.setItem('theme', theme);

        // Re-enable transitions after a brief delay
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                root.classList.remove('no-transitions');
            });
        });
    }, [theme, roleTheme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Toggle between light and dark
    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    // Set specific theme
    const setThemeMode = useCallback((mode) => {
        if (mode === 'light' || mode === 'dark') {
            setTheme(mode);
        } else if (mode === 'system') {
            localStorage.removeItem('theme');
            setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
    }, []);

    // Manually set role theme (for testing/admin override)
    const setRoleThemeManual = useCallback((role) => {
        const mappedRole = ROLE_THEMES[role.toLowerCase()] || ROLE_THEMES.default;
        setRoleTheme(mappedRole);
        localStorage.setItem('roleTheme', mappedRole);
    }, []);

    // Get current role color hex values (useful for charts/graphs)
    const getRoleColors = useCallback(() => {
        const colors = {
            doctor: { primary: '#06b6d4', light: '#a5f3fc', dark: '#0e7490' },
            nurse: { primary: '#ec4899', light: '#fbcfe8', dark: '#be185d' },
            admin: { primary: '#8b5cf6', light: '#ddd6fe', dark: '#6d28d9' },
            lab: { primary: '#10b981', light: '#a7f3d0', dark: '#047857' },
            radiologist: { primary: '#f59e0b', light: '#fde68a', dark: '#b45309' },
            pharmacist: { primary: '#3b82f6', light: '#bfdbfe', dark: '#1d4ed8' },
            receptionist: { primary: '#7c3aed', light: '#ddd6fe', dark: '#5b21b6' },
            billing: { primary: '#14b8a6', light: '#99f6e4', dark: '#0f766e' },
        };
        return colors[roleTheme] || colors.doctor;
    }, [roleTheme]);

    const value = {
        // Theme state
        theme,
        isDark: theme === 'dark',
        isLight: theme === 'light',
        
        // Role theme state
        roleTheme,
        
        // Actions
        toggleTheme,
        setThemeMode,
        setRoleTheme: setRoleThemeManual,
        
        // Utilities
        getRoleColors,
        
        // Constants
        availableRoles: Object.keys(ROLE_THEMES).filter(k => k !== 'default'),
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
