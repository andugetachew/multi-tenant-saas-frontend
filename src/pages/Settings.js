import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Settings.css';

const Settings = () => {
    const { user } = useAuth();
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        plan: '',
    });

    useEffect(() => {
        fetchOrganization();
    }, []);

    const fetchOrganization = async () => {
        try {
            const response = await api.get('/organizations/');
            setOrganization(response.data);
            setFormData({
                name: response.data.name,
                plan: response.data.plan,
            });
        } catch (error) {
            console.error('Error fetching organization:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/organizations/', formData);
            setOrganization(response.data);
            alert('Organization updated successfully!');
        } catch (error) {
            console.error('Error updating organization:', error);
            alert('Error updating organization');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/organizations/invite/', {
                email: inviteEmail
            });
            console.log('Success:', response.data);
            setInviteMessage(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setTimeout(() => setInviteMessage(''), 3000);
            setShowInviteModal(false);
        } catch (error) {
            console.error('Error details:', error.response?.data);
            // Show the actual error from backend
            const errorMsg = error.response?.data?.email?.[0] ||
                error.response?.data?.error ||
                'Error sending invitation';
            setInviteMessage(errorMsg);
            setTimeout(() => setInviteMessage(''), 3000);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Settings</h1>
            </div>

            <div className="settings-section">
                <h2>Organization Settings</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Organization Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Current Plan</label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            disabled={!user?.is_owner}
                        >
                            <option value="trial">Trial</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Professional</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                        {!user?.is_owner && (
                            <p className="disabled-note">Only organization owner can change plan</p>
                        )}
                    </div>
                    <button type="submit" className="btn-primary" disabled={!user?.is_owner}>
                        Save Changes
                    </button>
                </form>
            </div>

            <div className="settings-section">
                <h2>Team Members</h2>
                <p>Invite team members to your organization</p>
                <button className="btn-secondary" onClick={() => setShowInviteModal(true)}>
                    + Invite User
                </button>
            </div>

            {inviteMessage && (
                <div className="invite-message">{inviteMessage}</div>
            )}

            {showInviteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Invite Team Member</h2>
                        <form onSubmit={handleInvite}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                    placeholder="teammate@example.com"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;