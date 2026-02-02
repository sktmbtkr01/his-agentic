import React, { useState, useEffect } from 'react';
import {
    getOnboardingIds,
    getOnboardingStats,
    generateOnboardingId,
    bulkGenerateOnboardingIds,
    revokeOnboardingId,
    getPendingApprovals,
    approveUserOnboarding,
    rejectUserOnboarding,
    getDepartments,
    getWards,
} from '../../services/admin.service';
import './AdminPages.css';
import './StaffOnboarding.css';

/**
 * Staff Onboarding Management Page
 * Admin-only interface for:
 * - Generating onboarding IDs
 * - Managing pending user approvals
 * - Viewing onboarding statistics
 * 
 * Design: "Staff onboarding is fully admin-controlled. 
 * No one can create an account or choose a role without explicit authorization."
 */

const ROLES = [
    { value: 'doctor', label: 'Doctor', color: 'blue' },
    { value: 'nurse', label: 'Nurse', color: 'green' },
    { value: 'head_nurse', label: 'Head Nurse', color: 'emerald' },
    { value: 'lab_tech', label: 'Lab Technician', color: 'cyan' },
    { value: 'radiologist', label: 'Radiologist', color: 'purple' },
    { value: 'pharmacist', label: 'Pharmacist', color: 'pink' },
    { value: 'billing', label: 'Billing Staff', color: 'orange' },
    { value: 'receptionist', label: 'Receptionist', color: 'yellow' },
    { value: 'inventory_manager', label: 'Inventory Manager', color: 'indigo' },
    { value: 'coder', label: 'Medical Coder', color: 'teal' },
    { value: 'senior_coder', label: 'Senior Coder', color: 'slate' },
    { value: 'insurance', label: 'Insurance Staff', color: 'rose' },
    { value: 'compliance', label: 'Compliance Officer', color: 'amber' },
];

