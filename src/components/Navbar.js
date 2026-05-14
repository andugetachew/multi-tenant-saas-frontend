import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav style={{ background: '#333', padding: '10px', color: 'white' }}>
            <h1 style={{ display: 'inline', marginRight: '20px' }}>SaaS Platform</h1>
            <Link to="/dashboard" style={{ color: 'white', marginRight: '10px' }}>Dashboard</Link>
            <Link to="/projects" style={{ color: 'white', marginRight: '10px' }}>Projects</Link>
            <Link to="/analytics" style={{ color: 'white', marginRight: '10px' }}>Analytics</Link>
            <Link to="/profile" style={{ color: 'white', marginRight: '10px' }}>Profile</Link>
            <Link to="/settings" style={{ color: 'white', marginRight: '10px' }}>Settings</Link>
            <Link to="/billing" style={{ color: 'white', marginRight: '10px' }}>Billing</Link>
            <span style={{ float: 'right' }}>
                {user?.email} | <button onClick={logout}>Logout</button>
            </span>
        </nav>
    );
};

export default Navbar;