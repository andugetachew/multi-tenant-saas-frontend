import React, {
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react';

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CommentSection from '../components/CommentSection';

import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    const [recentActivities, setRecentActivities] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);

    // COMMENTS
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // Prevent duplicate websocket connections
    const socketRef = useRef(null);

    // FETCH DASHBOARD DATA
    const fetchDashboardData = useCallback(async () => {
        try {
            const [
                statsRes,
                projectsRes,
                activityRes,
                subRes
            ] = await Promise.all([
                api
                    .get('/projects/dashboard/stats/')
                    .catch(() => ({ data: null })),

                api
                    .get('/projects/?limit=5')
                    .catch(() => ({
                        data: { results: [] }
                    })),

                api
                    .get('/activity-feed/?limit=5')
                    .catch(() => ({
                        data: { activities: [] }
                    })),

                api
                    .get('/billing/subscription/')
                    .catch(() => ({ data: null }))
            ]);

            // STATS
            setStats(statsRes.data);

            // PROJECTS
            const projects =
                projectsRes.data?.results || [];

            setRecentProjects(projects);

            // AUTO SELECT FIRST PROJECT
            if (
                projects.length > 0 &&
                !selectedProjectId
            ) {
                setSelectedProjectId(projects[0].id);
            }

            // ACTIVITIES
            setRecentActivities(
                activityRes.data?.activities || []
            );

            // SUBSCRIPTION
            if (subRes.data) {
                setSubscription(subRes.data);
            } else {
                setSubscription({
                    plan_name: 'Free',
                    plan_slug: 'free',
                    max_projects: 3,
                    has_advanced_exports: false
                });
            }

        } catch (error) {
            console.error(
                'Dashboard fetch error:',
                error
            );
        } finally {
            setLoading(false);
        }
    }, [selectedProjectId]);

    // INITIAL LOAD
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // WEBSOCKET CONNECTION
    useEffect(() => {
        if (!user) return;

        const token =
            localStorage.getItem('access_token');

        if (!token) {
            console.warn('No access token found');
            return;
        }

        // CLOSE OLD SOCKET
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        const wsUrl =
            `ws://localhost:8001/ws/notifications/?token=${token}`;

        const socket = new WebSocket(wsUrl);

        socketRef.current = socket;

        socket.onopen = () => {
            console.log(
                '✅ Dashboard WebSocket connected'
            );
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                console.log(
                    'Dashboard WS Message:',
                    data
                );

                if (
                    data.type ===
                    'dashboard_update'
                ) {
                    fetchDashboardData();

                    if (
                        Notification.permission ===
                        'granted'
                    ) {
                        new Notification(
                            data.title ||
                            'Dashboard Update',
                            {
                                body:
                                    data.message ||
                                    'New update available'
                            }
                        );
                    }
                }
            } catch (error) {
                console.error(
                    'WebSocket message error:',
                    error
                );
            }
        };

        socket.onerror = (error) => {
            console.error(
                '❌ Dashboard WebSocket error:',
                error
            );
        };

        socket.onclose = (event) => {
            console.log(
                '⚠️ Dashboard socket closed:',
                event.code
            );
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [user, fetchDashboardData]);

    // EXPORT CSV
    const exportProjects = async () => {
        if (
            subscription?.plan_name !== 'Pro' &&
            subscription?.plan_name !== 'Enterprise'
        ) {
            alert(
                'Upgrade to Pro or Enterprise for CSV exports.'
            );
            return;
        }

        try {
            const res = await api.get(
                '/projects/export/projects/csv/',
                {
                    responseType: 'blob'
                }
            );

            const url =
                window.URL.createObjectURL(
                    new Blob([res.data])
                );

            const a =
                document.createElement('a');

            a.href = url;
            a.download = 'projects.csv';

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error(
                'Export failed:',
                error
            );
        }
    };

    // LOADING
    if (loading) {
        return (
            <>
                <Navbar />

                <div className="loading-spinner">
                    Loading dashboard...
                </div>
            </>
        );
    }

    const hasProjects =
        recentProjects.length > 0;

    const progressPercent =
        stats?.total_tasks
            ? Math.round(
                (
                    stats.completed_tasks /
                    stats.total_tasks
                ) * 100
            )
            : 0;

    return (
        <>
            <Navbar />

            <div className="dashboard-container">

                {/* WELCOME HEADER */}
                <div className="welcome-header">

                    <div>
                        <h1>
                            Welcome back,
                            {' '}
                            {user?.first_name ||
                                user?.email}
                            !
                        </h1>

                        <p>
                            {stats?.organization_name ||
                                'Your workspace'}
                        </p>
                    </div>

                    {/* FREE */}
                    {subscription?.plan_slug ===
                        'free' && (
                            <div
                                className="plan-badge free-badge"
                                title="Free plan - Upgrade to unlock more features"
                            >
                                🔒
                                {' '}
                                {subscription?.plan_name ||
                                    'Free'}
                                {' '}
                                Plan
                            </div>
                        )}

                    {/* PRO */}
                    {subscription?.plan_slug ===
                        'pro' && (
                            <Link
                                to="/billing"
                                className="plan-badge pro-badge"
                            >
                                ✨
                                {' '}
                                {subscription?.plan_name}
                                {' '}
                                Plan
                                {' '}
                                <span className="upgrade-hint">
                                    →
                                </span>
                            </Link>
                        )}

                    {/* ENTERPRISE */}
                    {subscription?.plan_slug ===
                        'enterprise' && (
                            <Link
                                to="/billing"
                                className="plan-badge enterprise-badge"
                            >
                                🏢
                                {' '}
                                {subscription?.plan_name}
                                {' '}
                                Plan
                                {' '}
                                <span className="upgrade-hint">
                                    Manage →
                                </span>
                            </Link>
                        )}
                </div>

                {/* STATS */}
                <div className="stats-grid">

                    <div className="stat-card">
                        <span className="stat-icon">
                            📁
                        </span>

                        <div>
                            <h3>
                                {stats?.total_projects ||
                                    0}
                            </h3>

                            <p>Projects</p>

                            {stats?.total_projects >=
                                subscription?.max_projects && (
                                    <small className="warning">
                                        Limit reached
                                    </small>
                                )}
                        </div>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">
                            ✅
                        </span>

                        <div>
                            <h3>
                                {stats?.total_tasks ||
                                    0}
                            </h3>

                            <p>Total Tasks</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">
                            🎯
                        </span>

                        <div>
                            <h3>
                                {stats?.completed_tasks ||
                                    0}
                            </h3>

                            <p>Completed</p>

                            <small>
                                {progressPercent}
                                % done
                            </small>
                        </div>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">
                            👥
                        </span>

                        <div>
                            <h3>
                                {stats?.total_users ||
                                    1}
                            </h3>

                            <p>Team Members</p>
                        </div>
                    </div>
                </div>

                {/* PROGRESS */}
                <div className="progress-section">

                    <div className="progress-label">
                        <span>
                            Overall Progress
                        </span>

                        <span>
                            {progressPercent}%
                        </span>
                    </div>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width:
                                    `${progressPercent}%`
                            }}
                        ></div>
                    </div>
                </div>

                {/* TWO COLUMN */}
                <div className="two-columns">

                    {/* PROJECTS */}
                    <div className="card">

                        <div className="card-header">
                            <h3>
                                📁 Recent Projects
                            </h3>

                            <Link to="/projects">
                                View all →
                            </Link>
                        </div>

                        {hasProjects ? (
                            recentProjects.map(
                                (proj) => (
                                    <div
                                        key={proj.id}
                                        className={`list-item ${selectedProjectId ===
                                            proj.id
                                            ? 'selected-project'
                                            : ''
                                            }`}
                                        onClick={() =>
                                            setSelectedProjectId(
                                                proj.id
                                            )
                                        }
                                    >
                                        <span className="item-icon">
                                            📄
                                        </span>

                                        <div className="item-details">
                                            <strong>
                                                {proj.name}
                                            </strong>

                                            <span className="item-date">
                                                {proj.created_at
                                                    ? new Date(
                                                        proj.created_at
                                                    ).toLocaleDateString()
                                                    : ''}
                                            </span>
                                        </div>

                                        <span
                                            className={`status-badge ${proj.status ||
                                                'active'
                                                }`}
                                        >
                                            {proj.status ||
                                                'active'}
                                        </span>

                                        <Link
                                            to={`/projects/${proj.id}`}
                                            className="open-project-btn"
                                            onClick={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            Open
                                        </Link>
                                    </div>
                                )
                            )
                        ) : (
                            <div className="empty-state">
                                <p>
                                    ✨ No projects yet?
                                </p>

                                <Link
                                    to="/projects/new"
                                    className="btn-primary"
                                >
                                    Create your first
                                    project
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ACTIVITY */}
                    <div className="card">

                        <div className="card-header">
                            <h3>
                                🔄 Recent Activity
                            </h3>
                        </div>

                        {recentActivities.length >
                            0 ? (
                            recentActivities.map(
                                (act, idx) => (
                                    <div
                                        key={idx}
                                        className="activity-item"
                                    >
                                        <span className="activity-icon">
                                            {act.type ===
                                                'project_created' &&
                                                '📁'}

                                            {act.type ===
                                                'task_completed' &&
                                                '✅'}

                                            {act.type ===
                                                'comment' &&
                                                '💬'}

                                            {!act.type &&
                                                '📌'}
                                        </span>

                                        <div className="activity-text">
                                            <p>
                                                {act.title}
                                            </p>

                                            <small>
                                                {act.timestamp
                                                    ? new Date(
                                                        act.timestamp
                                                    ).toLocaleString()
                                                    : ''}
                                            </small>
                                        </div>
                                    </div>
                                )
                            )
                        ) : (
                            <p className="empty-message">
                                No recent activity
                                yet.
                            </p>
                        )}
                    </div>
                </div>

                {/* COMMENTS */}
                {selectedProjectId && (
                    <div className="card comments-card">

                        <div className="card-header">
                            <h3>
                                💬 Project Comments
                            </h3>
                        </div>

                        <CommentSection
                            projectId={
                                selectedProjectId
                            }
                            token={localStorage.getItem(
                                'access_token'
                            )}
                        />
                    </div>
                )}

                {/* QUICK ACTIONS */}
                <div className="quick-actions">

                    <h3>
                        ⚡ Quick Actions
                    </h3>

                    <div className="action-buttons">

                        <Link
                            to="/projects/new"
                            className="btn-primary"
                        >
                            ➕ New Project
                        </Link>

                        <button
                            onClick={exportProjects}
                            className="btn-secondary"
                        >
                            📥 Export Projects
                            (CSV)
                        </button>

                        <Link
                            to="/analytics"
                            className="btn-secondary"
                        >
                            📈 Analytics
                        </Link>
                    </div>
                </div>

                {/* UPGRADE */}
                {subscription?.plan_slug ===
                    'free' && (
                        <div className="upgrade-banner">

                            <div>
                                <strong>
                                    🚀 Upgrade to Pro
                                </strong>

                                <p>
                                    Unlimited projects,
                                    real-time analytics,
                                    CSV exports, and more.
                                </p>
                            </div>

                            <Link
                                to="/billing"
                                className="btn-upgrade"
                            >
                                View Plans
                            </Link>
                        </div>
                    )}

            </div>
        </>
    );
};

export default Dashboard;