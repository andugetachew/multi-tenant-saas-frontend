import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Analytics.css';

const Analytics = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('week');

    const fetchAnalytics = useCallback(async () => {
        try {
            const response = await api.get(`/analytics/dashboard/?period=${period}`);
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const exportProjectsCSV = async () => {
        try {
            const response = await api.get('/projects/export/projects/csv/', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
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

    const exportTasksCSV = async () => {
        try {
            const response = await api.get('/projects/export/tasks/csv/', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
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

    const exportProjectsPDF = async () => {
        try {
            const response = await api.get('/projects/export/projects/pdf/', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'projects.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const downloadAdvancedReport = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/reports/advanced/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'advanced_report.json');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download advanced report');
        }
    };

    const downloadComprehensiveReport = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/reports/comprehensive/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'comprehensive_report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download comprehensive report');
        }
    };

    if (loading) return <div className="loading">Loading analytics...</div>;

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
                <div className="period-selector">
                    <button onClick={() => setPeriod('week')} className={period === 'week' ? 'active' : ''}>Week</button>
                    <button onClick={() => setPeriod('month')} className={period === 'month' ? 'active' : ''}>Month</button>
                    <button onClick={() => setPeriod('year')} className={period === 'year' ? 'active' : ''}>Year</button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>{analytics?.total_projects || 0}</h3>
                    <p>Total Projects</p>
                    <span className={`trend ${analytics?.projects_trend >= 0 ? 'positive' : 'negative'}`}>
                        {analytics?.projects_trend || 0}% from last {period}
                    </span>
                </div>
                <div className="stat-card">
                    <h3>{analytics?.total_tasks || 0}</h3>
                    <p>Total Tasks</p>
                    <span className={`trend ${analytics?.tasks_trend >= 0 ? 'positive' : 'negative'}`}>
                        {analytics?.tasks_trend || 0}% from last {period}
                    </span>
                </div>
                <div className="stat-card">
                    <h3>{analytics?.completion_rate || 0}%</h3>
                    <p>Completion Rate</p>
                </div>
                <div className="stat-card">
                    <h3>{analytics?.active_users || 0}</h3>
                    <p>Active Users</p>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-card">
                    <h3>Project Activity</h3>
                    <div className="chart-bars">
                        {analytics?.daily_activity?.map((day, index) => (
                            <div key={index} className="bar-container">
                                <div className="bar" style={{ height: `${Math.min(day.count * 20, 150)}px` }}></div>
                                <span className="bar-label">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Task Status Distribution</h3>
                    <div className="pie-chart">
                        <div className="pie-segment pending" style={{ width: `${analytics?.pending_percent || 0}%` }}>
                            Pending
                        </div>
                        <div className="pie-segment progress" style={{ width: `${analytics?.progress_percent || 0}%` }}>
                            In Progress
                        </div>
                        <div className="pie-segment completed" style={{ width: `${analytics?.completed_percent || 0}%` }}>
                            Completed
                        </div>
                    </div>
                    <div className="pie-legend">
                        <span><span className="dot pending-dot"></span> Pending: {analytics?.pending_percent || 0}%</span>
                        <span><span className="dot progress-dot"></span> In Progress: {analytics?.progress_percent || 0}%</span>
                        <span><span className="dot completed-dot"></span> Completed: {analytics?.completed_percent || 0}%</span>
                    </div>
                </div>
            </div>

            <div className="export-section">
                <h3>Export Data</h3>
                <div className="export-buttons">
                    <button onClick={exportProjectsCSV} className="btn-secondary">📊 Export Projects CSV</button>
                    <button onClick={exportTasksCSV} className="btn-secondary">✅ Export Tasks CSV</button>
                    <button onClick={exportProjectsPDF} className="btn-secondary">📄 Export PDF</button>
                </div>
            </div>

            <div className="reports-section">
                <h3>Reports</h3>
                <div className="report-buttons">
                    <button onClick={downloadAdvancedReport} className="btn-primary">
                        📈 Advanced Report
                    </button>
                    <button onClick={downloadComprehensiveReport} className="btn-primary">
                        📊 Comprehensive Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Analytics;