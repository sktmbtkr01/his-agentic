import React, { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WellnessHero = ({ onMenuClick }) => {
    const { patient } = useAuth();

    return (
        <div className="pt-6 pb-2 w-full max-w-full overflow-hidden">
            {/* Header: Avatar, Greeting, Actions */}
            <div className="flex justify-between items-start mb-6 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <img 
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${patient?.firstName || 'User'}&backgroundColor=e3e4db`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-sage-400 p-1 rounded-full border-2 border-bone-100">
                             <div className="w-2 h-2 bg-sage-900 rounded-full"></div>
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-serif text-sage-900 leading-tight truncate">
                            Hey, {patient?.firstName || 'Friend'} <span className="inline-block animate-wave">👋</span>
                        </h1>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-sage-600 bg-sage-100 px-2 py-0.5 rounded-full w-fit mt-0.5">
                            <span className="w-1.5 h-1.5 bg-sage-500 rounded-full animate-pulse shrink-0"></span>
                            <span className="truncate">Pro Member</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                     <button className="w-10 h-10 rounded-full bg-white border border-bone-200 flex items-center justify-center text-sage-700 shadow-sm btn-icon hover:bg-sage-50">
                        <Bell size={20} />
                    </button>
                    {/* Menu button */}
                     <button onClick={onMenuClick} className="w-10 h-10 rounded-full bg-sage-800 flex items-center justify-center text-bone-100 shadow-sm btn-icon hover:bg-sage-900">
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            {/* Search Bar - now harmonized */}
            <div className="relative mb-8">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sage-400">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search health records..." 
                    className="w-full bg-white border border-white focus:border-sage-200 focus:bg-white rounded-full py-4 pl-12 pr-4 text-sage-800 placeholder-sage-300 shadow-soft outline-none transition-all font-medium"
                />
            </div>
        </div>
    );
};

export default WellnessHero;
