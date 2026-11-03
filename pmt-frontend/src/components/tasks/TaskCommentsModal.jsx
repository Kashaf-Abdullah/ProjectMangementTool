import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FiMessageSquare,
  FiCornerDownRight,
  FiTrash2,
  FiPaperclip,
  FiUpload,
  FiUser,
  FiFlag
} from 'react-icons/fi';
import Modal from '../common/Modal';
import MentionInput from '../common/MentionInput';
import MentionText from '../common/MentionText';
import AttachmentChip from '../files/AttachmentChip';
import { useRealtime } from '../../context/RealtimeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/pages/collaboration.css';

const TaskCommentsModal = ({
  isOpen,
  onClose,
  task,
  members = [],
  userId,
  userRole,
  onTaskUpdated
}) => {
  const { subscribe } = useRealtime();
  const [comments, setComments] = useState([]);
  const [taskFiles, setTaskFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [uploadingDirect, setUploadingDirect] = useState(false);

  const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(userRole);
  const projectId = task?.projectId?._id || task?.projectId || null;

  useEffect(() => {
    if (!isOpen || !task?._id) return;
    fetchCommentsAndFiles();
  }, [isOpen, task?._id]);

  useEffect(() => {
    if (!isOpen || !task?._id) return;

    const unsubAdd = subscribe('task:comment_added', (evt) => {
      if (evt.taskId !== task._id || !evt.comment) return;
      setComments((prev) =>
        prev.some((c) => c._id === evt.comment._id) ? prev : [...prev, evt.comment]
      );
      if (evt.task && onTaskUpdated) onTaskUpdated(evt.task);
    });

    const unsubDel = subscribe('task:comment_deleted', (evt) => {
      if (evt.taskId !== task._id || !Array.isArray(evt.removedIds)) return;
      setComments((prev) => prev.filter((c) => !evt.removedIds.includes(c._id)));
      if (evt.task && onTaskUpdated) onTaskUpdated(evt.task);
    });

    const unsubFile = subscribe('file:uploaded', (evt) => {
      const fTaskId = evt.file?.taskId?._id || evt.file?.taskId;
      if (fTaskId === task._id) {
        setTaskFiles((prev) =>
          prev.some((f) => f._id === evt.file._id) ? prev : [evt.file, ...prev]
        );
      }
    });

    return () => {
      unsubAdd();
      unsubDel();
      unsubFile();
    };
  }, [isOpen, task?._id, subscribe, onTaskUpdated]);

  const fetchCommentsAndFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${task._id}/comments`);
      setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
      setTaskFiles(Array.isArray(res.data?.files) ? res.data.files : []);
    } catch {
      toast.error('Failed to load task comments');
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async ({ content, mentions, attachments }, parentId = null) => {
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, {
        content,
        parentId,
        mentions,
        attachments
      });
      setComments((prev) =>
        prev.some((c) => c._id === res.data._id) ? prev : [...prev, res.data]
      );
      if (attachments?.length > 0) {
        fetchCommentsAndFiles();
      }
      setReplyingToId(null);
      toast.success(parentId ? 'Reply posted' : 'Comment posted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
      throw err;
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/tasks/${task._id}/comments/${commentId}`);
      const removed = res.data?.removedIds || [commentId];
      setComments((prev) => prev.filter((c) => !removed.includes(c._id)));
      toast.success('Comment removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDirectTaskFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDirect(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) formData.append('projectId', projectId);
      formData.append('taskId', task._id);

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTaskFiles((prev) =>
        prev.some((f) => f._id === res.data._id) ? prev : [res.data, ...prev]
      );
      toast.success('File shared on task!');
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploadingDirect(false);
      e.target.value = '';
    }
  };

  const topLevelComments = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments]
  );

  const repliesByParent = useMemo(() => {
    const map = {};
    comments
      .filter((c) => c.parentId)
      .forEach((reply) => {
        if (!map[reply.parentId]) map[reply.parentId] = [];
        map[reply.parentId].push(reply);
      });
    return map;
  }, [comments]);

  if (!task) return null;

  const assigneeName = task.assigneeId?.firstName
    ? `${task.assigneeId.firstName} ${task.assigneeId.lastName || ''}`.trim()
    : 'Unassigned';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
    >
      <div className="task-collab-modal">
        {/* Task Context Strip */}
        <div className="task-collab-summary">
          {task.description && (
            <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
              {task.description}
            </div>
          )}
          <div className="task-collab-badges">
            {task.projectId?.name && (
              <span className="table-project-tag">
                <span
                  className="project-dot"
                  style={{ backgroundColor: task.projectId.color || '#2563eb' }}
                />
                {task.projectId.name}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FiUser size={13} />
              Assigned to <strong>{assigneeName}</strong>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
              <FiFlag size={13} />
              {task.priority} priority • {task.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Shared Task Files */}
        <div>
          <div className="task-collab-section-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiPaperclip size={14} /> Shared Files ({taskFiles.length})
            </span>
            <label className="tool-icon-btn" style={{ margin: 0 }}>
              <FiUpload size={13} />
              <span>{uploadingDirect ? 'Uploading...' : 'Share File'}</span>
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={handleDirectTaskFileUpload}
                disabled={uploadingDirect}
              />
            </label>
          </div>

          {taskFiles.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
              No files attached to this task yet. Upload specs, screenshots, or exports above.
            </div>
          ) : (
            <div className="attachments-row">
              {taskFiles.map((f) => (
                <AttachmentChip key={f._id} file={f} />
              ))}
            </div>
          )}
        </div>

        {/* Comments & Threaded Replies */}
        <div>
          <div className="task-collab-section-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiMessageSquare size={14} /> Comments & Replies ({comments.length})
            </span>
          </div>

          {loading ? (
            <div className="text-muted" style={{ fontSize: '13px', padding: '12px 0' }}>
              Loading conversation...
            </div>
          ) : topLevelComments.length === 0 ? (
            <div
              style={{
                padding: '18px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
                fontSize: '13px',
                color: '#64748b'
              }}
            >
              No comments yet. Start the conversation or @mention a teammate below!
            </div>
          ) : (
            <div className="comments-thread-list">
              {topLevelComments.map((comment) => {
                const replies = repliesByParent[comment._id] || [];
                const canRemove =
                  isPMorAdmin || (comment.author?._id && comment.author._id === userId);

                return (
                  <div key={comment._id} className="comment-card">
                    <div className="comment-header">
                      <div className="comment-author-row">
                        <span className="comment-avatar">
                          {comment.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        <span className="comment-author-name">
                          {comment.author
                            ? `${comment.author.firstName} ${comment.author.lastName}`
                            : 'Team Member'}
                        </span>
                        <span className="comment-time">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {comment.content && (
                      <div className="comment-body">
                        <MentionText text={comment.content} members={members} />
                      </div>
                    )}

                    {comment.attachments?.length > 0 && (
                      <div className="attachments-row">
                        {comment.attachments.map((file) => (
                          <AttachmentChip key={file._id} file={file} />
                        ))}
                      </div>
                    )}

                    <div className="comment-footer-actions">
                      <button
                        type="button"
                        className="comment-link-btn"
                        onClick={() =>
                          setReplyingToId(replyingToId === comment._id ? null : comment._id)
                        }
                      >
                        <FiCornerDownRight size={13} />
                        Reply {replies.length > 0 ? `(${replies.length})` : ''}
                      </button>

                      {canRemove && (
                        <button
                          type="button"
                          className="comment-link-btn danger"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          <FiTrash2 size={12} />
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Nested Replies */}
                    {replies.length > 0 && (
                      <div className="comment-replies-nested">
                        {replies.map((reply) => {
                          const canDeleteReply =
                            isPMorAdmin || (reply.author?._id && reply.author._id === userId);
                          return (
                            <div key={reply._id} className="reply-card">
                              <div className="comment-header">
                                <div className="comment-author-row">
                                  <span
                                    className="comment-avatar"
                                    style={{ width: 22, height: 22, fontSize: 10 }}
                                  >
                                    {reply.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                  <span className="comment-author-name" style={{ fontSize: '12.5px' }}>
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
                                {canDeleteReply && (
                                  <button
                                    type="button"
                                    className="comment-link-btn danger"
                                    onClick={() => handleDeleteComment(reply._id)}
                                    title="Delete reply"
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                )}
                              </div>

                              {reply.content && (
                                <div className="comment-body" style={{ fontSize: '13px' }}>
                                  <MentionText text={reply.content} members={members} />
                                </div>
                              )}

                              {reply.attachments?.length > 0 && (
                                <div className="attachments-row">
                                  {reply.attachments.map((file) => (
                                    <AttachmentChip key={file._id} file={file} />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline Reply Composer */}
                    {replyingToId === comment._id && (
                      <div className="inline-reply-box">
                        <MentionInput
                          members={members}
                          rows={2}
                          autoFocus
                          projectId={projectId}
                          taskId={task._id}
                          submitLabel="Post Reply"
                          placeholder={`Reply to ${comment.author?.firstName || 'comment'}... (@ to mention)`}
                          onSubmit={(payload) => handlePostComment(payload, comment._id)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Top-Level Comment Composer */}
        <div>
          <MentionInput
            members={members}
            rows={3}
            projectId={projectId}
            taskId={task._id}
            submitLabel="Post Comment"
            placeholder="Write a comment, share files, or type @ to mention a team member..."
            onSubmit={(payload) => handlePostComment(payload, null)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TaskCommentsModal;