const StaffOnboarding = () => {
    // State
    const [activeTab, setActiveTab] = useState('onboarding-ids');
    const [stats, setStats] = useState(null);
    const [onboardingIds, setOnboardingIds] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ status: '', role: '' });

    // Modal states
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [generatedId, setGeneratedId] = useState(null);

    // Form state
    const [generateForm, setGenerateForm] = useState({
        role: '',
        department: '',
        ward: '',
        expiresAt: '',
        notes: '',
    });
    const [bulkForm, setBulkForm] = useState({
        role: '',
        department: '',
        count: 5,
        expiresAt: '',
        notes: '',
    });
    const [revokeReason, setRevokeReason] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    // Load data
    useEffect(() => {
        loadData();
    }, [activeTab, filter]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Always load stats
            const statsRes = await getOnboardingStats();
            setStats(statsRes.data);

            // Load master data
            const [deptRes, wardRes] = await Promise.all([
                getDepartments().catch(() => ({ data: [] })),
                getWards().catch(() => ({ data: [] })),
            ]);
            setDepartments(deptRes.data || []);
            setWards(wardRes.data || []);

            if (activeTab === 'onboarding-ids') {
                const response = await getOnboardingIds(filter);
                setOnboardingIds(response.data || []);
            } else if (activeTab === 'pending-approvals') {
                const response = await getPendingApprovals();
                setPendingUsers(response.data || []);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Generate single onboarding ID
    const handleGenerate = async () => {
        if (!generateForm.role) {
            alert('Please select a role');
            return;
        }

        try {
            const response = await generateOnboardingId({
                role: generateForm.role,
                department: generateForm.department || null,
                ward: generateForm.ward || null,
                expiresAt: generateForm.expiresAt || null,
                notes: generateForm.notes || '',
            });

            setGeneratedId(response.data);
            setGenerateForm({ role: '', department: '', ward: '', expiresAt: '', notes: '' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to generate onboarding ID');
        }
    };

    // Bulk generate onboarding IDs
    const handleBulkGenerate = async () => {
        if (!bulkForm.role) {
            alert('Please select a role');
            return;
        }

        try {
            const response = await bulkGenerateOnboardingIds({
                role: bulkForm.role,
                department: bulkForm.department || null,
                count: bulkForm.count,
                expiresAt: bulkForm.expiresAt || null,
                notes: bulkForm.notes || '',
            });

            alert(`Successfully generated ${response.data?.length || 0} onboarding IDs`);
            setShowBulkModal(false);
            setBulkForm({ role: '', department: '', count: 5, expiresAt: '', notes: '' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to generate onboarding IDs');
        }
    };

    // Revoke onboarding ID
    const handleRevoke = async () => {
        if (!revokeReason.trim()) {
            alert('Please provide a reason for revocation');
            return;
        }

        try {
            await revokeOnboardingId(showRevokeModal, revokeReason);
            setShowRevokeModal(null);
            setRevokeReason('');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to revoke onboarding ID');
        }
    };

    // Approve user
    const handleApprove = async (userId) => {
        if (!window.confirm('Are you sure you want to approve this user?')) return;

        try {
            await approveUserOnboarding(userId);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to approve user');
        }
    };

    // Reject user
    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await rejectUserOnboarding(showRejectModal, rejectReason);
            setShowRejectModal(null);
            setRejectReason('');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to reject user');
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const getRoleBadgeClass = (role) => {
        const roleData = ROLES.find(r => r.value === role);
        const colors = {
            blue: 'badge-blue',
            green: 'badge-green',
            emerald: 'badge-green',
            cyan: 'badge-cyan',
            purple: 'badge-purple',
            pink: 'badge-pink',
            orange: 'badge-orange',
            yellow: 'badge-yellow',
            indigo: 'badge-purple',
            teal: 'badge-cyan',
            slate: 'badge-gray',
            rose: 'badge-red',
            amber: 'badge-orange',
        };
        return colors[roleData?.color] || 'badge-gray';
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            ACTIVE: 'badge-green',
            USED: 'badge-blue',
            EXPIRED: 'badge-orange',
            REVOKED: 'badge-red',
        };
        return classes[status] || 'badge-gray';
    };

    return (
        <div className="admin-page staff-onboarding-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>🔐 Staff Onboarding</h1>
                    <p className="page-subtitle">
                        Admin-controlled onboarding. No open signup allowed.
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => setShowBulkModal(true)}
                    >
                        📦 Bulk Generate
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => setShowGenerateModal(true)}
                    >
                        + Generate ID
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid onboarding-stats">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#dcfce7' }}>🟢</div>
                        <div>
                            <span className="stat-label">Active IDs</span>
                            <span className="stat-value">{stats.onboardingIds?.active || 0}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#dbeafe' }}>✓</div>
                        <div>
                            <span className="stat-label">Used IDs</span>
                            <span className="stat-value">{stats.onboardingIds?.used || 0}</span>
                        </div>
                    </div>
                    <div className="stat-card warning-card">
                        <div className="stat-icon" style={{ background: '#fef3c7' }}>⏳</div>
                        <div>
                            <span className="stat-label">Pending Approvals</span>
                            <span className="stat-value">{stats.pendingApprovals || 0}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#f1f5f9' }}>📊</div>
                        <div>
                            <span className="stat-label">Total IDs</span>
                            <span className="stat-value">{stats.onboardingIds?.total || 0}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'onboarding-ids' ? 'active' : ''}`}
                    onClick={() => setActiveTab('onboarding-ids')}
                >
                    🔑 Onboarding IDs
                </button>
                <button
                    className={`tab ${activeTab === 'pending-approvals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending-approvals')}
                >
                    ⏳ Pending Approvals
                    {stats?.pendingApprovals > 0 && (
                        <span className="tab-badge">{stats.pendingApprovals}</span>
                    )}
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Onboarding IDs Tab */}
            {activeTab === 'onboarding-ids' && (
                <>
                    <div className="filters-bar">
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="USED">Used</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="REVOKED">Revoked</option>
                        </select>
                        <select
                            value={filter.role}
                            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                        >
                            <option value="">All Roles</option>
                            {ROLES.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                        <button className="btn-secondary" onClick={loadData}>
                            🔄 Refresh
                        </button>
                    </div>

                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Onboarding ID</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Used By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="loading-cell">Loading...</td>
                                    </tr>
                                ) : onboardingIds.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-cell">
                                            No onboarding IDs found. Generate one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    onboardingIds.map((id) => (
                                        <tr key={id._id}>
                                            <td>
                                                <div className="onboarding-code-cell">
                                                    <code className="onboarding-code">{id.onboardingCode}</code>
                                                    {id.status === 'ACTIVE' && (
                                                        <button
                                                            className="btn-icon copy-btn"
                                                            onClick={() => copyToClipboard(id.onboardingCode)}
                                                            title="Copy to clipboard"
                                                        >
                                                            📋
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${getRoleBadgeClass(id.role)}`}>
                                                    {ROLES.find(r => r.value === id.role)?.label || id.role}
                                                </span>
                                            </td>
                                            <td>{id.department?.name || '-'}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(id.status)}`}>
                                                    {id.status}
                                                </span>
                                            </td>
                                            <td>
                                                {new Date(id.createdAt).toLocaleDateString()}
                                                <br />
                                                <small className="text-muted">
                                                    by {id.createdBy?.profile?.firstName || id.createdBy?.username}
                                                </small>
                                            </td>
                                            <td>
                                                {id.usedBy ? (
                                                    <div>
                                                        {id.usedBy.profile?.firstName} {id.usedBy.profile?.lastName}
                                                        <br />
                                                        <small className="text-muted">{id.usedBy.email}</small>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="actions-cell">
                                                {id.status === 'ACTIVE' && (
                                                    <button
                                                        className="btn-icon danger"
                                                        title="Revoke"
                                                        onClick={() => setShowRevokeModal(id._id)}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Pending Approvals Tab */}
            {activeTab === 'pending-approvals' && (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Signed Up</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="loading-cell">Loading...</td>
                                </tr>
                            ) : pendingUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-cell">
                                        No pending approvals. All staff have been reviewed.
                                    </td>
                                </tr>
                            ) : (
                                pendingUsers.map((user) => (
                                    <tr key={user._id}>
                                        <td className="user-cell">
                                            <span className="user-avatar">
                                                {user.profile?.firstName?.[0] || user.username[0]}
                                            </span>
                                            <div>
                                                <span>{user.profile?.firstName} {user.profile?.lastName}</span>
                                                <br />
                                                <small className="text-muted">@{user.username}</small>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                                {ROLES.find(r => r.value === user.role)?.label || user.role}
                                            </span>
                                        </td>
                                        <td>{user.department?.name || '-'}</td>
                                        <td>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                            <br />
                                            <small className="text-muted">
                                                {new Date(user.createdAt).toLocaleTimeString()}
                                            </small>
                                        </td>
                                        <td className="actions-cell approval-actions">
                                            <button
                                                className="btn-approve"
                                                onClick={() => handleApprove(user._id)}
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                className="btn-reject"
                                                onClick={() => setShowRejectModal(user._id)}
                                            >
                                                ✕ Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🔑 Generate Onboarding ID</h2>
                            <button className="modal-close" onClick={() => setShowGenerateModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {generatedId ? (
                                <div className="generated-id-display">
                                    <div className="success-icon">✓</div>
                                    <h3>Onboarding ID Generated!</h3>
                                    <div className="generated-code-box">
                                        <code>{generatedId.onboardingCode}</code>
                                        <button
                                            className="btn-copy"
                                            onClick={() => copyToClipboard(generatedId.onboardingCode)}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                    <p className="generated-info">
                                        Role: <strong>{ROLES.find(r => r.value === generatedId.role)?.label}</strong>
                                    </p>
                                    <p className="warning-text">
                                        ⚠️ Share this ID securely with the new staff member.
                                    </p>
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            setGeneratedId(null);
                                            setShowGenerateModal(false);
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                                    <div className="form-group">
                                        <label>Role *</label>
                                        <select
                                            value={generateForm.role}
                                            onChange={(e) => setGenerateForm({ ...generateForm, role: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Role</option>
                                            {ROLES.map(role => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Department (Optional)</label>
                                        <select
                                            value={generateForm.department}
                                            onChange={(e) => setGenerateForm({ ...generateForm, department: e.target.value })}
                                        >
                                            <option value="">No Department</option>
                                            {departments.map(dept => (
                                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {(generateForm.role === 'nurse' || generateForm.role === 'head_nurse') && (
                                        <div className="form-group">
                                            <label>Ward (Optional)</label>
                                            <select
                                                value={generateForm.ward}
                                                onChange={(e) => setGenerateForm({ ...generateForm, ward: e.target.value })}
                                            >
                                                <option value="">No Ward</option>
                                                {wards.map(ward => (
                                                    <option key={ward._id} value={ward._id}>{ward.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Expiry Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={generateForm.expiresAt}
                                            onChange={(e) => setGenerateForm({ ...generateForm, expiresAt: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Notes (Optional)</label>
                                        <textarea
                                            value={generateForm.notes}
                                            onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                                            placeholder="e.g., New hire for cardiology dept"
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn-secondary" onClick={() => setShowGenerateModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary">
                                            Generate ID
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Generate Modal */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📦 Bulk Generate Onboarding IDs</h2>
                            <button className="modal-close" onClick={() => setShowBulkModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => { e.preventDefault(); handleBulkGenerate(); }}>
                                <div className="form-group">
                                    <label>Role *</label>
                                    <select
                                        value={bulkForm.role}
                                        onChange={(e) => setBulkForm({ ...bulkForm, role: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Role</option>
                                        {ROLES.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Count *</label>
                                    <input
                                        type="number"
                                        value={bulkForm.count}
                                        onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) || 1 })}
                                        min="1"
                                        max="50"
                                        required
                                    />
                                    <small className="form-hint">Maximum 50 IDs per batch</small>
                                </div>
                                <div className="form-group">
                                    <label>Department (Optional)</label>
                                    <select
                                        value={bulkForm.department}
                                        onChange={(e) => setBulkForm({ ...bulkForm, department: e.target.value })}
                                    >
                                        <option value="">No Department</option>
                                        {departments.map(dept => (
                                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={bulkForm.expiresAt}
                                        onChange={(e) => setBulkForm({ ...bulkForm, expiresAt: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowBulkModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Generate {bulkForm.count} IDs
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Modal */}
            {showRevokeModal && (
                <div className="modal-overlay" onClick={() => setShowRevokeModal(null)}>
                    <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚠️ Revoke Onboarding ID</h2>
                            <button className="modal-close" onClick={() => setShowRevokeModal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>This onboarding ID will no longer be usable for signup.</p>
                            <div className="form-group">
                                <label>Reason for Revocation *</label>
                                <textarea
                                    value={revokeReason}
                                    onChange={(e) => setRevokeReason(e.target.value)}
                                    placeholder="e.g., Offer withdrawn, duplicate ID"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setShowRevokeModal(null)}>
                                    Cancel
                                </button>
                                <button className="btn-danger" onClick={handleRevoke}>
                                    Revoke ID
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
                    <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚠️ Reject User</h2>
                            <button className="modal-close" onClick={() => setShowRejectModal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>This will deactivate the user's account and prevent them from accessing the system.</p>
                            <div className="form-group">
                                <label>Reason for Rejection *</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g., Failed background check, incorrect information"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setShowRejectModal(null)}>
                                    Cancel
                                </button>
                                <button className="btn-danger" onClick={handleReject}>
                                    Reject User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffOnboarding;
