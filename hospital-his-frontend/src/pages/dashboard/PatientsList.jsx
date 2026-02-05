import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getPatients, reset } from '../../features/patients/patientsSlice';
import AddPatientModal from '../../components/patients/AddPatientModal';
import { 
    Search, Plus, Filter, MoreVertical, User, Calendar, Phone, 
    ChevronUp, ChevronDown, X, Users, UserPlus, Activity,
    Eye, Edit3, Trash2, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { TableRowSkeleton } from '../../components/ui/Skeletons';
import Button from '../../components/ui/Button';

// Blood type color mapping
const BLOOD_TYPE_COLORS = {
    'A+': { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', gradient: 'from-red-500 to-rose-600' },
    'A-': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', gradient: 'from-red-400 to-rose-500' },
    'B+': { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', gradient: 'from-blue-500 to-indigo-600' },
    'B-': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', gradient: 'from-blue-400 to-indigo-500' },
    'O+': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', gradient: 'from-emerald-500 to-teal-600' },
    'O-': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', gradient: 'from-emerald-400 to-teal-500' },
    'AB+': { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', gradient: 'from-purple-500 to-violet-600' },
    'AB-': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', gradient: 'from-purple-400 to-violet-500' },
};

// Avatar gradient colors based on name hash
const AVATAR_GRADIENTS = [
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-sky-500 to-cyan-600',
];

const getAvatarGradient = (name) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
};

// Blood Type Badge Component
const BloodTypeBadge = ({ bloodGroup }) => {
    if (!bloodGroup) {
        return (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-surface-secondary text-text-muted border border-border">
                N/A
            </span>
        );
    }
    const colors = BLOOD_TYPE_COLORS[bloodGroup] || BLOOD_TYPE_COLORS['O+'];
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
            {bloodGroup}
        </span>
    );
};

// Patient Avatar Component
const PatientAvatar = ({ firstName, lastName, size = 'md' }) => {
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    const gradient = getAvatarGradient(`${firstName}${lastName}`);
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };
    
    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-lg shadow-black/10`}>
            {initials}
        </div>
    );
};

// Sort Header Component
const SortHeader = ({ label, sortKey, currentSort, onSort, className = '' }) => {
    const isActive = currentSort.key === sortKey;
    const isAsc = currentSort.direction === 'asc';
    
    return (
        <th 
            className={`p-4 cursor-pointer select-none group transition-colors hover:bg-surface-highlight/50 ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1.5">
                <span>{label}</span>
                <div className="flex flex-col -space-y-1">
                    <ChevronUp 
                        size={12} 
                        className={`transition-colors ${isActive && isAsc ? 'text-role' : 'text-text-muted/30 group-hover:text-text-muted'}`} 
                    />
                    <ChevronDown 
                        size={12} 
                        className={`transition-colors ${isActive && !isAsc ? 'text-role' : 'text-text-muted/30 group-hover:text-text-muted'}`} 
                    />
                </div>
            </div>
        </th>
    );
};

// Action Menu Component
const ActionMenu = ({ patient, onView, onEdit, onDelete, onViewEMR }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="relative">
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-highlight transition-all"
            >
                <MoreVertical size={16} />
            </motion.button>
            
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 z-20 w-48 bg-surface border border-border rounded-xl shadow-xl shadow-black/10 py-1.5 overflow-hidden"
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); onView(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-highlight transition-colors"
                            >
                                <Eye size={16} className="text-blue-500" /> View Details
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onViewEMR(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-highlight transition-colors"
                            >
                                <FileText size={16} className="text-emerald-500" /> View EMR
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-highlight transition-colors"
                            >
                                <Edit3 size={16} className="text-amber-500" /> Edit Patient
                            </button>
                            <div className="my-1.5 border-t border-border" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 size={16} /> Delete Patient
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// Filter Chip Component
const FilterChip = ({ label, onRemove }) => (
    <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-role/10 text-role text-xs font-medium rounded-full"
    >
        {label}
        <button onClick={onRemove} className="hover:bg-role/20 rounded-full p-0.5 transition-colors">
            <X size={12} />
        </button>
    </motion.span>
);

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color, gradient }) => (
    <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        className={`relative overflow-hidden bg-surface border border-border rounded-2xl p-4 shadow-sm`}
    >
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                <Icon size={20} className="text-white" />
            </div>
            <div>
                <div className="text-2xl font-bold text-text-primary">{value}</div>
                <div className="text-xs text-text-muted">{label}</div>
            </div>
        </div>
    </motion.div>
);

