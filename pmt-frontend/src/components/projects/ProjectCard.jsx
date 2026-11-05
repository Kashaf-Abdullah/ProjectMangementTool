import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiCalendar,
  FiCheckSquare,
  FiEdit,
  FiTrash2,
  FiArchive,
  FiPlayCircle,
  FiMoreVertical,
  FiPlus
} from 'react-icons/fi';
import Modal from '../common/Modal';
import '../../styles/pages/projects.css';

const ProjectCard = ({ project, onDelete, onStatusToggle, onQuickAddTask, userRole }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const canManage = ['admin', 'project_manager', 'super_admin'].includes(userRole);
  const progress = project.progress || 0;

  const getProgressColor = (val) => {
    if (val >= 80) return 'var(--success-color)';
    if (val >= 40) return 'var(--primary-color)';
    return 'var(--warning-color)';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="project-card">
        <div className="project-card-accent" style={{ backgroundColor: project.color || '#2563eb' }} />
        <div className="project-header">
          <div className="project-meta">
            <span className={`project-status ${project.isActive ? 'active' : 'archived'}`}>
              {project.isActive ? 'Active' : 'Archived'}
            </span>
            <span className="project-date">
              <FiCalendar size={12} />
              {formatDate(project.createdAt)}
            </span>
          </div>

          {canManage && (
            <div className="project-actions">
              <button
                type="button"
                className="menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <FiMoreVertical />
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <Link
                    to={`/projects/${project._id}`}
                    className="dropdown-item"
                    onClick={() => setShowMenu(false)}
                  >
                    <FiEdit size={14} />
                    Open & Manage
                  </Link>
                  {onQuickAddTask && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setShowMenu(false);
                        onQuickAddTask(project._id);
                      }}
                    >
                      <FiPlus size={14} />
                      Add Task Here
                    </button>
                  )}
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setShowMenu(false);
                      onStatusToggle(project._id, project.isActive);
                    }}
                  >
                    {project.isActive ? (
                      <>
                        <FiArchive size={14} />
                        Archive
                      </>
                    ) : (
                      <>
                        <FiPlayCircle size={14} />
                        Activate
                      </>
                    )}
                  </button>
                  <div className="dropdown-divider"></div>
                  <button
                    type="button"
                    className="dropdown-item delete"
                    onClick={() => {
                      setShowMenu(false);
                      setShowConfirmDelete(true);
                    }}
                  >
                    <FiTrash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="project-body">
          <Link to={`/projects/${project._id}`} className="project-title-link">
            <h3 className="project-title">{project.name}</h3>
          </Link>
          <p className="project-description">
            {project.description || 'No description provided'}
          </p>

          <div className="project-stats-strip">
            <span className="project-stat-item">
              <FiUsers size={14} />
              {project.members?.length || 0} members
            </span>
            <span className="project-stat-item">
              <FiCheckSquare size={14} />
              {project.completedTaskCount || 0}/{project.taskCount || 0} tasks
            </span>
          </div>
        </div>

        <div className="project-footer">
          <div className="project-progress">
            <div className="progress-info">
              <span>Completion</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  backgroundColor: getProgressColor(progress)
                }}
              />
            </div>
          </div>

          <div className="project-card-bottom-row">
            <div className="project-manager">
              <span className="manager-label">Lead:</span>
              <span className="manager-name">
                {project.projectManagerId?.firstName || 'Admin'}
              </span>
            </div>

            {canManage && onQuickAddTask && (
              <button
                type="button"
                className="btn secondary-btn btn-sm"
                onClick={() => onQuickAddTask(project._id)}
              >
                <FiPlus size={13} />
                Add Task
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Delete Project"
        size="small"
      >
        <div className="confirm-dialog-body">
          <p>
            Are you sure you want to delete <strong>"{project.name}"</strong> and all its tasks? This action cannot be undone.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn secondary-btn"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn danger-btn"
              onClick={() => {
                setShowConfirmDelete(false);
                onDelete(project._id);
              }}
            >
              Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProjectCard;
