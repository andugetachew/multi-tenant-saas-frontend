import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './Tasks.css';

const Tasks = () => {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
    });

    useEffect(() => {
        fetchTasks();
        if (projectId) fetchProject();
    }, [projectId]);

    const fetchTasks = async () => {
        try {
            const url = projectId
                ? `/projects/tasks/?project_id=${projectId}`
                : '/projects/tasks/';
            const response = await api.get(url);
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProject = async () => {
        try {
            const response = await api.get(`/projects/${projectId}/`);
            setProject(response.data);
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await api.put(`/projects/tasks/${editingTask.id}/`, formData);
            } else {
                await api.post('/projects/tasks/', { ...formData, project: projectId });
            }
            setShowModal(false);
            setEditingTask(null);
            setFormData({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' });
            fetchTasks();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) {
            try {
                await api.delete(`/projects/tasks/${id}/`);
                fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/projects/tasks/${id}/`, { status: newStatus });
            fetchTasks();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getPriorityClass = (priority) => {
        return {
            high: 'priority-high',
            medium: 'priority-medium',
            low: 'priority-low',
        }[priority];
    };

    const getStatusClass = (status) => {
        return {
            pending: 'status-pending',
            in_progress: 'status-progress',
            completed: 'status-completed',
        }[status];
    };

    if (loading) return <div className="loading">Loading tasks...</div>;

    return (
        <div className="tasks-container">
            <div className="tasks-header">
                <div>
                    <Link to="/projects" className="back-link">← Back to Projects</Link>
                    <h1>{project ? `Tasks for ${project.name}` : 'All Tasks'}</h1>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    + New Task
                </button>
            </div>

            <div className="tasks-board">
                {['pending', 'in_progress', 'completed'].map((status) => (
                    <div key={status} className="task-column">
                        <div className="column-header">
                            <h3>{status.replace('_', ' ').toUpperCase()}</h3>
                            <span className="task-count">{tasks.filter(t => t.status === status).length}</span>
                        </div>
                        <div className="task-list">
                            {tasks.filter(task => task.status === status).map((task) => (
                                <div key={task.id} className="task-card">
                                    <div className="task-header">
                                        <h4>{task.title}</h4>
                                        <div className="task-actions">
                                            <button className="icon-btn edit" onClick={() => handleEdit(task)}>✏️</button>
                                            <button className="icon-btn delete" onClick={() => handleDelete(task.id)}>🗑️</button>
                                        </div>
                                    </div>
                                    {task.description && <p className="task-desc">{task.description}</p>}
                                    <div className="task-meta">
                                        <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <select
                                            value={task.status}
                                            onChange={(e) => updateStatus(task.id, e.target.value)}
                                            className={`status-select ${getStatusClass(task.status)}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                    {task.due_date && (
                                        <div className="task-due">
                                            📅 Due: {new Date(task.due_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {tasks.filter(task => task.status === status).length === 0 && (
                                <div className="empty-column">No tasks</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{editingTask ? 'Edit Task' : 'New Task'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
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
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingTask ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;