import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, Heart, Shield, Beaker, Radio, 
  Pill, Receipt, UserCheck, Palette, Sparkles,
  Check, Info
} from 'lucide-react';

/**
 * RoleThemeSwitcher - Interactive demo to preview different role themes
 * Features:
 * - Horizontal button group for each role
 * - Instant color change across dashboard
 * - Active button with gradient background
 * - Smooth color transitions
 * - Visual feedback showing active theme
 * - Explanatory text about personalization
 */

// Role configurations
const roles = [
  { 
    id: 'doctor', 
    name: 'Doctor', 
    icon: Stethoscope,
    gradient: 'from-cyan-500 to-blue-600',
    color: '#06b6d4',
    description: 'Clinical workflow optimized'
  },
  { 
    id: 'nurse', 
    name: 'Nurse', 
    icon: Heart,
    gradient: 'from-pink-500 to-rose-600',
    color: '#ec4899',
    description: 'Patient care focused'
  },
  { 
    id: 'admin', 
    name: 'Admin', 
    icon: Shield,
    gradient: 'from-violet-500 to-purple-600',
    color: '#8b5cf6',
    description: 'Management dashboard'
  },
  { 
    id: 'lab_tech', 
    name: 'Lab Tech', 
    icon: Beaker,
    gradient: 'from-emerald-500 to-green-600',
    color: '#10b981',
    description: 'Laboratory workflow'
  },
  { 
    id: 'radiologist', 
    name: 'Radiologist', 
    icon: Radio,
    gradient: 'from-amber-500 to-orange-600',
    color: '#f59e0b',
    description: 'Imaging specialized'
  },
  { 
    id: 'pharmacist', 
    name: 'Pharmacist', 
    icon: Pill,
    gradient: 'from-blue-500 to-indigo-600',
    color: '#3b82f6',
    description: 'Medication management'
  },
  { 
    id: 'billing', 
    name: 'Billing', 
    icon: Receipt,
    gradient: 'from-teal-500 to-cyan-600',
    color: '#14b8a6',
    description: 'Financial operations'
  },
  { 
    id: 'receptionist', 
    name: 'Reception', 
    icon: UserCheck,
    gradient: 'from-purple-500 to-violet-600',
    color: '#7c3aed',
    description: 'Front desk operations'
  },
];

// Single Role Button Component
const RoleButton = ({ role, isActive, onClick, index }) => {
  const Icon = role.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(role.id)}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl
        transition-all duration-300 min-w-[100px]
        ${isActive 
          ? `bg-gradient-to-br ${role.gradient} text-white shadow-lg` 
          : 'bg-surface-secondary/50 dark:bg-surface-secondary/30 text-text-secondary hover:bg-surface-secondary dark:hover:bg-surface-secondary/50'
        }
      `}
      style={{
        boxShadow: isActive ? `0 8px 30px ${role.color}40` : 'none'
      }}
    >
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
        >
          <Check size={12} className="text-emerald-500" />
        </motion.div>
      )}

      {/* Icon */}
      <div className={`
        p-2.5 rounded-lg transition-all duration-300
        ${isActive 
          ? 'bg-white/20' 
          : 'bg-surface-highlight dark:bg-surface-secondary'
        }
      `}>
        <Icon 
          size={20} 
          className={isActive ? 'text-white' : ''}
          style={{ color: isActive ? 'white' : role.color }}
        />
      </div>

      {/* Label */}
      <span className={`
        text-xs font-semibold transition-colors duration-300
        ${isActive ? 'text-white' : 'text-text-primary'}
      `}>
        {role.name}
      </span>
    </motion.button>
  );
};

// Color Preview Component
const ColorPreview = ({ role }) => {
  const activeRole = roles.find(r => r.id === role) || roles[0];

  return (
    <motion.div
      key={role}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4"
    >
      {/* Color Swatches */}
      <div className="flex gap-2">
        <motion.div
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeRole.gradient} shadow-lg`}
          style={{ boxShadow: `0 4px 20px ${activeRole.color}50` }}
        />
        <div 
          className="w-8 h-8 rounded-lg opacity-50"
          style={{ backgroundColor: activeRole.color }}
        />
        <div 
          className="w-8 h-8 rounded-lg opacity-25"
          style={{ backgroundColor: activeRole.color }}
        />
      </div>

      {/* Role Info */}
      <div>
        <p className={`font-semibold text-lg bg-gradient-to-r ${activeRole.gradient} bg-clip-text text-transparent`}>
          {activeRole.name} Theme
        </p>
        <p className="text-xs text-text-muted">{activeRole.description}</p>
      </div>
    </motion.div>
  );
};

// Main Component
const RoleThemeSwitcher = ({ 
  currentRole = 'doctor',
  onRoleChange,
  showPreview = true,
  title = 'Theme Personalization',
  subtitle = 'Preview different stakeholder color themes'
}) => {
  const [activeRole, setActiveRole] = useState(currentRole);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setActiveRole(currentRole);
  }, [currentRole]);

  const handleRoleChange = (roleId) => {
    if (roleId === activeRole) return;
    
    setIsTransitioning(true);
    setActiveRole(roleId);
    
    // Update document data attribute for CSS variables
    document.documentElement.setAttribute('data-role', roleId);
    
    // Callback
    onRoleChange?.(roleId);
    
    // Reset transition state
    setTimeout(() => setIsTransitioning(false), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-surface border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <Palette size={18} className="text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                {title}
                <Sparkles size={14} className="text-amber-400" />
              </h3>
              <p className="text-xs text-text-muted">{subtitle}</p>
            </div>
          </div>

          {/* Active Theme Badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`
                px-3 py-1.5 rounded-full text-xs font-semibold
                bg-gradient-to-r ${roles.find(r => r.id === activeRole)?.gradient}
                text-white shadow-md
              `}
            >
              Active: {roles.find(r => r.id === activeRole)?.name}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Role Buttons */}
      <div className="p-5">
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {roles.map((role, index) => (
            <RoleButton
              key={role.id}
              role={role}
              isActive={activeRole === role.id}
              onClick={handleRoleChange}
              index={index}
            />
          ))}
        </div>

        {/* Color Preview */}
        {showPreview && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <ColorPreview role={activeRole} />
              
              {/* Transition Indicator */}
              {isTransitioning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-text-muted"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Applying theme...
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 bg-surface-secondary/50 dark:bg-surface-secondary/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <Info size={14} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Multi-Stakeholder Themes:</strong>{' '}
                Each role in the hospital gets a personalized color scheme that reflects their 
                workflow and responsibilities. Colors are carefully chosen for accessibility 
                and to reduce eye strain during long shifts.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoleThemeSwitcher;
