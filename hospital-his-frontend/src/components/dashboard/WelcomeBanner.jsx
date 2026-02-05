import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { format } from 'date-fns';

/**
 * WelcomeBanner - A premium welcome banner with time-based greeting
 * Features:
 * - Dynamic greeting based on time of day
 * - Role-specific gradient text
 * - Subtle animated background pattern
 * - Refresh button with role-colored gradient
 * - Dark/light mode support
 * - Responsive design
 */
const WelcomeBanner = ({ 
  userName = 'Doctor', 
  role = 'doctor',
  onRefresh,
  isRefreshing = false,
  lastUpdated = new Date(),
  subtitle = "Here's what's happening in your department today"
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get time-based greeting
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', icon: Sunrise, emoji: '☀️' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', icon: Sun, emoji: '🌤️' };
    } else if (hour >= 17 && hour < 21) {
      return { text: 'Good Evening', icon: Sunset, emoji: '🌅' };
    } else {
      return { text: 'Good Night', icon: Moon, emoji: '🌙' };
    }
  }, [currentTime]);

  // Role-specific gradient configurations
  const roleGradients = {
    doctor: {
      text: 'from-cyan-500 via-blue-500 to-indigo-500',
      button: 'from-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/25',
      pattern: 'from-cyan-500/5 to-blue-500/5',
      border: 'border-cyan-500/20',
    },
    nurse: {
      text: 'from-pink-500 via-rose-500 to-red-400',
      button: 'from-pink-500 to-rose-600',
      glow: 'shadow-pink-500/25',
      pattern: 'from-pink-500/5 to-rose-500/5',
      border: 'border-pink-500/20',
    },
    admin: {
      text: 'from-violet-500 via-purple-500 to-fuchsia-500',
      button: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/25',
      pattern: 'from-violet-500/5 to-purple-500/5',
      border: 'border-violet-500/20',
    },
    lab_tech: {
      text: 'from-emerald-500 via-green-500 to-teal-500',
      button: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/25',
      pattern: 'from-emerald-500/5 to-green-500/5',
      border: 'border-emerald-500/20',
    },
    radiologist: {
      text: 'from-amber-500 via-orange-500 to-yellow-500',
      button: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/25',
      pattern: 'from-amber-500/5 to-orange-500/5',
      border: 'border-amber-500/20',
    },
    pharmacist: {
      text: 'from-blue-500 via-indigo-500 to-violet-500',
      button: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/25',
      pattern: 'from-blue-500/5 to-indigo-500/5',
      border: 'border-blue-500/20',
    },
    billing: {
      text: 'from-teal-500 via-cyan-500 to-blue-500',
      button: 'from-teal-500 to-cyan-600',
      glow: 'shadow-teal-500/25',
      pattern: 'from-teal-500/5 to-cyan-500/5',
      border: 'border-teal-500/20',
    },
    receptionist: {
      text: 'from-purple-500 via-violet-500 to-indigo-500',
      button: 'from-purple-500 to-violet-600',
      glow: 'shadow-purple-500/25',
      pattern: 'from-purple-500/5 to-violet-500/5',
      border: 'border-purple-500/20',
    },
    head_nurse: {
      text: 'from-rose-500 via-pink-500 to-fuchsia-500',
      button: 'from-rose-500 to-pink-600',
      glow: 'shadow-rose-500/25',
      pattern: 'from-rose-500/5 to-pink-500/5',
      border: 'border-rose-500/20',
    },
  };

  const gradient = roleGradients[role] || roleGradients.doctor;
  const GreetingIcon = greeting.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden rounded-2xl lg:rounded-3xl
        bg-surface border ${gradient.border}
        dark:bg-surface/80 backdrop-blur-sm
        p-6 lg:p-8
      `}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Mesh Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient.pattern} opacity-50`} />
        
        {/* Animated Circles */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${gradient.text}`}
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.02, 0.05, 0.02]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className={`absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr ${gradient.text}`}
        />

        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Greeting */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2 mb-2"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl"
            >
              {greeting.emoji}
            </motion.span>
            <span className="text-text-secondary text-sm font-medium tracking-wide uppercase">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-1"
          >
            {greeting.text},{' '}
            <span className={`bg-gradient-to-r ${gradient.text} bg-clip-text text-transparent`}>
              {userName}
            </span>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block ml-2"
            >
              <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-amber-400 inline" />
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-text-muted text-sm lg:text-base"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Right: Actions & Time */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          {/* Last Updated */}
          <div className="text-xs text-text-muted flex items-center gap-1.5 bg-surface-secondary/50 dark:bg-surface-secondary/30 px-3 py-2 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated {format(lastUpdated, 'h:mm a')}</span>
          </div>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`
              relative group flex items-center gap-2 px-4 py-2.5
              bg-gradient-to-r ${gradient.button}
              text-white font-semibold text-sm
              rounded-xl shadow-lg ${gradient.glow}
              hover:shadow-xl transition-all duration-300
              disabled:opacity-70 disabled:cursor-not-allowed
            `}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${gradient.button} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`} />
            
            <RefreshCw 
              size={16} 
              className={`relative z-10 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
            />
            <span className="relative z-10">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Accent Line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient.text} origin-left`}
      />
    </motion.div>
  );
};

export default WelcomeBanner;
