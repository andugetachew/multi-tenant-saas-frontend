import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import webSocketService from '../services/websocket';
import './CommentSection.css';

const CommentSection = ({ projectId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [typing, setTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const commentsEndRef = useRef(null);

    useEffect(() => {
        fetchComments();

        // Connect WebSocket for real-time comments
        webSocketService.connectComments(projectId, (newCommentData) => {
            setComments(prev => [...prev, {
                ...newCommentData,
                created_at: new Date().toISOString()
            }]);
            scrollToBottom();
        });

        return () => {
            webSocketService.disconnect(`comments_${projectId}`);
        };
    }, [projectId]);

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchComments = async () => {
        try {
            const response = await api.get(`/comments/?project_id=${projectId}`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTyping = () => {
        if (!typing) {
            setTyping(true);
            // Emit typing event via WebSocket
            const ws = webSocketService.sockets[`comments_${projectId}`];
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'typing',
                    user: user?.email
                }));
            }
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
            // Emit stopped typing event
            const ws = webSocketService.sockets[`comments_${projectId}`];
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'stop_typing',
                    user: user?.email
                }));
            }
        }, 1000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const response = await api.post('/comments/', {
                project: projectId,
                content: newComment,
            });

            // The WebSocket will broadcast the new comment to all users
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="comments-loading">
                <div className="loading-spinner"></div>
                <p>Loading comments...</p>
            </div>
        );
    }

    return (
        <div className="comment-section">
            <div className="comment-header">
                <h3>
                    💬 Comments
                    <span className="comment-count">({comments.length})</span>
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="comment-form">
                <div className="comment-input-wrapper">
                    <img
                        src={`https://ui-avatars.com/api/?name=${user?.first_name || user?.email}&background=667eea&color=fff`}
                        alt="Avatar"
                        className="comment-avatar"
                    />
                    <textarea
                        value={newComment}
                        onChange={(e) => {
                            setNewComment(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Write a comment... (Press Enter to send, Shift+Enter for new line)"
                        rows="3"
                        disabled={submitting}
                    />
                </div>
                <div className="comment-form-actions">
                    {typing && (
                        <span className="typing-indicator">Typing...</span>
                    )}
                    <button type="submit" className="btn-primary" disabled={submitting || !newComment.trim()}>
                        {submitting ? 'Sending...' : 'Post Comment'}
                    </button>
                </div>
            </form>

            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="no-comments">
                        <div className="no-comments-icon">💬</div>
                        <h4>No comments yet</h4>
                        <p>Be the first to comment on this project!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-card">
                            <div className="comment-avatar-wrapper">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${comment.user_email}&background=667eea&color=fff`}
                                    alt={comment.user_email}
                                    className="comment-avatar-small"
                                />
                            </div>
                            <div className="comment-body">
                                <div className="comment-header-info">
                                    <strong className="comment-author">{comment.user_email}</strong>
                                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                                </div>
                                <p className="comment-content">{comment.content}</p>
                                <div className="comment-actions">
                                    <button className="comment-action-btn" onClick={() => {/* Reply feature */ }}>
                                        👍 Like
                                    </button>
                                    <button className="comment-action-btn" onClick={() => {/* Reply feature */ }}>
                                        💬 Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>
        </div>
    );
};

export default CommentSection;