import React, { useState } from 'react';
import api from '../services/api';

const FileUpload = ({ taskId, onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState([]);

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file);
        });

        try {
            await api.post(`/projects/tasks/${taskId}/attachments/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (onUploadComplete) onUploadComplete();
            setFiles([]);
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-upload">
            <input type="file" multiple onChange={handleFileChange} />
            {files.length > 0 && (
                <button onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
                </button>
            )}
        </div>
    );
};

export default FileUpload;