// Mobile Patient Card Component
const MobilePatientCard = ({ patient, index, onClick, onViewEMR }) => {
    const gradient = getAvatarGradient(`${patient.firstName}${patient.lastName}`);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-role/30 transition-all cursor-pointer"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <PatientAvatar firstName={patient.firstName} lastName={patient.lastName} size="lg" />
                    <div>
                        <div className="font-semibold text-text-primary">{patient.firstName} {patient.lastName}</div>
                        <div className="text-xs text-text-muted font-mono">{patient.patientId}</div>
                    </div>
                </div>
                <BloodTypeBadge bloodGroup={patient.bloodGroup} />
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                    <User size={14} className="text-text-muted" />
                    {patient.age ? `${patient.age} yrs` : 'N/A'} • <span className="capitalize">{patient.gender}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                    <Phone size={14} className="text-text-muted" />
                    {patient.phone}
                </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-muted text-xs">
                    <Calendar size={12} />
                    <span className="italic">No recent visit</span>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onViewEMR(); }}
                    className="text-xs font-medium text-role hover:underline"
                >
                    View EMR →
                </button>
            </div>
        </motion.div>
    );
};

const PatientsList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { patients, isLoading, isError, message } = useSelector((state) => state.patients);
    const { user } = useSelector((state) => state.auth);

    // Local state
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ gender: null, bloodGroup: null });
    const [sort, setSort] = useState({ key: 'firstName', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        dispatch(getPatients());
        return () => { dispatch(reset()); }
    }, [dispatch]);

    // Filter and sort patients
    const processedPatients = useMemo(() => {
        if (!patients) return [];
        
        let result = [...patients];
        
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.firstName?.toLowerCase().includes(term) ||
                p.lastName?.toLowerCase().includes(term) ||
                p.phone?.includes(term) ||
                p.patientId?.toLowerCase().includes(term)
            );
        }
        
        // Apply gender filter
        if (activeFilters.gender) {
            result = result.filter(p => p.gender === activeFilters.gender);
        }
        
        // Apply blood group filter
        if (activeFilters.bloodGroup) {
            result = result.filter(p => p.bloodGroup === activeFilters.bloodGroup);
        }
        
        // Apply sorting
        result.sort((a, b) => {
            let aVal = a[sort.key] || '';
            let bVal = b[sort.key] || '';
            
            if (sort.key === 'age') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return result;
    }, [patients, searchTerm, activeFilters, sort]);

    // Pagination
    const totalPages = Math.ceil(processedPatients.length / itemsPerPage);
    const paginatedPatients = processedPatients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const clearFilter = (filterKey) => {
        setActiveFilters(prev => ({ ...prev, [filterKey]: null }));
    };

    const triggerConfetti = () => {
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const hasActiveFilters = activeFilters.gender || activeFilters.bloodGroup;

    // Loading state removed to show skeleton table


    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <X size={32} className="text-red-500" />
                </div>
                <p className="text-red-500 font-medium">Error loading patients</p>
                <p className="text-text-muted text-sm mt-1">{message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard 
                    icon={Users} 
                    label="Total Patients" 
                    value={patients?.length || 0} 
                    gradient="from-cyan-500 to-blue-600"
                />
                <StatsCard 
                    icon={UserPlus} 
                    label="New This Month" 
                    value={patients?.filter(p => {
                        const created = new Date(p.createdAt);
                        const now = new Date();
                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                    }).length || 0} 
                    gradient="from-emerald-500 to-teal-600"
                />
                <StatsCard 
                    icon={Activity} 
                    label="Active Today" 
                    value={Math.floor((patients?.length || 0) * 0.3)} 
                    gradient="from-violet-500 to-purple-600"
                />
                <StatsCard 
                    icon={Calendar} 
                    label="Appointments" 
                    value={Math.floor((patients?.length || 0) * 0.5)} 
                    gradient="from-amber-500 to-orange-600"
                />
            </div>

            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="w-2 h-8 bg-gradient-to-b from-role to-role-dark rounded-full" />
                        Patient Registry
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Manage patient records, demographics, and medical history
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <motion.div 
                        className="relative"
                        animate={{ width: isSearchFocused ? 280 : 220 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Search className={`absolute left-3 top-2.5 transition-colors ${isSearchFocused ? 'text-role' : 'text-text-muted'}`} size={18} />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-role/20 focus:border-role/50 text-text-primary placeholder:text-text-muted transition-all"
                        />
                        <AnimatePresence>
                            {searchTerm && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-surface-highlight text-text-muted"
                                >
                                    <X size={16} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Filter Button */}
                    <Button 
                        variant={showFilters || hasActiveFilters ? 'ghost' : 'outline'}
                        onClick={() => setShowFilters(!showFilters)}
                        leftIcon={Filter}
                        className={showFilters || hasActiveFilters 
                            ? 'bg-role/10 border border-role/30 text-role hover:bg-role/20' 
                            : 'text-text-secondary hover:text-text-primary'
                        }
                    >
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-1 w-5 h-5 bg-role text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {[activeFilters.gender, activeFilters.bloodGroup].filter(Boolean).length}
                            </span>
                        )}
                    </Button>

                    {/* Add Patient Button */}
                    {user?.role !== 'doctor' && (
                        <Button
                            variant="primary"
                            leftIcon={Plus}
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            Add Patient
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface border border-border rounded-2xl p-4 shadow-sm overflow-hidden"
                    >
                        <div className="flex flex-wrap gap-6">
                            {/* Gender Filter */}
                            <div>
                                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Gender</label>
                                <div className="flex gap-2">
                                    {['male', 'female', 'other'].map(gender => (
                                        <button
                                            key={gender}
                                            onClick={() => setActiveFilters(prev => ({ 
                                                ...prev, 
                                                gender: prev.gender === gender ? null : gender 
                                            }))}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                                                activeFilters.gender === gender
                                                    ? 'bg-role text-white'
                                                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-highlight'
                                            }`}
                                        >
                                            {gender}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Blood Group Filter */}
                            <div>
                                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Blood Group</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(BLOOD_TYPE_COLORS).map(bg => (
                                        <button
                                            key={bg}
                                            onClick={() => setActiveFilters(prev => ({ 
                                                ...prev, 
                                                bloodGroup: prev.bloodGroup === bg ? null : bg 
                                            }))}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                                activeFilters.bloodGroup === bg
                                                    ? `bg-gradient-to-r ${BLOOD_TYPE_COLORS[bg].gradient} text-white`
                                                    : `${BLOOD_TYPE_COLORS[bg].bg} ${BLOOD_TYPE_COLORS[bg].text} hover:opacity-80`
                                            }`}
                                        >
                                            {bg}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {hasActiveFilters && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                                <span className="text-xs text-text-muted">Active:</span>
                                <AnimatePresence>
                                    {activeFilters.gender && (
                                        <FilterChip label={`Gender: ${activeFilters.gender}`} onRemove={() => clearFilter('gender')} />
                                    )}
                                    {activeFilters.bloodGroup && (
                                        <FilterChip label={`Blood: ${activeFilters.bloodGroup}`} onRemove={() => clearFilter('bloodGroup')} />
                                    )}
                                </AnimatePresence>
                                <button 
                                    onClick={() => setActiveFilters({ gender: null, bloodGroup: null })}
                                    className="text-xs text-text-muted hover:text-red-500 transition-colors ml-2"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Info */}
            <div className="flex items-center justify-between text-sm">
                <div className="text-text-muted">
                    Showing <span className="font-semibold text-text-primary">{paginatedPatients.length}</span> of{' '}
                    <span className="font-semibold text-text-primary">{processedPatients.length}</span> patients
                    {searchTerm && <span className="ml-2">for "{searchTerm}"</span>}
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gradient-to-r from-surface-secondary to-surface border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                                <SortHeader label="Patient ID" sortKey="patientId" currentSort={sort} onSort={handleSort} />
                                <SortHeader label="Patient" sortKey="firstName" currentSort={sort} onSort={handleSort} />
                                <SortHeader label="Age" sortKey="age" currentSort={sort} onSort={handleSort} />
                                <th className="p-4">Blood Type</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Last Visit</th>
                                <th className="p-4 text-center w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <TableRowSkeleton />
                            ) : paginatedPatients.length > 0 ? paginatedPatients.map((patient, index) => (
                                <motion.tr
                                    key={patient._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => navigate(`/dashboard/patients/${patient._id}`)}
                                    className={`
                                        group cursor-pointer transition-all border-b border-border/50 last:border-b-0
                                        ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-secondary/30'}
                                        hover:bg-role/5 hover:shadow-[inset_0_0_0_1px_rgb(var(--color-role)/0.1)]
                                    `}
                                >
                                    <td className="p-4">
                                        <span className="font-mono text-sm text-text-secondary bg-surface-secondary px-2 py-1 rounded-md">
                                            {patient.patientId}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <PatientAvatar firstName={patient.firstName} lastName={patient.lastName} />
                                            <div>
                                                <div className="font-semibold text-text-primary group-hover:text-role transition-colors">
                                                    {patient.firstName} {patient.lastName}
                                                </div>
                                                <div className="text-xs text-text-muted capitalize">{patient.gender}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-text-primary font-medium">
                                            {patient.age ? `${patient.age} yrs` : '—'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <BloodTypeBadge bloodGroup={patient.bloodGroup} />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Phone size={14} className="text-text-muted" />
                                            <span className="font-mono text-sm">{patient.phone}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-text-muted italic text-sm">
                                            <Calendar size={14} className="opacity-50" />
                                            <span>No recent visit</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ActionMenu 
                                                patient={patient}
                                                onView={() => navigate(`/dashboard/patients/${patient._id}`)}
                                                onViewEMR={() => navigate(`/dashboard/emr/${patient._id}`)}
                                                onEdit={() => {}}
                                                onDelete={() => {}}
                                            />
                                        </div>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
                                                <Users size={32} className="text-text-muted" />
                                            </div>
                                            <p className="text-text-primary font-medium mb-1">No patients found</p>
                                            <p className="text-text-muted text-sm">
                                                {searchTerm ? `No results for "${searchTerm}"` : 'Add a new patient to get started.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-surface-secondary/50">
                        <div className="text-sm text-text-muted">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                            currentPage === pageNum
                                                ? 'bg-role text-white shadow-md'
                                                : 'hover:bg-surface-highlight text-text-secondary'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
                {paginatedPatients.length > 0 ? paginatedPatients.map((patient, index) => (
                    <MobilePatientCard
                        key={patient._id}
                        patient={patient}
                        index={index}
                        onClick={() => navigate(`/dashboard/patients/${patient._id}`)}
                        onViewEMR={() => navigate(`/dashboard/emr/${patient._id}`)}
                    />
                )) : (
                    <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users size={28} className="text-text-muted" />
                        </div>
                        <p className="text-text-primary font-medium mb-1">No patients found</p>
                        <p className="text-text-muted text-sm">
                            {searchTerm ? `No results for "${searchTerm}"` : 'Add a new patient to get started.'}
                        </p>
                    </div>
                )}

                {/* Mobile Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-highlight disabled:opacity-50 text-sm font-medium"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-text-muted">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-highlight disabled:opacity-50 text-sm font-medium"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Add Patient Modal */}
            <AddPatientModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={triggerConfetti}
            />
        </div>
    );
};

export default PatientsList;
