import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './CommentSection.css';

const API_URL = 'http://localhost:8000/api';

const CommentSection = ({ projectId, token }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReply, setShowReply] = useState({});

    // =========================
    // FETCH COMMENTS
    // =========================
    const fetchComments = useCallback(async () => {
        console.log("Fetching comments:", { projectId, token: !!token });

        if (!projectId || !token) {
            setError("Missing project or login");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(
                `${API_URL}/comments/?project_id=${projectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log("Comments response:", response.data);

            const commentsArray = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];

            setComments(commentsArray);

        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to load comments");
        } finally {
            setLoading(false);
        }
    }, [projectId, token]);

    // =========================
    // INIT LOAD
    // =========================
    useEffect(() => {
        if (projectId && token) {
            fetchComments();
        } else {
            setLoading(false);
            setError("Please login to view comments");
        }
    }, [projectId, token, fetchComments]);

    // =========================
    // POST COMMENT
    // =========================
    const handleSubmitComment = async (e) => {
        e.preventDefault();

        if (!newComment.trim()) return;
        if (!token) {
            setError("You must be logged in to comment");
            return;
        }

        try {
            await axios.post(
                `${API_URL}/comments/`,
                {
                    project: parseInt(projectId),
                    content: newComment.trim(),
                    parent: null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setNewComment('');
            fetchComments();

        } catch (err) {
            console.error("Post comment error:", err);
            setError("Failed to post comment");
        }
    };

    // =========================
    // COMMENT ITEM (RECURSIVE)
    // =========================
    const CommentItem = ({ comment, depth = 0 }) => {
        const [replyText, setReplyText] = useState('');

        const handleReplySubmit = async () => {
            if (!replyText.trim()) {
                setError("Reply cannot be empty");
                return;
            }

            if (!token) {
                setError("You must be logged in to reply");
                return;
            }

            try {
                await axios.post(
                    `${API_URL}/comments/`,
                    {
                        project: parseInt(projectId),
                        content: replyText.trim(),
                        parent: comment.id,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                setReplyText('');
                setShowReply(prev => ({ ...prev, [comment.id]: false }));
                fetchComments();

            } catch (err) {
                console.error("Reply error:", err);
                setError("Failed to post reply");
            }
        };

        return (
            <div className={`comment-card depth-${Math.min(depth, 3)}`}>
                <div className="comment-header">
                    <strong>{comment.user_email || 'Unknown User'}</strong>
                    <span className="comment-date">
                        {comment.created_at
                            ? new Date(comment.created_at).toLocaleString()
                            : ''}
                    </span>
                </div>

                <p className="comment-content">{comment.content}</p>

                <button
                    onClick={() =>
                        setShowReply(prev => ({
                            ...prev,
                            [comment.id]: !prev[comment.id],
                        }))
                    }
                >
                    Reply
                </button>

                {showReply[comment.id] && (
                    <div className="reply-form">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            rows="2"
                        />

                        <div className="reply-actions">
                            <button
                                onClick={() =>
                                    setShowReply(prev => ({
                                        ...prev,
                                        [comment.id]: false,
                                    }))
                                }
                            >
                                Cancel
                            </button>

                            <button className="btn-primary" onClick={handleReplySubmit}>
                                Submit Reply
                            </button>
                        </div>
                    </div>
                )}

                {comment.replies?.length > 0 && (
                    <div className="replies-container">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // =========================
    // UI STATES
    // =========================
    if (loading) return <div className="comments-loading">Loading comments...</div>;

    if (error)
        return <div className="comments-error" style={{ color: 'red', padding: 20 }}>{error}</div>;

    return (
        <div className="comment-section">
            <h3>Comments ({comments.length})</h3>

            {!token && (
                <div className="login-warning">
                    Please login to post comments
                </div>
            )}

            {/* COMMENT FORM */}
            <form onSubmit={handleSubmitComment} className="comment-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows="3"
                    required
                    disabled={!token}
                />
                <button type="submit" disabled={!token}>
                    Post Comment
                </button>
            </form>

            {/* COMMENTS LIST */}
            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="no-comments">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            depth={0}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;