import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  WelcomeBanner, 
  NeedsAttention, 
  OPDScheduleChart, 
  RoleThemeSwitcher 
} from '../../components/dashboard';

/**
 * DashboardDemo - Showcases all Phase 2 dashboard components
 * This page demonstrates the premium dashboard experience with:
 * - Welcome Banner with time-based greeting
 * - Needs Attention alerts section
 * - OPD Schedule visualization
 * - Role Theme Switcher demo
 */

// Sample alerts data
const sampleAlerts = [
  {
    id: '1',
    priority: 'critical',
    type: 'lab',
    patientName: 'John Smith',
    message: 'Critical lab results require immediate review. Potassium levels dangerously high.',
    alertType: 'Lab Result - Critical',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
  },
  {
    id: '2',
    priority: 'urgent',
    type: 'vitals',
    patientName: 'Sarah Johnson',
    message: 'Blood pressure readings consistently elevated. Requires medication adjustment.',
    alertType: 'Vital Signs Alert',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
  },
  {
    id: '3',
    priority: 'important',
    type: 'document',
    patientName: 'Michael Brown',
    message: 'Pending prescription approval for controlled substance. Patient waiting.',
    alertType: 'Prescription Approval',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
  },
  {
    id: '4',
    priority: 'urgent',
    type: 'patient',
    patientName: 'Emily Davis',
    message: 'Post-operative check overdue. Last vitals recorded 4 hours ago.',
    alertType: 'Post-Op Care',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
  },
  {
    id: '5',
    priority: 'normal',
    type: 'lab',
    patientName: 'Robert Wilson',
    message: 'Routine lab results available for review. All values within normal range.',
    alertType: 'Lab Result - Normal',
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
];

// Sample OPD schedule data
const sampleOPDData = [
  { time: '8 AM', scheduled: 12, current: 10 },
  { time: '9 AM', scheduled: 18, current: 16 },
  { time: '10 AM', scheduled: 24, current: 22 },
  { time: '11 AM', scheduled: 20, current: 18 },
  { time: '12 PM', scheduled: 15, current: 14 },
  { time: '1 PM', scheduled: 8, current: 6 },
  { time: '2 PM', scheduled: 16, current: 15 },
  { time: '3 PM', scheduled: 22, current: 19 },
  { time: '4 PM', scheduled: 18, current: 17 },
  { time: '5 PM', scheduled: 10, current: 8 },
];

const DashboardDemo = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentRole, setCurrentRole] = useState(user?.role || 'doctor');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [alerts, setAlerts] = useState(sampleAlerts);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1500);
  }, []);

  // Handle alert action
  const handleAlertAction = useCallback((alert) => {
    console.log('Taking action on alert:', alert);
    // Remove the alert from the list (simulating action taken)
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
  }, []);

  // Handle role change from theme switcher
  const handleRoleChange = useCallback((roleId) => {
    setCurrentRole(roleId);
    // This would typically update the app's theme context
    console.log('Theme changed to:', roleId);
  }, []);

  // Get user display name
  const userName = user?.profile?.firstName 
    ? `Dr. ${user.profile.firstName}`
    : 'Doctor';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner
          userName={userName}
          role={currentRole}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Needs Attention Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <NeedsAttention
              alerts={alerts}
              role={currentRole}
              onAction={handleAlertAction}
              onViewAll={() => console.log('View all alerts')}
            />
          </motion.div>

          {/* OPD Schedule Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <OPDScheduleChart
              data={sampleOPDData}
              role={currentRole}
              title="Today's OPD Schedule"
              subtitle="Patient load distribution across time slots"
            />
          </motion.div>
        </div>

        {/* Role Theme Switcher Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RoleThemeSwitcher
            currentRole={currentRole}
            onRoleChange={handleRoleChange}
            title="🎨 Multi-Stakeholder Theme Demo"
            subtitle="Click on any role to preview their personalized dashboard theme"
          />
        </motion.div>

        {/* Demo Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/5 dark:to-purple-500/5 border border-violet-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            ✨ Phase 2: Dashboard Components Demo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
            <div>
              <h4 className="font-medium text-text-primary mb-1">Welcome Banner</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Time-based greeting (Morning/Afternoon/Evening)</li>
                <li>Role-specific gradient text</li>
                <li>Animated background pattern</li>
                <li>Refresh button with role colors</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-1">Needs Attention</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Priority-based styling (Critical/Urgent/Important)</li>
                <li>Staggered entrance animations</li>
                <li>Role-specific action buttons</li>
                <li>Empty state illustration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-1">OPD Schedule Chart</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Gradient bar chart with glassmorphism</li>
                <li>Scheduled vs Current comparison</li>
                <li>Utilization metrics</li>
                <li>Interactive tooltips</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-1">Theme Switcher</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>8 role-specific color themes</li>
                <li>Instant theme switching</li>
                <li>Visual feedback & transitions</li>
                <li>Accessibility-focused colors</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardDemo;
