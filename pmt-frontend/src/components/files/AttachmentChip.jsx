import React, { useState } from 'react';
import { FiDownload, FiEye, FiFileText, FiImage, FiArchive, FiDatabase } from 'react-icons/fi';
import Modal from '../common/Modal';
import { resolveBackendUrl } from '../../services/api';

export const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const AttachmentChip = ({ file }) => {
  const [showPreview, setShowPreview] = useState(false);
  if (!file) return null;

  const token = localStorage.getItem('token') || '';
  const contentUrl = resolveBackendUrl(
    `${file.url || `/api/files/${file._id}/content`}?token=${encodeURIComponent(token)}`
  );
  const downloadUrl = resolveBackendUrl(
    `${file.downloadUrl || `/api/files/${file._id}/download`}?token=${encodeURIComponent(token)}`
  );
  const isImage = file.category === 'image' || file.mimeType?.startsWith('image/');

  const renderIcon = () => {
    if (isImage) return <FiImage size={16} />;
    if (file.category === 'archive') return <FiArchive size={16} />;
    if (file.category === 'data') return <FiDatabase size={16} />;
    return <FiFileText size={16} />;
  };

  return (
    <>
      <div className="attachment-chip-card">
        {isImage ? (
          <img
            src={contentUrl}
            alt={file.originalName}
            className="attachment-thumb"
            onClick={() => setShowPreview(true)}
            title="Click to preview image"
          />
        ) : (
          <div className="attachment-icon-box">{renderIcon()}</div>
        )}

        <div className="attachment-meta">
          <span className="attachment-name" title={file.originalName}>
            {file.originalName}
          </span>
          <span className="attachment-size">{formatBytes(file.size)}</span>
        </div>

        <div className="attachment-actions">
          {isImage && (
            <button
              type="button"
              className="attachment-action-link"
              onClick={() => setShowPreview(true)}
              title="Preview"
            >
              <FiEye size={14} />
            </button>
          )}
          <a
            href={downloadUrl}
            download={file.originalName}
            className="attachment-action-link"
            title="Download file"
            onClick={(e) => e.stopPropagation()}
          >
            <FiDownload size={14} />
          </a>
        </div>
      </div>

      {isImage && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={file.originalName}
        >
          <div className="file-preview-container">
            <img src={contentUrl} alt={file.originalName} className="file-preview-img" />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span className="text-muted" style={{ fontSize: '13px' }}>
                {formatBytes(file.size)} • Shared by {file.uploadedBy?.firstName || 'Team'}
              </span>
              <a href={downloadUrl} download={file.originalName} className="btn primary-btn btn-sm">
                <FiDownload size={14} />
                Download File
              </a>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AttachmentChip;
