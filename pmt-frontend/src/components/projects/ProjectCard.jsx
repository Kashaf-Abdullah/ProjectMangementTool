import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiCalendar, 
  FiCheckCircle, 
  FiEdit, 
  FiTrash2,
  FiArchive,
  FiPlayCircle,
  FiMoreVertical
} from 'react-icons/fi';
import '../../styles/pages/projects.css';

const ProjectCard = ({ project, onDelete, onStatusToggle, userRole }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'var(--success-color)';
    if (progress >= 50) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirmDelete(true);
    setShowMenu(false);
  };

  const confirmDelete = () => {
    onDelete(project._id);
    setShowConfirmDelete(false);
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    onStatusToggle(project._id, project.isActive);
  };

  return (
    <>
      <div className="project-card">
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
          
          <div className="project-actions">
            <button className="menu-btn" onClick={handleMenuClick}>
              <FiMoreVertical />
            </button>
            
            {showMenu && (
              <div className="dropdown-menu">
                <Link 
                  to={`/projects/${project._id}`} 
                  className="dropdown-item"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FiEdit size={14} />
                  Edit
                </Link>
                <button 
                  className="dropdown-item"
                  onClick={handleStatusClick}
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
                <button 
                  className="dropdown-item delete"
                  onClick={handleDeleteClick}
                >
                  <FiTrash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="project-body">
          <Link to={`/projects/${project._id}`} className="project-link">
            <h3 className="project-title">{project.name}</h3>
          </Link>
          <p className="project-description">
            {project.description || 'No description provided'}
          </p>
          
          <div className="project-members">
            <FiUsers size={14} />
            <span>{project.members?.length || 0} members</span>
          </div>
        </div>

        <div className="project-footer">
          <div className="project-progress">
            <div className="progress-info">
              <span>Progress</span>
              <span>{project.progress || 0}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${project.progress || 0}%`,
                  backgroundColor: getProgressColor(project.progress || 0)
                }}
              />
            </div>
          </div>
          
          <div className="project-manager">
            <span className="manager-label">Manager:</span>
            <span className="manager-name">
              {project.projectManagerId?.firstName || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal-backdrop" onClick={() => setShowConfirmDelete(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Project</h3>
            <p>Are you sure you want to delete "{project.name}"? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn secondary-btn"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
              <button 
                className="btn danger-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectCard;