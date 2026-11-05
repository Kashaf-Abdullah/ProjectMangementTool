import React, { useState } from 'react';
import { FiMail, FiShield, FiEdit, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import UserRoleSelector from './UserRoleSelector';
import Modal from '../common/Modal';
import '../../styles/pages/users.css';

const UserCard = ({ user, currentUserId, onUpdateRole, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isCurrentUser = user._id === currentUserId;
  const canEdit = Boolean(onUpdateRole) && !isCurrentUser;
  const canDelete = Boolean(onDelete) && !isCurrentUser && user.role !== 'super_admin';

  const getRoleColor = (role) => {
    const colors = {
      super_admin: '#ef4444',
      admin: '#7c3aed',
      project_manager: '#2563eb',
      user: '#64748b'
    };
    return colors[role] || '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="user-card">
        <div className="user-header">
          <div className="user-avatar">
            {user.firstName?.charAt(0)?.toUpperCase()}
            {user.lastName?.charAt(0)?.toUpperCase()}
          </div>

          {(canEdit || canDelete) && (
            <div className="user-actions">
              <button
                type="button"
                className="menu-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                <FiMoreVertical />
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  {canEdit && (
                    <button
                      type="button"
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
                        type="button"
                        className="dropdown-item delete"
                        onClick={() => {
                          setShowConfirmDelete(true);
                          setShowMenu(false);
                        }}
                      >
                        <FiTrash2 size={14} />
                        Remove User
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
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
                backgroundColor: `${getRoleColor(user.role)}18`,
                color: getRoleColor(user.role)
              }}
            >
              <FiShield size={12} />
              <span>{user.role?.replace('_', ' ')}</span>
            </div>

            <div className="user-status">
              <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
              <span>{user.isActive ? 'Active' : 'Invited'}</span>
            </div>
          </div>
        </div>

        <div className="user-footer">
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">Joined</span>
              <span className="info-value">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRoleEditor}
        onClose={() => setShowRoleEditor(false)}
        title={`Change Role — ${user.firstName} ${user.lastName}`}
        size="small"
      >
        <UserRoleSelector
          currentRole={user.role}
          onSelect={(newRole) => {
            onUpdateRole(user._id, newRole);
            setShowRoleEditor(false);
          }}
          onCancel={() => setShowRoleEditor(false)}
        />
      </Modal>

      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Remove Team Member"
        size="small"
      >
        <div className="confirm-dialog-body">
          <p>
            Are you sure you want to remove <strong>{user.firstName} {user.lastName}</strong> from your organization?
          </p>
          <div className="form-actions">
            <button className="btn secondary-btn" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </button>
            <button
              className="btn danger-btn"
              onClick={() => {
                setShowConfirmDelete(false);
                onDelete(user._id);
              }}
            >
              Remove Member
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserCard;
