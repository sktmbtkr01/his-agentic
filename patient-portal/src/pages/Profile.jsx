import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, User, Phone, Mail, MapPin, AlertCircle, 
    Edit2, Save, X, Calendar, Droplets, Heart
} from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { patient } = useAuth();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
        },
        emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
        },
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/patient/auth/profile');
            const data = response.data.data;
            setProfile(data);
            setFormData({
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || { street: '', city: '', state: '', pincode: '' },
                emergencyContact: data.emergencyContact || { name: '', relationship: '', phone: '' },
            });
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            const response = await api.put('/patient/auth/profile', formData);
            setProfile(response.data.data);
            setSuccess('Profile updated successfully');
            setTimeout(() => setSuccess(''), 3000);
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
             <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-slate-400">Loading your profile...</p>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-24 relative">
             {/* Glass Header */}
             <div className="sticky top-0 z-30 glass border-b border-slate-200/50 px-4 pt-4 pb-2">
                 <div className="flex items-center justify-between mb-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100/50 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">My Profile</h1>
                    <div className="w-8"></div>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="px-4 pt-6 pb-2 relative z-[1]">
                 <div className="card-premium p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none shadow-blue-500/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm shadow-inner border border-white/30 flex items-center justify-center text-3xl font-bold">
                            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profile?.fullName}</h2>
                            <p className="opacity-80 font-medium text-sm mt-0.5 flex items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs">ID: {profile?.patientId}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-white/20">
                         <div className="text-center">
                            <span className="block text-xs uppercase opacity-70 mb-1 font-bold tracking-wider">Age</span>
                            <span className="font-bold text-lg">{profile?.age} <span className="text-xs opacity-70 font-normal">Years</span></span>
                        </div>
                        <div className="text-center border-l border-white/20 px-2">
                             <span className="block text-xs uppercase opacity-70 mb-1 font-bold tracking-wider">Blood</span>
                            <span className="font-bold text-lg flex items-center justify-center gap-1">
                                <Droplets size={14} className="fill-current text-rose-300" />
                                {profile?.bloodGroup || 'N/A'}
                            </span>
                        </div>
                         <div className="text-center border-l border-white/20 px-2">
                             <span className="block text-xs uppercase opacity-70 mb-1 font-bold tracking-wider">Gender</span>
                            <span className="font-bold text-lg capitalize">{profile?.gender}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Form */}
            <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="alert alert-error">
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="alert alert-success">
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Contact Information */}
                <div className="card-premium p-5 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Phone size={18} className="text-blue-500" />
                            Contact Details
                        </h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Edit2 size={12} /> Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Phone */}
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Phone Number</label>
                             <div className={`flex items-center gap-3 p-3 rounded-xl border ${isEditing ? 'bg-white border-blue-200 ring-4 ring-blue-50/50' : 'bg-slate-50 border-slate-100'}`}>
                                <Phone size={18} className={isEditing ? "text-blue-500" : "text-slate-400"} />
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="bg-transparent border-none appearance-none outline-none w-full text-slate-700 font-medium placeholder-slate-300"
                                        placeholder="Enter phone number"
                                        required
                                    />
                                ) : (
                                    <span className="text-slate-700 font-medium">{profile?.phone}</span>
                                )}
                             </div>
                        </div>

                         {/* Email */}
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Email Address</label>
                             <div className={`flex items-center gap-3 p-3 rounded-xl border ${isEditing ? 'bg-white border-blue-200 ring-4 ring-blue-50/50' : 'bg-slate-50 border-slate-100'}`}>
                                <Mail size={18} className={isEditing ? "text-blue-500" : "text-slate-400"} />
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="bg-transparent border-none appearance-none outline-none w-full text-slate-700 font-medium placeholder-slate-300"
                                        placeholder="Enter email address"
                                    />
                                ) : (
                                    <span className="text-slate-700 font-medium">{profile?.email || 'Not provided'}</span>
                                )}
                             </div>
                        </div>
                        
                        {/* Address */}
                         <div>
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Address</label>
                             <div className={`flex flex-col gap-3 p-3 rounded-xl border transition-colors ${isEditing ? 'bg-white border-blue-200 ring-4 ring-blue-50/50' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-start gap-3">
                                    <MapPin size={18} className={`flex-shrink-0 mt-1 ${isEditing ? "text-blue-500" : "text-slate-400"}`} />
                                    <div className="w-full">
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={formData.address.street}
                                                    onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                                                    className="w-full bg-transparent border-b border-slate-200 pb-1 text-slate-700 font-medium placeholder-slate-300 focus:border-blue-400 outline-none text-sm"
                                                    placeholder="Street Address"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={formData.address.city}
                                                        onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                                                         className="w-full bg-transparent border-b border-slate-200 pb-1 text-slate-700 font-medium placeholder-slate-300 focus:border-blue-400 outline-none text-sm"
                                                        placeholder="City"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={formData.address.state}
                                                        onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                                                         className="w-full bg-transparent border-b border-slate-200 pb-1 text-slate-700 font-medium placeholder-slate-300 focus:border-blue-400 outline-none text-sm"
                                                        placeholder="State"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.address.pincode}
                                                    onChange={(e) => handleNestedChange('address', 'pincode', e.target.value)}
                                                     className="w-1/2 bg-transparent border-b border-slate-200 pb-1 text-slate-700 font-medium placeholder-slate-300 focus:border-blue-400 outline-none text-sm"
                                                    placeholder="Pincode"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-slate-700 font-medium block leading-relaxed">
                                                {profile?.address?.street && <span className="block">{profile.address.street}</span>}
                                                <span className="block text-sm text-slate-500">
                                                    {[profile?.address?.city, profile?.address?.state, profile?.address?.pincode].filter(Boolean).join(', ')}
                                                </span>
                                                {!profile?.address?.street && !profile?.address?.city && <span className="text-slate-400 italic">No address provided</span>}
                                            </span>
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Action Buttons */}
                        <AnimatePresence>
                            {isEditing && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex gap-3 pt-2"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                phone: profile.phone || '',
                                                email: profile.email || '',
                                                address: profile.address || { street: '', city: '', state: '', pincode: '' },
                                                emergencyContact: profile.emergencyContact || { name: '', relationship: '', phone: '' },
                                            });
                                        }}
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm tracking-wide active:scale-95 transition-transform"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-blue-500/20 active:scale-95 transition-transform flex justify-center items-center gap-2"
                                    >
                                        {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* Emergency Contact */}
                 <div className="card-premium p-5 bg-white border-l-4 border-l-rose-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                            <AlertCircle size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">Emergency Contact</h3>
                    </div>

                    <div className="space-y-3 pl-2">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</span>
                            <span className="font-bold text-slate-700">{profile?.emergencyContact?.name || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Relationship</span>
                            <span className="font-bold text-slate-700">{profile?.emergencyContact?.relationship || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                            <span className="font-bold text-slate-700">{profile?.emergencyContact?.phone || 'Not provided'}</span>
                        </div>
                    </div>
                 </div>

                 <div className="text-center pt-8 pb-4">
                     <p className="text-xs text-slate-400">
                         Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                     </p>
                 </div>
            </div>
        </div>
    );
};

export default Profile;
