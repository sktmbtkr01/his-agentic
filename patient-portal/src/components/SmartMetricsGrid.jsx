import React from 'react';
import { Heart, Activity, Moon, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricCard = ({ icon: Icon, value, unit, label, bgClass, iconColorClass, delay }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.3 }}
        className={`${bgClass} rounded-3xl p-5 shadow-sm border border-stone-100/50 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow`}
    >
        <div className={`p-3 rounded-full bg-white mb-2 shadow-sm ${iconColorClass}`}>
            <Icon size={22} className="opacity-90" />
        </div>
        <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-sage-900">{value} {unit && <span className="text-sm font-medium text-stone-500 ml-0.5">{unit}</span>}</span>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-1">{label}</span>
        </div>
    </motion.div>
);

const SmartMetricsGrid = ({ vitalsData }) => {
    // Default values if data hasn't loaded yet
    const metrics = [
        {
            id: 'heart',
            icon: Heart,
            value: vitalsData?.vitals?.heartRate || '72',
            unit: 'bpm',
            label: 'Heart Rate',
            bgClass: 'bg-rose-50', // Muted Coral Tint
            iconColorClass: 'text-rose-500', 
        },
        {
            id: 'calories',
            icon: Flame,
            value: vitalsData?.lifestyle?.calories || '840',
            unit: 'kcal',
            label: 'Calories',
            bgClass: 'bg-orange-50', // Warm Amber/Orange Tint
            iconColorClass: 'text-orange-500',
        },
        {
            id: 'steps',
            icon: Activity, // Using Activity for Walk/Steps
            value: vitalsData?.lifestyle?.steps?.toLocaleString() || '1,240',
            unit: '',
            label: 'Steps',
            bgClass: 'bg-teal-50', // Dusty Teal Tint
            iconColorClass: 'text-teal-600',
        },
        {
            id: 'sleep',
            icon: Moon,
            value: vitalsData?.lifestyle?.sleepHours || '7h 20m',
            unit: '',
            label: 'Sleep',
            bgClass: 'bg-violet-50', // Soft Lavender Tint
            iconColorClass: 'text-violet-500',
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <MetricCard 
                    key={metric.id}
                    {...metric}
                    delay={index * 0.1}
                />
            ))}
        </div>
    );
};

export default SmartMetricsGrid;
