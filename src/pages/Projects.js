import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Projects.css';
import { Link } from 'react-router-dom';
const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        tags: '',
    });
    const exportProjects = () => {
        window.open(`${api.defaults.baseURL}/projects/export/projects/pdf/`, '_blank');
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await api.put(`/projects/${editingProject.id}/`, formData);
            } else {
                await api.post('/projects/', formData);
            }
            setShowModal(false);
            setEditingProject(null);
            setFormData({ name: '', description: '', status: 'active', tags: '' });
            fetchProjects();
        } catch (error) {
            console.error('Error saving project:', error);
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || '',
            status: project.status,
            tags: project.tags || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await api.delete(`/projects/${id}/`);
                fetchProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
            }
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="projects-container">
            <div className="projects-header">
                <h1>Projects</h1>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    + New Project
                </button>
            </div>

            <div className="projects-grid">
                {projects.map((project) => (
                    <div key={project.id} className="project-card">
                        <div className="project-header">
                            <h3>{project.name}</h3>
                            <div className="project-actions">
                                <button className="icon-btn edit" onClick={() => handleEdit(project)}>
                                    ✏️
                                </button>
                                <button className="icon-btn delete" onClick={() => handleDelete(project.id)}>
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <p className="project-desc">{project.description || 'No description'}</p>
                        <div className="project-meta">
                            <span className={`status ${project.status}`}>{project.status}</span>
                            <span className="task-count">{project.task_count || 0} tasks</span>
                        </div>
                        <Link to={`/projects/${project.id}`} className="view-tasks-btn">
                            View Details
                        </Link>
                        {project.tags && (
                            <div className="project-tags">
                                {project.tags.split(',').map((tag, i) => (
                                    <span key={i} className="tag">{tag.trim()}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="react, django, api"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingProject ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;