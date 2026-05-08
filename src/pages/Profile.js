import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await api.put('/auth/profile/', formData);
            setMessage('Profile updated successfully!');
            // Update local user data
            localStorage.setItem('user', JSON.stringify(response.data));
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error updating profile');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>Profile Settings</h1>
            </div>

            {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

            <div className="profile-card">
                <div className="profile-avatar">
                    <div className="avatar-placeholder">
                        {formData.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled
                        />
                        <p className="field-note">Email cannot be changed</p>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                <div className="danger-zone">
                    <h3>Danger Zone</h3>
                    <button onClick={logout} className="btn-danger">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;