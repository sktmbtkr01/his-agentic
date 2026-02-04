import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
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
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="page-container min-h-screen flex items-center justify-center">
                <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
            </div>
        );
    }

    return (
        <div className="page-container min-h-screen pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{profile?.fullName}</h1>
                            <p className="opacity-90">Patient ID: {profile?.patientId}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 -mt-4">
                {error && (
                    <div className="alert alert-error mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success mb-4">
                        {success}
                    </div>
                )}

                {/* Basic Info Card */}
                <div className="card mb-4">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Age</span>
                            <span className="font-medium">{profile?.age} years</span>
                        </div>
                        <div>
                            <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Gender</span>
                            <span className="font-medium capitalize">{profile?.gender}</span>
                        </div>
                        <div>
                            <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Blood Group</span>
                            <span className="font-medium">{profile?.bloodGroup || 'Not recorded'}</span>
                        </div>
                        <div>
                            <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Date of Birth</span>
                            <span className="font-medium">
                                {new Date(profile?.dateOfBirth).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contact Info Card */}
                <div className="card mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                            Contact Information
                        </h2>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn btn-secondary text-sm py-2"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label">Street Address</label>
                                    <input
                                        type="text"
                                        value={formData.address.street}
                                        onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">City</label>
                                    <input
                                        type="text"
                                        value={formData.address.city}
                                        onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">State</label>
                                    <input
                                        type="text"
                                        value={formData.address.state}
                                        onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Pincode</label>
                                    <input
                                        type="text"
                                        value={formData.address.pincode}
                                        onChange={(e) => handleNestedChange('address', 'pincode', e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn btn-primary flex-1"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Phone</span>
                                <span className="font-medium">{profile?.phone}</span>
                            </div>
                            <div>
                                <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Email</span>
                                <span className="font-medium">{profile?.email || 'Not provided'}</span>
                            </div>
                            <div>
                                <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Address</span>
                                <span className="font-medium">
                                    {profile?.address?.street && `${profile.address.street}, `}
                                    {profile?.address?.city && `${profile.address.city}, `}
                                    {profile?.address?.state && `${profile.address.state} `}
                                    {profile?.address?.pincode}
                                    {!profile?.address?.street && !profile?.address?.city && 'Not provided'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Emergency Contact Card */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
                        Emergency Contact
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Name</span>
                            <span className="font-medium">{profile?.emergencyContact?.name || 'Not provided'}</span>
                        </div>
                        <div>
                            <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Relationship</span>
                            <span className="font-medium">{profile?.emergencyContact?.relationship || 'Not provided'}</span>
                        </div>
                        <div>
                            <span className="block" style={{ color: 'rgb(var(--color-text-secondary))' }}>Phone</span>
                            <span className="font-medium">{profile?.emergencyContact?.phone || 'Not provided'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
