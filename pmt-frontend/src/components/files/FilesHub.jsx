import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiUploadCloud,
  FiSearch,
  FiDownload,
  FiTrash2,
  FiFileText,
  FiImage,
  FiArchive,
  FiDatabase,
  FiEye
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import Modal from '../common/Modal';
import { formatBytes } from './AttachmentChip';
import api, { resolveBackendUrl } from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/pages/collaboration.css';

const FilesHub = ({ fixedProjectId = null, onCountChange }) => {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const currentUserId = user?._id || user?.id;
  const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(user?.role);

  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState(fixedProjectId || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [dragging, setDragging] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({
    projectId: fixedProjectId || '',
    taskId: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFilesData();
  }, [fixedProjectId]);

  useEffect(() => {
    if (onCountChange) onCountChange(files.length);
  }, [files.length, onCountChange]);

  useEffect(() => {
    const unsubAdd = subscribe('file:uploaded', (evt) => {
      if (!evt.file) return;
      if (fixedProjectId && (evt.file.projectId?._id || evt.file.projectId) !== fixedProjectId) {
        return;
      }
      setFiles((prev) =>
        prev.some((f) => f._id === evt.file._id) ? prev : [evt.file, ...prev]
      );
    });

    const unsubDel = subscribe('file:deleted', (evt) => {
      if (!evt.fileId) return;
      setFiles((prev) => prev.filter((f) => f._id !== evt.fileId));
    });

    return () => {
      unsubAdd();
      unsubDel();
    };
  }, [fixedProjectId, subscribe]);

  const fetchFilesData = async () => {
    setLoading(true);
    try {
      const query = fixedProjectId ? `?projectId=${fixedProjectId}` : '';
      const [filesRes, projectsRes, tasksRes] = await Promise.all([
        api.get(`/files${query}`),
        api.get('/projects'),
        api.get('/tasks')
      ]);
      setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
    } catch {
      toast.error('Failed to load shared files');
    } finally {
      setLoading(false);
    }
  };

  const openUploadDialogWithFile = (file) => {
    if (!file) return;
    setPendingFile(file);
    setUploadMeta({
      projectId: fixedProjectId || (projectFilter !== 'all' ? projectFilter : ''),
      taskId: '',
      description: ''
    });
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!pendingFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      if (uploadMeta.projectId) formData.append('projectId', uploadMeta.projectId);
      if (uploadMeta.taskId) formData.append('taskId', uploadMeta.taskId);
      if (uploadMeta.description) formData.append('description', uploadMeta.description);

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles((prev) =>
        prev.some((f) => f._id === res.data._id) ? prev : [res.data, ...prev]
      );
      setShowUploadModal(false);
      setPendingFile(null);
      toast.success('File uploaded & shared with team!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await api.delete(`/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      toast.success('File deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (!fixedProjectId && projectFilter !== 'all') {
        const pid = f.projectId?._id || f.projectId;
        if (pid !== projectFilter) return false;
      }
      if (categoryFilter !== 'all' && f.category !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = f.originalName?.toLowerCase().includes(q);
        const matchDesc = f.description?.toLowerCase().includes(q);
        const matchProj = f.projectId?.name?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchProj) return false;
      }
      return true;
    });
  }, [files, fixedProjectId, projectFilter, categoryFilter, searchTerm]);

  const scopedTasksForUpload = useMemo(() => {
    if (!uploadMeta.projectId) return tasks;
    return tasks.filter(
      (t) => (t.projectId?._id || t.projectId) === uploadMeta.projectId
    );
  }, [tasks, uploadMeta.projectId]);

  const token = localStorage.getItem('token') || '';

  const renderCategoryIcon = (category) => {
    if (category === 'image') return <FiImage size={28} style={{ color: '#2563eb' }} />;
    if (category === 'archive') return <FiArchive size={28} style={{ color: '#f59e0b' }} />;
    if (category === 'data') return <FiDatabase size={28} style={{ color: '#10b981' }} />;
    return <FiFileText size={28} style={{ color: '#6366f1' }} />;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="files-hub-page">
      {!fixedProjectId && (
        <div className="page-header">
          <div>
            <h1>Shared Files</h1>
            <p className="text-muted">
              Upload, organize, preview, and download specs, designs, and project deliverables
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn primary-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUploadCloud size={16} />
              Upload File
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop File Sharing Zone */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) openUploadDialogWithFile(f);
          e.target.value = '';
        }}
      />

      <div
        className={`files-dropzone ${dragging ? 'dragging' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) openUploadDialogWithFile(dropped);
        }}
      >
        <FiUploadCloud size={28} style={{ color: '#2563eb', margin: '0 auto 8px' }} />
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
          Click to choose a file or drag and drop it here to share with your team
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          Supports images, PDFs, Markdown specs, CSV/JSON datasets, and archives up to 20 MB
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: '20px' }}>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search files by name, description, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-grid">
          {!fixedProjectId && (
            <select
              className="filter-select"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All File Types</option>
            <option value="image">Images & Wireframes</option>
            <option value="document">Documents & Specs</option>
            <option value="data">CSV / JSON / Code</option>
            <option value="archive">Archives</option>
          </select>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <div className="empty-state">
          <FiFileText className="empty-state-icon" />
          <h3>No shared files found</h3>
          <p>Drop a file above to share it with your project team.</p>
        </div>
      ) : (
        <div className="files-grid">
          {filteredFiles.map((file) => {
            const isImage = file.category === 'image' || file.mimeType?.startsWith('image/');
            const contentUrl = resolveBackendUrl(`${file.url}?token=${encodeURIComponent(token)}`);
            const downloadUrl = resolveBackendUrl(`${file.downloadUrl}?token=${encodeURIComponent(token)}`);
            const canDelete =
              isPMorAdmin || (file.uploadedBy?._id && file.uploadedBy._id === currentUserId);

            return (
              <div key={file._id} className="file-hub-card">
                <div
                  className="file-card-preview-box"
                  style={{ cursor: isImage ? 'pointer' : 'default' }}
                  onClick={() => isImage && setPreviewFile(file)}
                >
                  {isImage ? (
                    <img src={contentUrl} alt={file.originalName} />
                  ) : (
                    renderCategoryIcon(file.category)
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#0f172a',
                      wordBreak: 'break-word'
                    }}
                  >
                    {file.originalName}
                  </div>
                  {file.description && (
                    <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                      {file.description}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: '#64748b' }}>
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>By {file.uploadedBy?.firstName || 'Member'}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {file.projectId?.name && !fixedProjectId && (
                  <div>
                    <Link
                      to={`/projects/${file.projectId._id}`}
                      className="table-project-tag"
                      style={{ textDecoration: 'none', fontSize: '12px' }}
                    >
                      <span
                        className="project-dot"
                        style={{ backgroundColor: file.projectId.color || '#2563eb' }}
                      />
                      {file.projectId.name}
                    </Link>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isImage && (
                      <button
                        type="button"
                        className="tool-icon-btn"
                        onClick={() => setPreviewFile(file)}
                      >
                        <FiEye size={13} />
                        Preview
                      </button>
                    )}
                    <a
                      href={downloadUrl}
                      download={file.originalName}
                      className="tool-icon-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      <FiDownload size={13} />
                      Download
                    </a>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      className="attachment-action-link"
                      style={{ color: '#ef4444' }}
                      title="Delete file"
                      onClick={() => handleDeleteFile(file._id)}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Metadata Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setPendingFile(null);
        }}
        title="Share File with Team"
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pendingFile && (
            <div
              style={{
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            >
              <strong>{pendingFile.name}</strong> ({formatBytes(pendingFile.size)})
            </div>
          )}

          {!fixedProjectId && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Link to Project</label>
              <select
                className="form-input"
                value={uploadMeta.projectId}
                onChange={(e) =>
                  setUploadMeta({ ...uploadMeta, projectId: e.target.value, taskId: '' })
                }
              >
                <option value="">General Workspace File</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Link to Task (Optional)</label>
            <select
              className="form-input"
              value={uploadMeta.taskId}
              onChange={(e) => setUploadMeta({ ...uploadMeta, taskId: e.target.value })}
            >
              <option value="">None</option>
              {scopedTasksForUpload.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description / Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="What is inside this file?"
              value={uploadMeta.description}
              onChange={(e) => setUploadMeta({ ...uploadMeta, description: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn secondary-btn"
              onClick={() => {
                setShowUploadModal(false);
                setPendingFile(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary-btn" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Share'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Image Preview Modal */}
      {previewFile && (
        <Modal
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          title={previewFile.originalName}
        >
          <div className="file-preview-container">
            <img
              src={resolveBackendUrl(`${previewFile.url}?token=${encodeURIComponent(token)}`)}
              alt={previewFile.originalName}
              className="file-preview-img"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '13px' }}>
                {previewFile.description || formatBytes(previewFile.size)}
              </span>
              <a
                href={resolveBackendUrl(`${previewFile.downloadUrl}?token=${encodeURIComponent(token)}`)}
                download={previewFile.originalName}
                className="btn primary-btn btn-sm"
              >
                <FiDownload size={14} />
                Download
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FilesHub;
