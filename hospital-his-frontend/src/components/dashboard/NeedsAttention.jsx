import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, AlertCircle, Bell, ChevronRight, 
  Clock, User, FileText, Beaker, Activity,
  CheckCircle2, XCircle, Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * NeedsAttention - A beautiful alert list with priority-based styling
 * Features:
 * - Card-based layout with colored left border
 * - Priority badges (IMPORTANT, URGENT, CRITICAL)
 * - Patient name, test type, and timestamp
 * - Take Action button with role-specific gradient
 * - Hover effects with elevation
 * - Empty state illustration
 * - Staggered entrance animations
 * - Dark/light theme support
 */

// Priority configuration
const priorityConfig = {
  critical: {
    label: 'CRITICAL',
    icon: XCircle,
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    badgeBg: 'bg-red-500',
    badgeText: 'text-white',
    iconColor: 'text-red-500',
    hoverBg: 'hover:bg-red-50/80 dark:hover:bg-red-950/40',
    pulse: true,
  },
  urgent: {
    label: 'URGENT',
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    iconColor: 'text-amber-500',
    hoverBg: 'hover:bg-amber-50/80 dark:hover:bg-amber-950/40',
    pulse: false,
  },
  important: {
    label: 'IMPORTANT',
    icon: AlertCircle,
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
    iconColor: 'text-blue-500',
    hoverBg: 'hover:bg-blue-50/80 dark:hover:bg-blue-950/40',
    pulse: false,
  },
  normal: {
    label: 'INFO',
    icon: Bell,
    borderColor: 'border-l-slate-400 dark:border-l-slate-500',
    bgColor: 'bg-slate-50 dark:bg-slate-800/50',
    badgeBg: 'bg-slate-500',
    badgeText: 'text-white',
    iconColor: 'text-slate-500',
    hoverBg: 'hover:bg-slate-100 dark:hover:bg-slate-700/50',
    pulse: false,
  },
};

// Role-specific button gradients
const roleGradients = {
  doctor: 'from-cyan-500 to-blue-600',
  nurse: 'from-pink-500 to-rose-600',
  admin: 'from-violet-500 to-purple-600',
  lab_tech: 'from-emerald-500 to-green-600',
  radiologist: 'from-amber-500 to-orange-600',
  pharmacist: 'from-blue-500 to-indigo-600',
  billing: 'from-teal-500 to-cyan-600',
  receptionist: 'from-purple-500 to-violet-600',
  head_nurse: 'from-rose-500 to-pink-600',
};

// Alert type icons
const alertTypeIcons = {
  lab: Beaker,
  vitals: Activity,
  document: FileText,
  patient: User,
  default: Bell,
};

// Single Alert Card Component
const AlertCard = ({ alert, index, role, onAction }) => {
  const priority = priorityConfig[alert.priority] || priorityConfig.normal;
  const PriorityIcon = priority.icon;
  const TypeIcon = alertTypeIcons[alert.type] || alertTypeIcons.default;
  const buttonGradient = roleGradients[role] || roleGradients.doctor;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ 
        y: -4, 
        boxShadow: '0 12px 40px -12px rgba(0,0,0,0.15)',
        transition: { duration: 0.2 }
      }}
      className={`
        relative overflow-hidden rounded-xl
        bg-surface border border-border
        border-l-4 ${priority.borderColor}
        ${priority.hoverBg}
        transition-all duration-300
        group cursor-pointer
      `}
      onClick={() => onAction?.(alert)}
    >
      {/* Critical Pulse Indicator */}
      {priority.pulse && (
        <div className="absolute top-3 right-3">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      <div className="p-4 lg:p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`
            flex-shrink-0 p-2.5 rounded-xl
            ${priority.bgColor}
            group-hover:scale-110 transition-transform duration-300
          `}>
            <TypeIcon size={20} className={priority.iconColor} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Priority Badge */}
              <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                text-[10px] font-bold uppercase tracking-wider
                ${priority.badgeBg} ${priority.badgeText}
              `}>
                <PriorityIcon size={10} />
                {priority.label}
              </span>

              {/* Timestamp */}
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock size={10} />
                {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
              </span>
            </div>

            {/* Patient Name */}
            <h4 className="font-semibold text-text-primary text-sm lg:text-base mb-1 truncate">
              {alert.patientName}
            </h4>

            {/* Alert Message */}
            <p className="text-text-secondary text-sm line-clamp-2 mb-3">
              {alert.message}
            </p>

            {/* Footer Row */}
            <div className="flex items-center justify-between">
              {/* Test/Alert Type */}
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <TypeIcon size={12} />
                <span>{alert.alertType || 'General Alert'}</span>
              </div>

              {/* Take Action Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.(alert);
                }}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5
                  bg-gradient-to-r ${buttonGradient}
                  text-white text-xs font-semibold
                  rounded-lg shadow-md
                  hover:shadow-lg transition-all duration-300
                  opacity-0 group-hover:opacity-100
                  translate-x-2 group-hover:translate-x-0
                `}
              >
                <Zap size={12} />
                Take Action
                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Gradient Overlay */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100
        bg-gradient-to-r from-transparent via-transparent to-${priority.iconColor.split('-')[1]}-500/5
        pointer-events-none transition-opacity duration-300
      `} />
    </motion.div>
  );
};

// Empty State Component
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 px-6 text-center"
  >
    {/* Illustration */}
    <div className="relative mb-6">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-full flex items-center justify-center"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </motion.div>
      
      {/* Floating particles */}
      <motion.div
        animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400/30 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -10, 0], x: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-1 -left-3 w-3 h-3 bg-cyan-400/30 rounded-full"
      />
    </div>

    <h3 className="text-lg font-semibold text-text-primary mb-2">
      All Caught Up! 🎉
    </h3>
    <p className="text-text-muted text-sm max-w-xs">
      No items need your attention right now. Take a moment to breathe.
    </p>
  </motion.div>
);

// Main Component
const NeedsAttention = ({ 
  alerts = [], 
  role = 'doctor',
  title = 'Needs Your Attention',
  onAction,
  maxItems = 5,
  showViewAll = true,
  onViewAll
}) => {
  const displayAlerts = alerts.slice(0, maxItems);
  const hasMore = alerts.length > maxItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-surface border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 dark:bg-red-500/20">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted">
              {alerts.length} item{alerts.length !== 1 ? 's' : ''} requiring attention
            </p>
          </div>
        </div>

        {/* Alert Count Badge */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {alerts.length}
            </span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {displayAlerts.length > 0 ? (
            displayAlerts.map((alert, index) => (
              <AlertCard
                key={alert.id || index}
                alert={alert}
                index={index}
                role={role}
                onAction={onAction}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>

      {/* Footer - View All */}
      {showViewAll && hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-5 py-3 border-t border-border bg-surface-secondary/30"
        >
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-role hover:text-role-hover transition-colors"
          >
            View All {alerts.length} Alerts
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NeedsAttention;
