import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import CommentSection from '../components/CommentSection';
import FileUpload from '../components/FileUpload';
import webSocketService from '../services/websocket';
import './ProjectDetail.css';

const ProjectDetail = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
    });
    // ✅ Removed unused 'token' variable

    // Wrap fetchProject in useCallback
    const fetchProject = useCallback(async () => {
        try {
            const response = await api.get(`/projects/${projectId}/`);
            setProject(response.data);
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    }, [projectId]);

    // Wrap fetchTasks in useCallback
    const fetchTasks = useCallback(async () => {
        try {
            const response = await api.get(`/projects/tasks/?project_id=${projectId}`);
            const tasksData = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setTasks(tasksData);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);
    //const token = localStorage.getItem('access_token');

    // Now useEffect has proper dependencies
    useEffect(() => {
        fetchProject();
        fetchTasks();

        // Connect WebSocket for live task updates
        webSocketService.connectTasks(projectId, (updatedTask) => {
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === updatedTask.id ? { ...task, status: updatedTask.status } : task
                )
            );
        });

        return () => {
            webSocketService.disconnect(`tasks_${projectId}`);
        };
    }, [projectId, fetchProject, fetchTasks]); // ✅ Added missing dependencies

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await api.put(`/projects/tasks/${editingTask.id}/`, formData);
            } else {
                await api.post('/projects/tasks/', { ...formData, project: projectId });
            }
            setShowTaskModal(false);
            setEditingTask(null);
            setFormData({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' });
            fetchTasks();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
        });
        setShowTaskModal(true);
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Delete this task?')) {
            try {
                await api.delete(`/projects/tasks/${id}/`);
                fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const updateTaskStatus = async (id, newStatus) => {
        try {
            await api.patch(`/projects/tasks/${id}/`, { status: newStatus });
            webSocketService.sendTaskUpdate(projectId, id, newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getPriorityClass = (priority) => {
        const classes = {
            high: 'priority-high',
            medium: 'priority-medium',
            low: 'priority-low',
        };
        return classes[priority];
    };

    const getStatusClass = (status) => {
        const classes = {
            pending: 'status-pending',
            in_progress: 'status-progress',
            completed: 'status-completed',
        };
        return classes[status];
    };

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
            alert('Authentication failed. Please login again.');
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
            alert('Authentication failed. Please login again.');
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
            alert('Authentication failed. Please login again.');
        }
    };



    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="project-detail-container">
            <div className="project-detail-header">
                <Link to="/projects" className="back-link">← Back to Projects</Link>
                <h1>{project?.name}</h1>
                <p className="project-description">{project?.description || 'No description'}</p>
                <div className="project-meta-info">
                    <span className={`status-badge ${project?.status}`}>{project?.status}</span>
                    <span className="task-count-badge">{tasks.length} Tasks</span>
                    {project?.tags && (
                        <div className="project-tags">
                            {project.tags.split(',').map((tag, i) => (
                                <span key={i} className="tag">{tag.trim()}</span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="export-buttons">
                    <button onClick={exportProjectsCSV} className="btn-secondary">
                        📊 Export Projects CSV
                    </button>
                    <button onClick={exportTasksCSV} className="btn-secondary">
                        ✅ Export Tasks CSV
                    </button>
                    <button onClick={exportProjectsPDF} className="btn-secondary">
                        📄 Export PDF
                    </button>
                </div>
            </div>

            <div className="tasks-section">
                <div className="tasks-header">
                    <h2>📋 Tasks</h2>
                    <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
                        + New Task
                    </button>
                </div>

                <div className="tasks-board">
                    {['pending', 'in_progress', 'completed'].map((status) => (
                        <div key={status} className="task-column">
                            <div className="column-header">
                                <h3>
                                    {status === 'pending' && '⏳ Pending'}
                                    {status === 'in_progress' && '🔄 In Progress'}
                                    {status === 'completed' && '✅ Completed'}
                                </h3>
                                <span className="task-count">{tasks.filter(t => t.status === status).length}</span>
                            </div>
                            <div className="task-list">
                                {tasks.filter(task => task.status === status).map((task) => (
                                    <div key={task.id} className="task-card">
                                        <div className="task-header">
                                            <h4>{task.title}</h4>
                                            <div className="task-actions">
                                                <button className="icon-btn edit" onClick={() => handleEditTask(task)}>✏️</button>
                                                <button className="icon-btn delete" onClick={() => handleDeleteTask(task.id)}>🗑️</button>
                                            </div>
                                        </div>
                                        {task.description && <p className="task-desc">{task.description}</p>}
                                        <div className="task-meta">
                                            <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                                                {task.priority === 'high' && '🔴 High'}
                                                {task.priority === 'medium' && '🟡 Medium'}
                                                {task.priority === 'low' && '🟢 Low'}
                                            </span>
                                            <select
                                                value={task.status}
                                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                className={`status-select ${getStatusClass(task.status)}`}
                                            >
                                                <option value="pending">⏳ Pending</option>
                                                <option value="in_progress">🔄 In Progress</option>
                                                <option value="completed">✅ Completed</option>
                                            </select>
                                        </div>
                                        {task.due_date && (
                                            <div className="task-due">
                                                📅 Due: {new Date(task.due_date).toLocaleDateString()}
                                            </div>
                                        )}
                                        {task.assigned_to && (
                                            <div className="task-assigned">
                                                👤 Assigned to: {task.assigned_to_email || 'Unassigned'}
                                            </div>
                                        )}
                                        <FileUpload taskId={task.id} onUploadComplete={fetchTasks} />
                                    </div>
                                ))}
                                {tasks.filter(task => task.status === status).length === 0 && (
                                    <div className="empty-column">
                                        <span>📭</span>
                                        <p>No tasks</p>
                                        <small>Click + New Task to create one</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CommentSection projectId={projectId} token={localStorage.getItem('access_token')} />

            {showTaskModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingTask ? '✏️ Edit Task' : '➕ New Task'}</h2>
                            <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleTaskSubmit}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter task title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter task description (optional)"
                                    rows="3"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">⏳ Pending</option>
                                        <option value="in_progress">🔄 In Progress</option>
                                        <option value="completed">✅ Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingTask ? 'Update Task' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;