import React, { useState } from 'react';
import { FiMail, FiUser, FiShield, FiEdit, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import UserRoleSelector from './UserRoleSelector';
import '../../styles/pages/users.css';

const UserCard = ({ user, currentUserId, onUpdateRole, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isCurrentUser = user._id === currentUserId;
  const canEdit = !isCurrentUser; // Can't edit self
  const canDelete = !isCurrentUser && user.role !== 'super_admin'; // Can't delete self or super admin

  const getRoleColor = (role) => {
    const colors = {
      super_admin: '#ef4444',
      admin: '#8b5cf6',
      project_manager: '#3b82f6',
      user: '#64748b'
    };
    return colors[role] || '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRoleUpdate = (newRole) => {
    onUpdateRole(user._id, newRole);
    setShowRoleEditor(false);
  };

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
    setShowMenu(false);
  };

  const confirmDelete = () => {
    onDelete(user._id);
    setShowConfirmDelete(false);
  };

  return (
    <>
      <div className="user-card">
        <div className="user-header">
          <div className="user-avatar">
            {user.firstName?.charAt(0).toUpperCase()}
            {user.lastName?.charAt(0).toUpperCase()}
          </div>
          
          <div className="user-actions">
            <button 
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              disabled={!canEdit && !canDelete}
            >
              <FiMoreVertical />
            </button>
            
            {showMenu && (canEdit || canDelete) && (
              <div className="dropdown-menu">
                {canEdit && (
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowRoleEditor(true);
                      setShowMenu(false);
                    }}
                  >
                    <FiEdit size={14} />
                    Edit Role
                  </button>
                )}
                
                {canDelete && (
                  <>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item delete"
                      onClick={handleDeleteClick}
                    >
                      <FiTrash2 size={14} />
                      Remove User
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="user-body">
          <h3 className="user-name">
            {user.firstName} {user.lastName}
            {isCurrentUser && <span className="current-user-badge">You</span>}
          </h3>
          
          <div className="user-email">
            <FiMail size={12} />
            <span>{user.email}</span>
          </div>
          
          <div className="user-meta">
            <div 
              className="user-role"
              style={{ 
                backgroundColor: `${getRoleColor(user.role)}20`,
                color: getRoleColor(user.role)
              }}
            >
              <FiShield size={12} />
              <span>{user.role.replace('_', ' ')}</span>
            </div>
            
            <div className="user-status">
              <div className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
              <span>{user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="user-footer">
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">Joined</span>
              <span className="info-value">{formatDate(user.createdAt)}</span>
            </div>
            
            {user.lastLogin && (
              <div className="info-item">
                <span className="info-label">Last Login</span>
                <span className="info-value">{formatDate(user.lastLogin)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Editor Modal */}
      {showRoleEditor && (
        <div className="modal-backdrop" onClick={() => setShowRoleEditor(false)}>
          <div className="role-editor-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Role for {user.firstName} {user.lastName}</h3>
            <UserRoleSelector
              currentRole={user.role}
              onSelect={handleRoleUpdate}
              onCancel={() => setShowRoleEditor(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal-backdrop" onClick={() => setShowConfirmDelete(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove User</h3>
            <p>
              Are you sure you want to remove {user.firstName} {user.lastName} from the organization?
              This action cannot be undone.
            </p>
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
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserCard;