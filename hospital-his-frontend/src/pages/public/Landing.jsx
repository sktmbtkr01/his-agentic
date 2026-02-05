import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, ArrowRight, ShieldCheck, Clock,
    Users, Database, FileText, Lock, ChevronRight, CheckCircle, ChevronLeft,
    Stethoscope, BedDouble, Pill, Banknote, FlaskConical, ScanLine, UserCog,
    HeartPulse, ClipboardList, Settings, BarChart3, TrendingUp
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

function Landing() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [animationStage, setAnimationStage] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        // Animation Sequence - PRESERVED EXACTLY
        const timer1 = setTimeout(() => setAnimationStage(1), 500);
        const timer2 = setTimeout(() => setAnimationStage(2), 2500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary-light selection:text-primary-dark overflow-x-hidden relative">

            {/* 1. Navbar (Refined, Not Rebuilt) */}
            <nav
                className={cn(
                    "fixed top-0 w-full z-50 transition-all duration-500 ease-in-out border-b border-transparent",
                    isScrolled
                        ? "bg-white/90 backdrop-blur-xl border-slate-200/50 shadow-sm py-3"
                        : "bg-transparent py-5"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-lg group-hover:shadow-teal-500/30 transition-all duration-500">
                            <Activity size={22} className="group-hover:animate-heartbeat" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-teal-600 transition-colors">
                            LifelineX
                        </span>
                    </div>

                    {/* Links (Refined spacing) */}
                    <div className="hidden md:flex gap-10 text-sm font-medium text-slate-600">
                        {['About', 'Services', 'Departments', 'Contact'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="relative hover:text-teal-600 transition-colors group py-2">
                                {item}
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
                            </a>
                        ))}
                    </div>

                    {/* CTA Button - Dark, Secure Pill */}
                    <motion.button
                        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 shadow-md transition-all flex items-center gap-2"
                    >
                        <Lock size={14} />
                        Login Portal
                    </motion.button>
                </div>
            </nav>

            {/* 2. Unified Coverage Strip */}
            <div className="fixed top-[72px] w-full z-40 bg-slate-800 py-2.5 overflow-hidden">
                <div className="flex w-[200%] animate-marquee">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex justify-around w-1/2 min-w-[50%] px-10 gap-12 text-white/80 font-medium text-xs tracking-wide uppercase">
                            <span className="flex items-center gap-2"><HeartPulse size={14} className="text-teal-400" /> OPD Management</span>
                            <span className="flex items-center gap-2"><BedDouble size={14} className="text-teal-400" /> IPD Tracking</span>
                            <span className="flex items-center gap-2"><FlaskConical size={14} className="text-teal-400" /> Lab Integration</span>
                            <span className="flex items-center gap-2"><Banknote size={14} className="text-teal-400" /> Billing & Claims</span>
                            <span className="flex items-center gap-2"><Pill size={14} className="text-teal-400" /> Pharmacy</span>
                            <span className="flex items-center gap-2"><ScanLine size={14} className="text-teal-400" /> Radiology</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Hero Section — Two-Column Layout */}
            <section className="min-h-screen pt-40 pb-20 w-full flex items-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/30">

                {/* Background Illustration - Hospital Team */}
                <div
                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                    style={{
                        backgroundImage: 'url(/hospital-team-bg.png)',
                        backgroundSize: '50% auto',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'left center',
                        opacity: 0.3
                    }}
                />

                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                        {/* Left Column - Identity & Action */}
                        <div className="space-y-8 lg:pr-8">

                            {/* Lifeline Animation Container - PRESERVED EXACTLY */}
                            <div className="w-full max-w-xl h-32 md:h-40 flex items-center justify-start relative">
                                <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                                    <path
                                        d="M0,100 L400,100 L415,50 L430,150 L445,100 L460,100 L470,80 L480,120 L490,100 L500,100 L1000,100"
                                        fill="none"
                                        stroke="#0D9488"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`transition-all duration-[2500ms] ease-out ${animationStage >= 1 ? 'stroke-dash-animate' : 'opacity-0'}`}
                                        style={{ strokeDasharray: 1200, strokeDashoffset: animationStage >= 1 ? 0 : 1200, filter: 'drop-shadow(0 0 8px rgba(13, 148, 136, 0.3))' }}
                                    />
                                </svg>

                                {/* Title Revealed Over Lifeline */}
                                <div className="absolute inset-0 flex items-center justify-start pointer-events-none">
                                    <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-teal-600 opacity-0 transition-all duration-1000 transform ${animationStage >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                                        }`}>
                                        LifelineX
                                    </h1>
                                </div>
                            </div>

                            {/* Headline & Description */}
                            <motion.div
                                className={`space-y-5 transition-all duration-1000 delay-300 ${animationStage >= 2 ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <p className="text-2xl md:text-3xl font-semibold text-slate-700 leading-snug">
                                    Where care meets control.
                                </p>
                                <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                                    A unified hospital operations platform. From patient registration to discharge, lab analytics to billing — LifelineX orchestrates every department with precision.
                                </p>
                            </motion.div>

                            {/* Primary CTA */}
                            <motion.div
                                className={`transition-all duration-1000 delay-500 ${animationStage >= 2 ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <button
                                    onClick={() => navigate('/login')}
                                    className="group relative px-8 py-4 bg-slate-800 hover:bg-slate-900 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:translate-y-[-2px]"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        Enter System
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </motion.div>

                            {/* Role Access Chips */}
                            <motion.div
                                className={`pt-8 transition-all duration-1000 delay-700 ${animationStage >= 2 ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <div className="flex flex-wrap gap-3">
                                    <RoleChip icon={<Stethoscope size={16} />} label="DOCTOR" action="Diagnose" />
                                    <RoleChip icon={<HeartPulse size={16} />} label="NURSE" action="Monitor" />
                                    <RoleChip icon={<Settings size={16} />} label="ADMIN" action="Govern" />
                                    <RoleChip icon={<BarChart3 size={16} />} label="LAB / BILLING" action="Analyze" />
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column - 3D System Visualization */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: animationStage >= 2 ? 1 : 0, x: animationStage >= 2 ? 0 : 40 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="hidden lg:block"
                        >
                            <SystemVisualization />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 5. How It Works (Timeline inside Glass Card) */}
            <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
                 {/* Background Orbs for Depth */}
                 <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-[100px] -translate-y-1/2 -z-10"></div>
                 <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[100px] translate-y-1/4 -z-10"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 mb-6 font-display tracking-tight">Streamlined Workflow</h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-light">From patient registration to final discharge, experience a seamless, integrated healthcare journey powered by intelligent automation.</p>
                    </motion.div>

                    {/* Timeline Card */}
                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <motion.div 
                            initial={{ scaleX: 0, opacity: 0 }}
                            whileInView={{ scaleX: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-teal-200 via-blue-200 to-indigo-200 z-0 origin-left"
                        ></motion.div>

                         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                                <TimelineStep
                                    number="01"
                                    title="Quick Registration"
                                    desc="AI-powered check-in with facial recognition reduces wait times by 60%."
                                    delay={0.2}
                                    icon={<UserCog size={28} className="text-teal-600" />}
                                    color="teal"
                                />
                                <TimelineStep
                                    number="02"
                                    title="Smart Triage"
                                    desc="Auto-priority assignment based on real-time vitals analysis."
                                    delay={0.4}
                                    icon={<Activity size={28} className="text-blue-600" />}
                                    color="blue"
                                />
                                <TimelineStep
                                    number="03"
                                    title="Care & Diagnostics"
                                    desc="Integrated labs ordering, imaging results, and care plans."
                                    delay={0.6}
                                    icon={<FlaskConical size={28} className="text-indigo-600" />}
                                    color="indigo"
                                />
                                <TimelineStep
                                    number="04"
                                    title="Billing & Discharge"
                                    desc="Seamless insurance claims processing and automated discharge summaries."
                                    delay={0.8}
                                    icon={<Banknote size={28} className="text-purple-600" />}
                                    color="purple"
                                />
                            </div>
                    </div>
                </div>
            </section>

            {/* 6. Specialized Modules (Carousel) */}
            <section id="departments" className="py-24 bg-gray-50 overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent"></div>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16 px-6"
                >
                    <h2 className="text-4xl font-bold text-slate-800 mb-4">Specialized Modules</h2>
                    <p className="text-slate-500 max-w-xl mx-auto">Tailored interfaces for every department in your hospital.</p>
                </motion.div>

                {/* Carousel Component */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <Carousel3D />
                </motion.div>
            </section>

            {/* 7. Stats Section */}
            <section className="py-20 bg-slate-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.2
                            }
                        }
                    }}
                    className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10"
                >
                    <StatItem number="10k+" label="Patients Served" />
                    <StatItem number="500+" label="Doctors" />
                    <StatItem number="99.9%" label="Uptime" />
                    <StatItem number="24/7" label="Support" />
                </motion.div>
            </section>

            {/* 8. Footer */}
            <footer className="bg-slate-900 text-white pt-16 pb-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto px-6"
                >
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                                    <Activity size={20} />
                                </div>
                                <span className="font-bold text-xl">LifelineX</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Empowering healthcare institutions with next-generation digital infrastructure.
                            </p>
                        </div>
                        <FooterColumn title="Platform" links={['Features', 'Integrations', 'Security', 'Changelog']} />
                        <FooterColumn title="Company" links={['About', 'Careers', 'Legal', 'Privacy']} />
                        <FooterColumn title="Connect" links={['Support', 'Documentation', 'Status', 'Contact']} />
                    </div>
                    <div className="text-center text-slate-500 text-xs border-t border-slate-800 pt-8">
                        &copy; 2026 LifelineX Inc. All rights reserved.
                    </div>
                </motion.div>
            </footer>

        </div>
    );
}

