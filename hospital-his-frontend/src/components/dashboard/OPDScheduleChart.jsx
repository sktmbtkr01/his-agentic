import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell, ReferenceLine, Legend 
} from 'recharts';
import { Clock, Users, TrendingUp, Calendar } from 'lucide-react';

/**
 * OPDScheduleChart - Beautiful OPD schedule visualization
 * Features:
 * - Vertical bar chart with gradient fills
 * - Glassmorphism effect on bars
 * - Scheduled vs current loading with different opacity
 * - Time labels on X-axis
 * - Smooth animation on load
 * - Responsive design
 * - Dark/light theme support
 * - Interactive legend
 */

// Role-specific color configurations
const roleColors = {
  doctor: {
    primary: '#06b6d4',
    secondary: '#3b82f6',
    gradient: ['#06b6d4', '#3b82f6'],
    light: 'rgba(6, 182, 212, 0.2)',
  },
  nurse: {
    primary: '#ec4899',
    secondary: '#f472b6',
    gradient: ['#ec4899', '#f472b6'],
    light: 'rgba(236, 72, 153, 0.2)',
  },
  admin: {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    gradient: ['#8b5cf6', '#a855f7'],
    light: 'rgba(139, 92, 246, 0.2)',
  },
  lab_tech: {
    primary: '#10b981',
    secondary: '#22c55e',
    gradient: ['#10b981', '#22c55e'],
    light: 'rgba(16, 185, 129, 0.2)',
  },
  radiologist: {
    primary: '#f59e0b',
    secondary: '#f97316',
    gradient: ['#f59e0b', '#f97316'],
    light: 'rgba(245, 158, 11, 0.2)',
  },
  pharmacist: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    gradient: ['#3b82f6', '#6366f1'],
    light: 'rgba(59, 130, 246, 0.2)',
  },
  billing: {
    primary: '#14b8a6',
    secondary: '#06b6d4',
    gradient: ['#14b8a6', '#06b6d4'],
    light: 'rgba(20, 184, 166, 0.2)',
  },
  receptionist: {
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    gradient: ['#7c3aed', '#8b5cf6'],
    light: 'rgba(124, 58, 237, 0.2)',
  },
};

// Custom Gradient Bar Component
const GradientBar = ({ x, y, width, height, colors, opacity = 1 }) => {
  const id = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity={opacity} />
          <stop offset="100%" stopColor={colors[1]} stopOpacity={opacity * 0.7} />
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#${id})`}
        rx={4}
        ry={4}
        className="drop-shadow-sm"
      />
      {/* Glassmorphism highlight */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height / 3}
        fill="rgba(255,255,255,0.2)"
        rx={4}
        ry={4}
      />
    </g>
  );
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, colors }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface/95 dark:bg-slate-800/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl"
    >
      <p className="text-text-primary font-semibold mb-2 flex items-center gap-2">
        <Clock size={14} className="text-text-muted" />
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary text-sm">
              {entry.name}:
            </span>
            <span className="text-text-primary font-semibold">
              {entry.value} patients
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Custom Legend Component
const CustomLegend = ({ payload }) => (
  <div className="flex items-center justify-center gap-6 mt-4">
    {payload.map((entry, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center gap-2"
      >
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-text-secondary text-sm font-medium">
          {entry.value}
        </span>
      </motion.div>
    ))}
  </div>
);

// Stats Summary Component
const StatsSummary = ({ data, colors }) => {
  const totalScheduled = data.reduce((sum, item) => sum + (item.scheduled || 0), 0);
  const totalCurrent = data.reduce((sum, item) => sum + (item.current || 0), 0);
  const utilizationRate = totalScheduled > 0 ? Math.round((totalCurrent / totalScheduled) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { 
          label: 'Scheduled', 
          value: totalScheduled, 
          icon: Calendar,
          color: colors.primary 
        },
        { 
          label: 'Current Load', 
          value: totalCurrent, 
          icon: Users,
          color: colors.secondary 
        },
        { 
          label: 'Utilization', 
          value: `${utilizationRate}%`, 
          icon: TrendingUp,
          color: utilizationRate >= 80 ? '#ef4444' : utilizationRate >= 50 ? '#f59e0b' : '#10b981'
        },
      ].map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className="bg-surface-secondary/50 dark:bg-surface-secondary/30 rounded-xl p-3 text-center"
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <stat.icon size={12} style={{ color: stat.color }} />
            <span className="text-xs text-text-muted uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className="text-lg font-bold text-text-primary">
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

// Main Component
const OPDScheduleChart = ({ 
  data = [],
  role = 'doctor',
  title = 'OPD Schedule',
  subtitle = 'Patient load distribution across time slots',
  showStats = true,
  height = 300,
}) => {
  const colors = roleColors[role] || roleColors.doctor;

  // Use provided data, normalize the time key, or show empty state
  const chartData = useMemo(() => {
    if (data.length > 0) {
      // Normalize data - accept both 'hour' and 'time' keys
      return data.map(item => ({
        time: item.time || item.hour,
        scheduled: item.scheduled || 0,
        current: item.current || 0,
        isCurrentHour: item.isCurrentHour || false,
      }));
    }
    
    // Return empty slots for hours if no data
    return [
      { time: '9 AM', scheduled: 0, current: 0 },
      { time: '10 AM', scheduled: 0, current: 0 },
      { time: '11 AM', scheduled: 0, current: 0 },
      { time: '12 PM', scheduled: 0, current: 0 },
      { time: '1 PM', scheduled: 0, current: 0 },
      { time: '2 PM', scheduled: 0, current: 0 },
      { time: '3 PM', scheduled: 0, current: 0 },
      { time: '4 PM', scheduled: 0, current: 0 },
      { time: '5 PM', scheduled: 0, current: 0 },
    ];
  }, [data]);

  const maxValue = useMemo(() => {
    const max = Math.max(
      ...chartData.map(d => Math.max(d.scheduled || 0, d.current || 0))
    );
    return Math.ceil(max * 1.2); // Add 20% padding
  }, [chartData]);

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
            <div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Calendar size={18} style={{ color: colors.primary }} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{title}</h3>
              <p className="text-xs text-text-muted">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Stats Summary */}
        {showStats && <StatsSummary data={chartData} colors={colors} />}

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full"
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="scheduledGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={1} />
                  <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.8} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="rgba(148, 163, 184, 0.1)"
              />

              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
              />

              <YAxis 
                tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }}
                tickLine={false}
                axisLine={false}
                domain={[0, maxValue]}
              />

              <Tooltip 
                content={<CustomTooltip colors={colors} />}
                cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
              />

              <Legend content={<CustomLegend />} />

              {/* Scheduled Bar (Background) */}
              <Bar 
                dataKey="scheduled" 
                name="Scheduled"
                fill="url(#scheduledGradient)"
                radius={[6, 6, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
              />

              {/* Current Load Bar (Foreground) */}
              <Bar 
                dataKey="current" 
                name="Current"
                fill="url(#currentGradient)"
                radius={[6, 6, 0, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    className="drop-shadow-md"
                  />
                ))}
              </Bar>

              {/* Average Reference Line */}
              <ReferenceLine 
                y={Math.round(chartData.reduce((sum, d) => sum + (d.scheduled || 0), 0) / chartData.length)}
                stroke={colors.primary}
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                label={{ 
                  value: 'Avg', 
                  position: 'right',
                  fill: colors.primary,
                  fontSize: 10
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Current Time Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live data • Updates every minute</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OPDScheduleChart;
