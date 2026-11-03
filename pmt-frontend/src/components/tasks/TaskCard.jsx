import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUser,
  FiCalendar,
  FiFlag,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiUserCheck,
  FiMessageSquare,
  FiPaperclip
} from 'react-icons/fi';
import { format } from 'date-fns';
import Modal from '../common/Modal';
import TaskForm from './TaskForm';
import TaskCommentsModal from './TaskCommentsModal';

const TaskCard = ({
  task,
  projects = [],
  members = [],
  onUpdate,
  onDelete,
  onTaskSynced,
  userRole,
  userId
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showMenu]);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#64748b'
    };
    return colors[priority] || '#64748b';
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: '#64748b',
      in_progress: '#3b82f6',
      review: '#f59e0b',
      done: '#10b981'
    };
    return colors[status] || '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM d');
    } catch {
      return null;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isPMorAdmin = ['admin', 'project_manager', 'super_admin'].includes(userRole);
  const assigneeIdStr = task.assigneeId?._id || task.assigneeId;
  const canEdit = isPMorAdmin || (assigneeIdStr && userId && assigneeIdStr.toString() === userId.toString());

  const projectObj = typeof task.projectId === 'object' && task.projectId !== null
    ? task.projectId
    : projects.find(p => p._id === task.projectId);

  const assigneeObj = typeof task.assigneeId === 'object' && task.assigneeId !== null
    ? task.assigneeId
    : members.find(m => m._id === task.assigneeId);

  const assigneeName = assigneeObj
    ? `${assigneeObj.firstName || ''} ${assigneeObj.lastName || ''}`.trim()
    : 'Unassigned';

  const handleStatusChange = (newStatus) => {
    setShowMenu(false);
    if (newStatus !== task.status) {
      onUpdate(task._id, { status: newStatus });
    }
  };

  const handleQuickAssign = (newAssigneeId) => {
    setShowMenu(false);
    if (newAssigneeId && newAssigneeId !== assigneeIdStr) {
      onUpdate(task._id, { assigneeId: newAssigneeId });
    }
  };

  const handleEditSubmit = async (updatedFormData) => {
    await onUpdate(task._id, updatedFormData);
    setShowEditModal(false);
  };

  return (
    <>
      <div className={`task-card ${isOverdue ? 'overdue' : ''}`}>
        <div className="task-header">
          <div className="task-meta">
            {projectObj ? (
              <Link
                to={`/projects/${projectObj._id}`}
                className="project-link"
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className="project-dot"
                  style={{ backgroundColor: projectObj.color || '#2563eb' }}
                />
                <span>{projectObj.name}</span>
              </Link>
            ) : (
              <span className="project-link muted">Unlinked Project</span>
            )}

            <div className="task-actions" ref={menuRef}>
              <button
                type="button"
                className="menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <FiMoreVertical size={15} />
              </button>

              {showMenu && (
                <div className="dropdown-menu task-dropdown">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setShowCommentsModal(true);
                      setShowMenu(false);
                    }}
                  >
                    <FiMessageSquare size={14} />
                    Comments & Files ({task.commentCount || 0})
                  </button>

                  {isPMorAdmin && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setShowEditModal(true);
                        setShowMenu(false);
                      }}
                    >
                      <FiEdit size={14} />
                      Edit Task & Details
                    </button>
                  )}

                  {canEdit && (
                    <>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-section">
                        <div className="dropdown-label">Move Status</div>
                        {[
                          { id: 'todo', label: 'To Do' },
                          { id: 'in_progress', label: 'In Progress' },
                          { id: 'review', label: 'In Review' },
                          { id: 'done', label: 'Done' }
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            className={`dropdown-subitem ${task.status === st.id ? 'active' : ''}`}
                            onClick={() => handleStatusChange(st.id)}
                          >
                            <span
                              className="status-dot"
                              style={{ backgroundColor: getStatusColor(st.id) }}
                            />
                            <span>{st.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {isPMorAdmin && members.length > 0 && (
                    <>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-section">
                        <div className="dropdown-label">
                          <FiUserCheck size={12} /> Reassign Member
                        </div>
                        <div className="dropdown-scroll-list">
                          {members.map(m => (
                            <button
                              key={m._id}
                              type="button"
                              className={`dropdown-subitem ${assigneeIdStr === m._id ? 'active' : ''}`}
                              onClick={() => handleQuickAssign(m._id)}
                            >
                              <span className="mini-avatar">
                                {m.firstName?.charAt(0)?.toUpperCase()}
                              </span>
                              <span>{m.firstName} {m.lastName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {isPMorAdmin && (
                    <>
                      <div className="dropdown-divider"></div>
                      <button
                        type="button"
                        className="dropdown-item delete"
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FiTrash2 size={14} />
                        Delete Task
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="task-body"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowCommentsModal(true)}
          title="Click to view comments, replies, and shared files"
        >
          <h4 className="task-title">{task.title}</h4>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {task.labels && task.labels.length > 0 && (
            <div className="task-labels">
              {task.labels.map((label, index) => (
                <span key={index} className="label-tag">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="task-footer">
          <div className="task-info">
            <div className="assignee-pill" title={`Assigned to ${assigneeName}`}>
              <span className="assignee-avatar">
                {assigneeObj?.firstName?.charAt(0)?.toUpperCase() || <FiUser size={11} />}
              </span>
              <span className="assignee-name">{assigneeName}</span>
            </div>

            {task.dueDate && (
              <div className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                <FiCalendar size={12} />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue && <span className="overdue-text">Overdue</span>}
              </div>
            )}
          </div>

          <div className="task-badges" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="task-collab-Trigger"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentsModal(true);
              }}
              title="Comments, Replies & Shared Files"
            >
              <FiMessageSquare size={12} />
              <span>{task.commentCount || 0}</span>
              {(task.attachmentCount || 0) > 0 && (
                <>
                  <FiPaperclip size={11} style={{ marginLeft: '3px' }} />
                  <span>{task.attachmentCount}</span>
                </>
              )}
            </button>

            <span
              className="priority-badge"
              style={{
                backgroundColor: `${getPriorityColor(task.priority)}18`,
                color: getPriorityColor(task.priority)
              }}
            >
              <FiFlag size={10} />
              {task.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Task Comments, Replies & File Sharing Modal */}
      <TaskCommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        task={task}
        members={members}
        userId={userId}
        userRole={userRole}
        onTaskUpdated={onTaskSynced}
      />

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
      >
        <TaskForm
          task={task}
          projects={projects}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditModal(false)}
          mode="edit"
        />
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
        size="small"
      >
        <div className="confirm-dialog-body">
          <p>Are you sure you want to delete <strong>"{task.title}"</strong>? This action cannot be undone.</p>
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary-btn"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn danger-btn"
              onClick={() => {
                setShowDeleteModal(false);
                onDelete(task._id);
              }}
            >
              Delete Task
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TaskCard;