// --- Subcomponents ---

function RoleChip({ icon, label, action }) {
    return (
        <div className="bg-slate-800 hover:bg-slate-700 rounded-xl px-5 py-3 transition-all duration-300 cursor-pointer hover:translate-y-[-1px] hover:shadow-lg flex items-center gap-3">
            <div className="text-teal-400">
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-[10px] font-medium tracking-wider uppercase">{label}</p>
                <p className="text-white font-semibold text-sm">{action}</p>
            </div>
        </div>
    );
}

function SystemVisualization() {
    return (
        <div className="relative perspective-[1200px]">
            {/* Main System Panel */}
            <div className="relative bg-slate-800 rounded-2xl p-6 shadow-2xl transform rotate-y-[-3deg] rotate-x-[2deg]"
                style={{ transformStyle: 'preserve-3d' }}>

                {/* Live Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 text-xs font-semibold tracking-wider">LIVE</span>
                </div>

                {/* Header */}
                <div className="mb-6">
                    <h3 className="text-white font-semibold text-lg">System Overview</h3>
                    <p className="text-slate-400 text-sm">Real-time hospital operations</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <MiniStatCard label="Active Patients" value="847" trend="+12%" />
                    <MiniStatCard label="Beds Occupied" value="73%" trend="stable" />
                    <MiniStatCard label="Lab Queue" value="23" trend="-5" />
                </div>

                {/* Embedded Charts Layer */}
                <div className="bg-slate-700/50 rounded-xl p-4 mb-4 backdrop-blur-sm border border-slate-600/30">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-300 text-xs font-medium">Patient Flow — 24h</span>
                        <TrendingUp size={14} className="text-teal-400" />
                    </div>
                    {/* Mini Line Chart */}
                    <div className="h-16 flex items-end gap-1">
                        {[35, 42, 38, 55, 62, 48, 72, 68, 75, 82, 78, 85].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                className="flex-1 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                            />
                        ))}
                    </div>
                </div>

                {/* Department Load Bars */}
                <div className="space-y-3">
                    <LoadBar label="OPD" value={78} color="teal" />
                    <LoadBar label="IPD" value={65} color="blue" />
                    <LoadBar label="Lab" value={45} color="emerald" />
                </div>

                {/* Floating Depth Layer 1 */}
                <div className="absolute -right-4 top-1/4 w-24 h-32 bg-slate-700/60 rounded-xl border border-slate-600/30 backdrop-blur-sm p-3 shadow-xl"
                    style={{ transform: 'translateZ(30px)' }}>
                    <div className="text-teal-400 mb-2"><ClipboardList size={16} /></div>
                    <p className="text-white text-xs font-medium">Pending</p>
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-slate-400 text-[10px]">Lab Tests</p>
                </div>

                {/* Floating Depth Layer 2 */}
                <div className="absolute -left-6 bottom-1/4 w-28 h-24 bg-slate-700/60 rounded-xl border border-slate-600/30 backdrop-blur-sm p-3 shadow-xl"
                    style={{ transform: 'translateZ(50px)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                        <p className="text-slate-400 text-[10px]">Processing</p>
                    </div>
                    <p className="text-white text-lg font-bold">38</p>
                    <p className="text-slate-400 text-[10px]">Bills Today</p>
                </div>
            </div>
        </div>
    );
}

