import React from 'react';
import { Home, Activity, User, Grid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const FloatingNavBar = () => {
    const location = useLocation();
    
    const navItems = [
        { icon: Home, path: '/', label: 'Home' },
        { icon: Activity, path: '/devices', label: 'Activity' },
        { icon: Grid, path: '/health-record', label: 'Records' },
        { icon: User, path: '/profile', label: 'Profile' }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md pointer-events-none flex justify-center">
            <nav className="bg-sage-900/95 backdrop-blur-md px-2 py-2 rounded-full shadow-2xl shadow-sage-900/20 border border-sage-800 flex items-center gap-1 pointer-events-auto">
                {navItems.map((item) => (
                    <Link 
                        key={item.path}
                        to={item.path}
                        className="relative group w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300"
                    >
                        {/* Active Indicator Background */}
                        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive(item.path) ? 'bg-peach-400 scale-100' : 'bg-transparent scale-0'}`} />
                        
                        {/* Icon */}
                        <item.icon 
                            size={22} 
                            className={`relative z-10 transition-colors duration-300 ${isActive(item.path) ? 'text-sage-900' : 'text-bone-200 group-hover:text-white'}`} 
                            strokeWidth={isActive(item.path) ? 2.5 : 2}
                        />
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default FloatingNavBar;
