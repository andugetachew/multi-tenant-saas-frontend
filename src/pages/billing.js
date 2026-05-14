import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './billing.css';

const Billing = () => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [billingEmail, setBillingEmail] = useState('');

    useEffect(() => {
        fetchSubscription();
        fetchPlans();
    }, []);

    const fetchSubscription = async () => {
        try {
            const response = await api.get('/billing/subscription/');
            setSubscription(response.data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await api.get('/billing/plans/');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const requestUpgrade = async () => {
        try {
            await api.post('/billing/upgrade/request/', {
                plan_slug: selectedPlan.slug,
                billing_email: billingEmail,
            });
            alert('Upgrade request submitted! Admin will review.');
            setShowUpgradeModal(false);
            fetchSubscription();
        } catch (error) {
            alert(error.response?.data?.error || 'Request failed');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="billing-container">
            <h1>Billing & Subscription</h1>

            <div className="current-plan">
                <h2>Current Plan</h2>
                <div className="plan-card current">
                    <h3>{subscription?.plan_name || 'Free'}</h3>
                    <p className="price">${subscription?.plan?.price_monthly || 0}/month</p>
                    <ul>
                        <li>✅ {subscription?.max_projects || 3} Projects</li>
                        <li>✅ {subscription?.max_users || 5} Team Members</li>
                        <li>{subscription?.has_real_time_analytics ? '✅' : '❌'} Real-time Analytics</li>
                        <li>{subscription?.has_advanced_exports ? '✅' : '❌'} Advanced Exports</li>
                    </ul>
                </div>
            </div>

            <div className="plans-section">
                <h2>Available Plans</h2>
                <div className="plans-grid">
                    {plans.map((plan) => (
                        <div key={plan.id} className="plan-card">
                            <h3>{plan.name}</h3>
                            <p className="price">${plan.price_monthly}/month</p>
                            <ul>
                                <li>{plan.max_projects === -1 ? '∞' : plan.max_projects} Projects</li>
                                <li>{plan.max_users === -1 ? '∞' : plan.max_users} Users</li>
                                <li>{plan.has_real_time_analytics ? '✅' : '❌'} Real-time Analytics</li>
                                <li>{plan.has_advanced_exports ? '✅' : '❌'} Advanced Exports</li>
                                <li>{plan.has_priority_support ? '✅' : '❌'} Priority Support</li>
                            </ul>
                            {subscription?.plan_name === plan.name ? (
                                <button className="btn-current" disabled>Current Plan</button>
                            ) : (
                                <button className="btn-upgrade" onClick={() => {
                                    setSelectedPlan(plan);
                                    setShowUpgradeModal(true);
                                }}>Upgrade</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {showUpgradeModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Upgrade to {selectedPlan?.name}</h2>
                        <p>Price: ${selectedPlan?.price_monthly}/month</p>
                        <div className="form-group">
                            <label>Billing Email</label>
                            <input
                                type="email"
                                value={billingEmail}
                                onChange={(e) => setBillingEmail(e.target.value)}
                                placeholder="Enter billing email"
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setShowUpgradeModal(false)}>Cancel</button>
                            <button onClick={requestUpgrade}>Submit Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;