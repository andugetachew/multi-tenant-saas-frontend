import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const exportProjects = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/projects/export/projects/csv/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'projects.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const exportTasks = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/projects/export/tasks/csv/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'tasks.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h1>SaaS Platform</h1>
                <div className="nav-links">
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/projects">Projects</Link>
                    <Link to="/profile">Profile</Link>
                    <Link to="/settings">Settings</Link>
                    <Link to="/analytics">Analytics</Link>
                </div>
                <div className="nav-right">
                    <NotificationBell />
                    <button onClick={toggleDarkMode} className="theme-toggle">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <span className="user-email">{user?.email}</span>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-section">
                    <h2>Welcome back, {user?.first_name || user?.email}!</h2>
                    <p>{stats?.organization_name}</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>{stats?.total_projects || 0}</h3>
                        <p>Total Projects</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats?.total_tasks || 0}</h3>
                        <p>Total Tasks</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats?.completed_tasks || 0}</h3>
                        <p>Completed Tasks</p>
                    </div>
                    <div className="stat-card">
                        <h3>{stats?.total_users || 0}</h3>
                        <p>Team Members</p>
                    </div>
                </div>

                <div className="plan-section">
                    <div>
                        <h3>Current Plan: <span className="plan-name">{stats?.organization_plan?.toUpperCase()}</span></h3>
                    </div>
                    {stats?.is_owner && (
                        <Link to="/settings" className="owner-badge">
                            ⚙️ Organization Owner
                        </Link>
                    )}
                </div>

                <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons">
                        <Link to="/projects" className="action-btn">View All Projects</Link>
                        <Link to="/projects" className="action-btn primary">Create New Project</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;