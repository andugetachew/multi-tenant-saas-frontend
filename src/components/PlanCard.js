import React, { useState } from 'react';
import api from '../services/api';

const PlanCard = ({ plan, currentPlan, onUpgrade }) => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [billingEmail, setBillingEmail] = useState('');
    const [billingAddress, setBillingAddress] = useState('');

    const isCurrentPlan = currentPlan?.plan_slug === plan.slug;

    const handleRequestUpgrade = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/billing/upgrade/request/', {
                plan_slug: plan.slug,
                billing_email: billingEmail,
                billing_address: billingAddress,
            });
            alert('Upgrade request submitted! Admin will review and approve.');
            setShowModal(false);
            if (onUpgrade) onUpgrade();
        } catch (error) {
            alert(error.response?.data?.error || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={`plan-card ${isCurrentPlan ? 'current-plan' : ''}`}>
                <h3>{plan.name}</h3>
                <div className="plan-price">
                    ${plan.price_monthly}<span>/month</span>
                </div>
                <ul className="plan-features">
                    <li>{plan.max_projects === -1 ? 'Unlimited' : plan.max_projects} Projects</li>
                    <li>{plan.max_users === -1 ? 'Unlimited' : plan.max_users} Team Members</li>
                    <li>{plan.max_storage_mb}MB Storage</li>
                    <li>{plan.has_real_time_analytics ? '✅' : '❌'} Real-time Analytics</li>
                    <li>{plan.has_advanced_exports ? '✅' : '❌'} Advanced Exports</li>
                    <li>{plan.has_priority_support ? '✅' : '❌'} Priority Support</li>
                    <li>{plan.has_api_access ? '✅' : '❌'} API Access</li>
                    <li>{plan.has_audit_logs ? '✅' : '❌'} Audit Logs</li>
                </ul>
                {isCurrentPlan ? (
                    <button className="btn-current" disabled>Current Plan</button>
                ) : (
                    <button className="btn-upgrade" onClick={() => setShowModal(true)}>
                        Upgrade to {plan.name}
                    </button>
                )}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Request {plan.name} Upgrade</h2>
                        <form onSubmit={handleRequestUpgrade}>
                            <div className="form-group">
                                <label>Billing Email</label>
                                <input
                                    type="email"
                                    value={billingEmail}
                                    onChange={(e) => setBillingEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Billing Address</label>
                                <textarea
                                    value={billingAddress}
                                    onChange={(e) => setBillingAddress(e.target.value)}
                                    rows="3"
                                    required
                                />
                            </div>
                            <p className="upgrade-note">
                                Your request will be reviewed by admin. You'll receive a notification once approved.
                            </p>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default PlanCard;