function MiniStatCard({ label, value, trend }) {
    const trendColor = trend.includes('+') ? 'text-emerald-400' : trend.includes('-') ? 'text-amber-400' : 'text-slate-400';
    return (
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-white text-xl font-bold">{value}</p>
            <p className={`text-[10px] ${trendColor}`}>{trend}</p>
        </div>
    );
}

function LoadBar({ label, value, color }) {
    const colorMap = {
        teal: 'from-teal-500 to-teal-400',
        blue: 'from-blue-500 to-blue-400',
        emerald: 'from-emerald-500 to-emerald-400',
    };
    return (
        <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs w-8">{label}</span>
            <div className="flex-1 h-2 bg-slate-600/50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className={`h-full bg-gradient-to-r ${colorMap[color]} rounded-full`}
                />
            </div>
            <span className="text-slate-300 text-xs font-medium w-8 text-right">{value}%</span>
        </div>
    );
}

function TimelineStep({ number, title, desc, delay, icon, color = 'teal' }) {
    const colorVariants = {
        teal: 'from-teal-500 to-teal-600 shadow-teal-500/20 ring-teal-50',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/20 ring-blue-50',
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20 ring-indigo-50',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/20 ring-purple-50',
    };

    const textColors = {
        teal: 'text-teal-600',
        blue: 'text-blue-600',
        indigo: 'text-indigo-600',
        purple: 'text-purple-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: delay }}
            className="flex flex-col items-center text-center group relative p-4 rounded-2xl hover:bg-white/50 hover:shadow-lg transition-all duration-300"
        >
            {/* Circle Node */}
            <div className={`w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300 ring-8 ${colorVariants[color].split(' ring-')[1]} border border-slate-50`}>
                 <div className={`bg-slate-50 p-3 rounded-full ${textColors[color].replace('text-', 'bg-').replace('600', '50')}`}>
                    {icon}
                 </div>
            </div>

            <span className={`text-[10px] font-bold tracking-widest mb-2 uppercase px-3 py-1 rounded-full bg-slate-50 ${textColors[color]}`}>Step {number}</span>
            <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[200px] mx-auto font-medium">{desc}</p>
        </motion.div>
    );
}

