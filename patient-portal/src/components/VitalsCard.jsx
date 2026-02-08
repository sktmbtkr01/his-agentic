import React from 'react';
import { Activity, Brain, Footprints, Heart, Moon, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const VitalsCard = ({ 
    type = 'heart', // heart, sleep, steps
    value, 
    unit, 
    label,
    status,
    onClick 
}) => {
    
    // Updated to match Sage/Peach/Bone theme with more depth
    const themes = {
        heart: {
            bg: 'bg-gradient-to-br from-rose-50 via-peach-50 to-white',
            border: 'border-rose-100',
            iconBg: 'bg-white text-rose-500 shadow-rose-100',
            valueColor: 'text-rose-900',
            unitColor: 'text-rose-400',
            labelColor: 'text-rose-600',
            statusColor: 'bg-rose-100/50 text-rose-600',
            Icon: Heart,
            Watermark: Activity
        },
        sleep: {
            bg: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-white', 
            border: 'border-indigo-100',
            iconBg: 'bg-white text-indigo-500 shadow-indigo-100',
            valueColor: 'text-indigo-900',
            unitColor: 'text-indigo-400',
            labelColor: 'text-indigo-600',
            statusColor: 'bg-indigo-100/50 text-indigo-600',
            Icon: Moon,
            Watermark: Brain
        },
        steps: {
            bg: 'bg-gradient-to-br from-emerald-50 via-sage-50 to-white',
            border: 'border-emerald-100',
            iconBg: 'bg-white text-emerald-500 shadow-emerald-100',
            valueColor: 'text-emerald-900',
            unitColor: 'text-emerald-400',
            labelColor: 'text-emerald-600',
            statusColor: 'bg-emerald-100/50 text-emerald-600',
            Icon: Footprints,
            Watermark: Flame
        }
    };

    const theme = themes[type] || themes.heart;
    const Icon = theme.Icon;
    const Watermark = theme.Watermark;

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`card-premium relative overflow-hidden flex flex-col justify-between 
            ${theme.bg} ${theme.border} border shadow-soft hover:shadow-lg transition-all duration-300 min-h-[180px] p-5 cursor-pointer rounded-[24px]`}
        >
            {/* Watermark Icon - Large and faded in background */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.07] transform rotate-12 pointer-events-none">
                <Watermark size={140} strokeWidth={1.5} />
            </div>

            <div className="flex justify-between items-start z-10">
                <div className={`p-3 rounded-2xl ${theme.iconBg} shadow-sm backdrop-blur-sm`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
                {status && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${theme.statusColor}`}>
                        {status}
                    </span>
                )}
            </div>

            <div className="mt-8 z-10">
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-display font-bold ${theme.valueColor} tracking-tight`}>
                        {value || '--'}
                    </span>
                    <span className={`text-sm font-bold ${theme.unitColor} mb-1.5`}>
                        {unit}
                    </span>
                </div>
                <p className={`text-xs font-bold ${theme.labelColor} mt-1 uppercase tracking-wider opacity-80`}>
                    {label}
                </p>
            </div>
        </motion.div>
    );
};

export default VitalsCard;
