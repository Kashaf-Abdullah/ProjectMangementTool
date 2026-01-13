import React, { useState } from 'react';
import { FiShield, FiUsers, FiBriefcase, FiUser,FiHome } from 'react-icons/fi';
import '../../styles/components/forms.css';

const UserRoleSelector = ({ currentRole, onSelect, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const roleOptions = [
    {
      value: 'admin',
      label: 'Admin',
      icon: <FiShield />,
      description: 'Full access to all features including user management and billing',
      permissions: [
        'Manage all projects and tasks',
        'Invite and manage users',
        'Access billing and settings',
        'View all organization data'
      ]
    },
    {
      value: 'project_manager',
      label: 'Project Manager',
      icon: <FiHome/>,
      description: 'Can manage projects and tasks but not users',
      permissions: [
        'Create and manage projects',
        'Assign and manage tasks',
        'View project reports',
        'Cannot manage users or billing'
      ]
    },
    {
      value: 'user',
      label: 'User',
      icon: <FiUser />,
      description: 'Basic access to assigned tasks only',
      permissions: [
        'View assigned tasks',
        'Update own task status',
        'Add comments to tasks',
        'Cannot create projects or manage users'
      ]
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSelect(selectedRole);
  };

  return (
    <form onSubmit={handleSubmit} className="role-selector-form">
      <div className="role-options">
        {roleOptions.map(role => (
          <label key={role.value} className={`role-option ${selectedRole === role.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="role"
              value={role.value}
              checked={selectedRole === role.value}
              onChange={() => setSelectedRole(role.value)}
              className="role-input"
            />
            <div className="role-content">
              <div className="role-header">
                <div className="role-icon">{role.icon}</div>
                <div className="role-info">
                  <div className="role-title">{role.label}</div>
                  <div className="role-description">{role.description}</div>
                </div>
              </div>
              
              <div className="role-permissions">
                <div className="permissions-title">Permissions:</div>
                <ul className="permissions-list">
                  {role.permissions.map((permission, index) => (
                    <li key={index} className="permission-item">
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="role-actions">
        <button 
          type="button" 
          className="btn secondary-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn primary-btn"
          disabled={selectedRole === currentRole}
        >
          Update Role
        </button>
      </div>
    </form>
  );
};

export default UserRoleSelector;