function Carousel3D() {
    const cards = [
        { title: "OPD", desc: "Out-Patient Department", color: "from-blue-400 to-blue-600", icon: <Stethoscope size={36} /> },
        { title: "IPD", desc: "In-Patient Care", color: "from-teal-400 to-teal-600", icon: <BedDouble size={36} /> },
        { title: "Pharmacy", desc: "Inventory & Medicine", color: "from-emerald-400 to-emerald-600", icon: <Pill size={36} /> },
        { title: "Billing", desc: "Invoices & Insurance", color: "from-orange-400 to-orange-600", icon: <Banknote size={36} /> },
        { title: "Pathology", desc: "Lab & Diagnostics", color: "from-purple-400 to-purple-600", icon: <FlaskConical size={36} /> },
        { title: "Radiology", desc: "Imaging & Reports", color: "from-indigo-400 to-indigo-600", icon: <ScanLine size={36} /> },
        { title: "Admin", desc: "HR & Analytics", color: "from-rose-400 to-rose-600", icon: <UserCog size={36} /> },
    ];

    const [active, setActive] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActive(prev => (prev + 1) % cards.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [cards.length]);

    return (
        <div className="relative h-[400px] w-full max-w-6xl mx-auto flex items-center justify-center perspective-[1200px] overflow-visible">
            <AnimatePresence mode="popLayout">
                {cards.map((card, index) => {
                    // Calculate position relative to active
                    const offset = (index - active + cards.length) % cards.length;
                    // We want to show 5 cards: center (0), left (-1, -2), right (1, 2)
                    // Normalize loop indices to range centered around 0: e.g. -2, -1, 0, 1, 2
                    let normOffset = offset;
                    if (offset > cards.length / 2) normOffset -= cards.length;

                    // Only render visible range (-2 to 2)
                    if (Math.abs(normOffset) > 2) return null;

                    const isActive = normOffset === 0;

                    return (
                        <motion.div
                            key={card.title}
                            layout
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                scale: isActive ? 1.1 : 1 - (Math.abs(normOffset) * 0.15),
                                opacity: isActive ? 1 : 1 - (Math.abs(normOffset) * 0.3),
                                x: normOffset * 320, // Increased spacing for bigger cards
                                zIndex: 10 - Math.abs(normOffset),
                                rotateY: normOffset * -10
                            }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="absolute w-[350px] md:w-[400px] h-[280px] p-10 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-soft-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white transition-colors"
                            onClick={() => setActive(index)}
                        >
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${card.color} mb-6 flex items-center justify-center text-white text-3xl font-bold shadow-lg transform group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mb-3">{card.title}</h3>
                            <p className="text-slate-500 font-medium text-lg">{card.desc}</p>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

function StatItem({ number, label }) {
    return (
        <motion.div 
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
            }}
            className="space-y-2"
        >
            <div className="text-4xl md:text-5xl font-bold text-teal-400">{number}</div>
            <div className="text-white/60 text-sm font-medium uppercase tracking-wider">{label}</div>
        </motion.div>
    );
}

function FooterColumn({ title, links }) {
    return (
        <div>
            <h4 className="font-semibold text-white mb-4">{title}</h4>
            <ul className="space-y-2">
                {links.map(link => (
                    <li key={link}>
                        <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">{link}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Landing;
