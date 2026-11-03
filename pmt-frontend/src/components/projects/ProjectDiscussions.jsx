import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FiPlus,
  FiMessageCircle,
  FiCheckCircle,
  FiBookmark,
  FiTrash2
} from 'react-icons/fi';
import Modal from '../common/Modal';
import MentionInput from '../common/MentionInput';
import MentionText from '../common/MentionText';
import AttachmentChip from '../files/AttachmentChip';
import { useRealtime } from '../../context/RealtimeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/pages/collaboration.css';

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'design', label: 'Design' },
  { id: 'release', label: 'Release' },
  { id: 'blocker', label: 'Blocker' }
];

const ProjectDiscussions = ({
  projectId,
  projectName,
  members = [],
  userId,
  userRole,
  onCountChange
}) => {
  const { subscribe } = useRealtime();
  const [discussions, setDiscussions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPinned, setNewPinned] = useState(false);

  const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(userRole);

  useEffect(() => {
    if (projectId) fetchDiscussions();
  }, [projectId]);

  useEffect(() => {
    if (onCountChange) onCountChange(discussions.length);
  }, [discussions.length, onCountChange]);

  useEffect(() => {
    const unsubCreated = subscribe('discussion:created', (evt) => {
      const disc = evt.discussion;
      if (!disc || (disc.project?._id || disc.projectId) !== projectId) return;
      setDiscussions((prev) =>
        prev.some((d) => d._id === disc._id) ? prev : [disc, ...prev]
      );
      setSelectedId((curr) => curr || disc._id);
    });

    const unsubUpdated = subscribe('discussion:updated', (evt) => {
      const disc = evt.discussion;
      if (!disc || (disc.project?._id || disc.projectId) !== projectId) return;
      setDiscussions((prev) => prev.map((d) => (d._id === disc._id ? disc : d)));
    });

    const unsubDeleted = subscribe('discussion:deleted', (evt) => {
      if (!evt.discussionId) return;
      setDiscussions((prev) => prev.filter((d) => d._id !== evt.discussionId));
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [projectId, subscribe]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/discussions`);
      const list = Array.isArray(res.data) ? res.data : [];
      setDiscussions(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0]._id);
      }
    } catch {
      toast.error('Failed to load project discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async ({ content, mentions, attachments }) => {
    if (!newTitle.trim()) {
      toast.error('Please enter a discussion topic title');
      throw new Error('Title required');
    }
    try {
      const res = await api.post(`/projects/${projectId}/discussions`, {
        title: newTitle.trim(),
        content,
        category: newCategory,
        isPinned: newPinned,
        mentions,
        attachments
      });
      setDiscussions((prev) =>
        prev.some((d) => d._id === res.data._id) ? prev : [res.data, ...prev]
      );
      setSelectedId(res.data._id);
      setNewTitle('');
      setNewCategory('general');
      setNewPinned(false);
      setShowCreateModal(false);
      toast.success('Discussion started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start discussion');
      throw err;
    }
  };

  const handlePostReply = async ({ content, mentions, attachments }) => {
    if (!selectedDiscussion) return;
    try {
      const res = await api.post(`/discussions/${selectedDiscussion._id}/replies`, {
        content,
        mentions,
        attachments
      });
      setDiscussions((prev) =>
        prev.map((d) => (d._id === res.data._id ? res.data : d))
      );
      toast.success('Reply added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
      throw err;
    }
  };

  const handleTogglePin = async (disc) => {
    try {
      const res = await api.put(`/discussions/${disc._id}`, {
        isPinned: !disc.isPinned
      });
      setDiscussions((prev) => prev.map((d) => (d._id === disc._id ? res.data : d)));
      toast.success(res.data.isPinned ? 'Discussion pinned' : 'Discussion unpinned');
    } catch {
      toast.error('Failed to update discussion');
    }
  };

  const handleToggleResolved = async (disc) => {
    try {
      const res = await api.put(`/discussions/${disc._id}`, {
        isResolved: !disc.isResolved
      });
      setDiscussions((prev) => prev.map((d) => (d._id === disc._id ? res.data : d)));
      toast.success(res.data.isResolved ? 'Marked as resolved' : 'Reopened discussion');
    } catch {
      toast.error('Failed to update discussion');
    }
  };

  const handleDeleteDiscussion = async (discId) => {
    try {
      await api.delete(`/discussions/${discId}`);
      const remaining = discussions.filter((d) => d._id !== discId);
      setDiscussions(remaining);
      setSelectedId(remaining[0]?._id || null);
      toast.success('Discussion deleted');
    } catch {
      toast.error('Failed to delete discussion');
    }
  };

  const selectedDiscussion =
    discussions.find((d) => d._id === selectedId) || discussions[0] || null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="project-discussions-section">
      <div className="section-toolbar">
        <div>
          <h3>Discussions in {projectName}</h3>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
            Align on architecture, releases, and blockers with @mentions and shared files
          </p>
        </div>
        <button
          type="button"
          className="btn primary-btn btn-sm"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus size={15} />
          New Discussion
        </button>
      </div>

      {discussions.length === 0 ? (
        <div className="empty-state">
          <FiMessageCircle className="empty-state-icon" />
          <h3>No discussions started yet</h3>
          <p>Start the first thread for {projectName} and @mention your teammates.</p>
          <button
            type="button"
            className="btn primary-btn mt-md"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus size={15} />
            Start First Discussion
          </button>
        </div>
      ) : (
        <div className="discussions-layout">
          {/* Left Thread List */}
          <div className="discussions-list-pane">
            <div className="discussions-list-header">
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                Threads ({discussions.length})
              </strong>
            </div>

            <div className="discussions-items">
              {discussions.map((disc) => (
                <button
                  key={disc._id}
                  type="button"
                  className={`discussion-row-item ${
                    selectedDiscussion?._id === disc._id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedId(disc._id)}
                >
                  <div className="discussion-row-top">
                    <span className={`discussion-cat-tag ${disc.category}`}>
                      {disc.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {disc.isPinned && (
                        <FiBookmark size={12} style={{ color: '#2563eb' }} title="Pinned" />
                      )}
                      {disc.isResolved && (
                        <FiCheckCircle
                          size={13}
                          style={{ color: '#10b981' }}
                          title="Resolved"
                        />
                      )}
                    </div>
                  </div>
                  <div className="discussion-row-title">{disc.title}</div>
                  <div className="discussion-row-meta">
                    <span>By {disc.author?.firstName || 'Team'}</span>
                    <span>{disc.replies?.length || 0} replies</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Active Thread View */}
          {selectedDiscussion && (
            <div className="discussion-detail-pane">
              <div className="discussion-detail-header">
                <div className="discussion-detail-title-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className={`discussion-cat-tag ${selectedDiscussion.category}`}>
                        {selectedDiscussion.category}
                      </span>
                      {selectedDiscussion.isResolved && (
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: '#15803d',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FiCheckCircle size={13} /> Resolved
                        </span>
                      )}
                    </div>
                    <h3>{selectedDiscussion.title}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {isPMorAdmin && (
                      <button
                        type="button"
                        className="tool-icon-btn"
                        onClick={() => handleTogglePin(selectedDiscussion)}
                      >
                        <FiBookmark size={13} />
                        {selectedDiscussion.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}

                    {(isPMorAdmin || selectedDiscussion.author?._id === userId) && (
                      <button
                        type="button"
                        className="tool-icon-btn"
                        onClick={() => handleToggleResolved(selectedDiscussion)}
                      >
                        <FiCheckCircle size={13} />
                        {selectedDiscussion.isResolved ? 'Reopen' : 'Resolve'}
                      </button>
                    )}

                    {(isPMorAdmin || selectedDiscussion.author?._id === userId) && (
                      <button
                        type="button"
                        className="tool-icon-btn"
                        style={{ color: '#ef4444' }}
                        onClick={() => handleDeleteDiscussion(selectedDiscussion._id)}
                        title="Delete thread"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  Started by{' '}
                  <strong>
                    {selectedDiscussion.author
                      ? `${selectedDiscussion.author.firstName} ${selectedDiscussion.author.lastName}`
                      : 'Member'}
                  </strong>{' '}
                  •{' '}
                  {formatDistanceToNow(new Date(selectedDiscussion.createdAt), {
                    addSuffix: true
                  })}
                </div>
              </div>

              {/* Original Post */}
              <div>
                <div className="discussion-op-body">
                  <MentionText text={selectedDiscussion.content} members={members} />
                </div>

                {selectedDiscussion.attachments?.length > 0 && (
                  <div className="attachments-row">
                    {selectedDiscussion.attachments.map((f) => (
                      <AttachmentChip key={f._id} file={f} />
                    ))}
                  </div>
                )}
              </div>

              {/* Replies List */}
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '10px'
                  }}
                >
                  Replies ({selectedDiscussion.replies?.length || 0})
                </div>

                {selectedDiscussion.replies?.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                    No replies yet. Add your thoughts below!
                  </div>
                ) : (
                  <div className="discussion-replies-list">
                    {selectedDiscussion.replies.map((reply) => (
                      <div key={reply._id} className="comment-card">
                        <div className="comment-header">
                          <div className="comment-author-row">
                            <span className="comment-avatar">
                              {reply.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                            <span className="comment-author-name">
                              {reply.author
                                ? `${reply.author.firstName} ${reply.author.lastName}`
                                : 'Member'}
                            </span>
                            <span className="comment-time">
                              {formatDistanceToNow(new Date(reply.createdAt), {
                                addSuffix: true
                              })}
                            </span>
                          </div>
                        </div>

                        {reply.content && (
                          <div className="comment-body">
                            <MentionText text={reply.content} members={members} />
                          </div>
                        )}

                        {reply.attachments?.length > 0 && (
                          <div className="attachments-row">
                            {reply.attachments.map((f) => (
                              <AttachmentChip key={f._id} file={f} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Composer */}
              <div>
                <MentionInput
                  members={members}
                  rows={3}
                  projectId={projectId}
                  discussionId={selectedDiscussion._id}
                  submitLabel="Post Reply"
                  placeholder="Write a reply... Type @ to mention teammates or attach files"
                  onSubmit={handlePostReply}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start New Discussion Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`New Discussion in ${projectName}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Topic Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., API Rate Limiting & Release Checklist"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {isPMorAdmin && (
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  paddingBottom: '10px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                />
                Pin to top
              </label>
            )}
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
              Message & Attachments *
            </label>
            <MentionInput
              members={members}
              rows={4}
              dropdownPosition="below"
              projectId={projectId}
              submitLabel="Start Discussion"
              placeholder="Share context, ask questions, @mention teammates, or attach specs..."
              onSubmit={handleCreateDiscussion}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDiscussions;
