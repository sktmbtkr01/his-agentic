import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight, Minus } from 'lucide-react';

/**
 * Animated CountUp Component
 * Smoothly animates number from 0 to target value
 */
const CountUp = ({ value, duration = 1000, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);
    const previousValue = useRef(0);

    useEffect(() => {
        const startValue = previousValue.current;
        let startTime = null;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // Ease out cubic for smooth deceleration
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            const currentValue = Math.floor(startValue + (value - startValue) * easeOut);
            
            setCount(currentValue);

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                setCount(value);
                previousValue.current = value;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
};

/**
 * Stat Card Gradient Configurations
 * Each type has a unique gradient for visual differentiation
 */
const CARD_VARIANTS = {
    appointments: {
        gradient: 'from-cyan-500 to-blue-600',
        iconBg: 'bg-cyan-500/15 dark:bg-cyan-400/20',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        shadowColor: 'shadow-cyan-500/25',
        borderAccent: 'border-l-cyan-500',
        glowColor: 'hover:shadow-cyan-500/30',
    },
    patients: {
        gradient: 'from-violet-500 to-purple-600',
        iconBg: 'bg-violet-500/15 dark:bg-violet-400/20',
        iconColor: 'text-violet-600 dark:text-violet-400',
        shadowColor: 'shadow-violet-500/25',
        borderAccent: 'border-l-violet-500',
        glowColor: 'hover:shadow-violet-500/30',
    },
    lab: {
        gradient: 'from-emerald-500 to-green-600',
        iconBg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        shadowColor: 'shadow-emerald-500/25',
        borderAccent: 'border-l-emerald-500',
        glowColor: 'hover:shadow-emerald-500/30',
    },
    critical: {
        gradient: 'from-red-500 to-rose-600',
        iconBg: 'bg-red-500/15 dark:bg-red-400/20',
        iconColor: 'text-red-600 dark:text-red-400',
        shadowColor: 'shadow-red-500/25',
        borderAccent: 'border-l-red-500',
        glowColor: 'hover:shadow-red-500/30',
    },
    revenue: {
        gradient: 'from-amber-500 to-orange-600',
        iconBg: 'bg-amber-500/15 dark:bg-amber-400/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
        shadowColor: 'shadow-amber-500/25',
        borderAccent: 'border-l-amber-500',
        glowColor: 'hover:shadow-amber-500/30',
    },
    pending: {
        gradient: 'from-blue-500 to-indigo-600',
        iconBg: 'bg-blue-500/15 dark:bg-blue-400/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        shadowColor: 'shadow-blue-500/25',
        borderAccent: 'border-l-blue-500',
        glowColor: 'hover:shadow-blue-500/30',
    },
    success: {
        gradient: 'from-teal-500 to-cyan-600',
        iconBg: 'bg-teal-500/15 dark:bg-teal-400/20',
        iconColor: 'text-teal-600 dark:text-teal-400',
        shadowColor: 'shadow-teal-500/25',
        borderAccent: 'border-l-teal-500',
        glowColor: 'hover:shadow-teal-500/30',
    },
    default: {
        gradient: 'from-slate-500 to-slate-600',
        iconBg: 'bg-slate-500/15 dark:bg-slate-400/20',
        iconColor: 'text-slate-600 dark:text-slate-400',
        shadowColor: 'shadow-slate-500/25',
        borderAccent: 'border-l-slate-500',
        glowColor: 'hover:shadow-slate-500/30',
    },
};

/**
 * Trend Indicator Component
 */
const TrendIndicator = ({ trend, trendValue }) => {
    if (!trend || trend === 'neutral') {
        return (
            <span className="flex items-center text-text-muted text-xs font-medium">
                <Minus size={14} className="mr-1" />
                <span>No change</span>
            </span>
        );
    }

    const isUp = trend === 'up';
    const colorClass = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
    const Icon = isUp ? TrendingUp : TrendingDown;

    return (
        <span className={`flex items-center text-xs font-semibold ${colorClass}`}>
            <Icon size={14} className="mr-1" />
            <span>{trendValue}</span>
        </span>
    );
};

/**
 * Premium Stat Card Component
 * 
 * @param {string} title - Card title
 * @param {number} value - Main numeric value
 * @param {string} subtext - Description below the value
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} variant - Card color variant (appointments, patients, lab, critical, revenue, pending)
 * @param {string} trend - Trend direction (up, down, neutral)
 * @param {string} trendValue - Trend value text (e.g., "+12%")
 * @param {Function} onClick - Click handler
 * @param {boolean} isLoading - Loading state
 * @param {boolean} highlight - Show pulse indicator
 * @param {number} delay - Animation delay
 * @param {string} prefix - Value prefix (e.g., "₹")
 * @param {string} suffix - Value suffix (e.g., "%")
 */
const StatCard = ({
    title,
    value = 0,
    subtext,
    icon: Icon,
    variant = 'default',
    trend,
    trendValue,
    onClick,
    isLoading = false,
    highlight = false,
    delay = 0,
    prefix = '',
    suffix = '',
    className = '',
}) => {
    const config = CARD_VARIANTS[variant] || CARD_VARIANTS.default;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
                delay, 
                duration: 0.4,
                type: 'spring',
                stiffness: 100,
            }}
            whileHover={{ 
                y: -6, 
                scale: 1.02,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative overflow-hidden
                bg-surface border border-border rounded-2xl
                p-6 
                shadow-theme-md ${config.shadowColor} ${config.glowColor}
                transition-all duration-300 ease-out
                group
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
        >
            {/* Gradient Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

            {/* Highlight Pulse Indicator */}
            {highlight && (
                <div className="absolute top-4 right-4 z-10">
                    <span className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r ${config.gradient} opacity-75`} />
                        <span className={`relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r ${config.gradient}`} />
                    </span>
                </div>
            )}

            {/* Main Content */}
            <div className="relative z-10">
                {/* Icon */}
                <div className={`
                    w-14 h-14 rounded-2xl mb-4
                    ${config.iconBg}
                    flex items-center justify-center
                    shadow-sm
                    group-hover:scale-110 group-hover:rotate-3
                    transition-transform duration-300
                `}>
                    {Icon && <Icon size={28} className={config.iconColor} strokeWidth={1.5} />}
                </div>

                {/* Title */}
                <p className="text-text-secondary text-xs font-bold tracking-wider uppercase mb-2">
                    {title}
                </p>

                {/* Value */}
                <div className="mb-3">
                    {isLoading ? (
                        <div className="h-10 w-24 bg-surface-highlight animate-pulse rounded-lg" />
                    ) : (
                        <h3 className="text-4xl font-extrabold text-text-primary tracking-tight font-display">
                            <CountUp value={value} prefix={prefix} suffix={suffix} />
                        </h3>
                    )}
                </div>

                {/* Subtext & Trend */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {(trend || trendValue) && (
                            <TrendIndicator trend={trend} trendValue={trendValue} />
                        )}
                        {subtext && (
                            <span className="text-text-muted text-xs">
                                {subtext}
                            </span>
                        )}
                    </div>

                    {onClick && (
                        <ChevronRight 
                            size={16} 
                            className="text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" 
                        />
                    )}
                </div>
            </div>

            {/* Background Decorative Icon */}
            {Icon && (
                <div className="absolute -bottom-6 -right-6 pointer-events-none">
                    <Icon 
                        size={120} 
                        className={`
                            ${config.iconColor} opacity-[0.04] dark:opacity-[0.06]
                            group-hover:scale-110 group-hover:-rotate-12
                            transition-all duration-500
                        `}
                        strokeWidth={0.5}
                    />
                </div>
            )}

            {/* Subtle Gradient Overlay on Hover */}
            <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-br ${config.gradient}
                mix-blend-soft-light
                transition-opacity duration-300
                pointer-events-none
                rounded-2xl
            `} style={{ opacity: 0.03 }} />
        </motion.div>
    );
};

/**
 * Stat Cards Grid Component
 * Responsive grid layout for multiple stat cards
 */
export const StatCardsGrid = ({ children, className = '' }) => (
    <div className={`
        grid gap-4 md:gap-6
        grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
        ${className}
    `}>
        {children}
    </div>
);

export default StatCard;
