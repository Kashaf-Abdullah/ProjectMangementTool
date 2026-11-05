import React, { useState } from 'react';
import { FiMail, FiUser, FiShield, FiLock } from 'react-icons/fi';
import '../../styles/components/forms.css';

const InviteUserForm = ({ onSubmit, onCancel, currentUsers, userLimit, canAssignAdmin = true }) => {
  const [addMode, setAddMode] = useState('direct'); // 'direct' | 'invite'
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (addMode === 'direct' && (!formData.password || formData.password.length < 8)) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (currentUsers >= userLimit) {
      setErrors({ form: 'User limit reached. Please upgrade your plan.' });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        ...(addMode === 'direct'
          ? { password: formData.password, activateImmediately: true }
          : { activateImmediately: false })
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    ...(canAssignAdmin
      ? [
          { value: 'admin', label: 'Admin', description: 'Full organization & billing access' },
          { value: 'project_manager', label: 'Project Manager', description: 'Create projects & assign tasks' }
        ]
      : []),
    { value: 'user', label: 'Team Member', description: 'Work on assigned tasks & update statuses' }
  ];

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="mode-switch-tabs">
        <button
          type="button"
          className={`mode-tab-btn ${addMode === 'direct' ? 'active' : ''}`}
          onClick={() => setAddMode('direct')}
        >
          Add Active Member Immediately
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${addMode === 'invite' ? 'active' : ''}`}
          onClick={() => setAddMode('invite')}
        >
          Send Invite Link
        </button>
      </div>

      <div className="form-info">
        <div className="limit-info">
          <span className="limit-label">Active Seats:</span>
          <span className="limit-value">{currentUsers}/{userLimit}</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName" className="form-label">
            <FiUser className="form-icon" />
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`form-input ${errors.firstName ? 'error' : ''}`}
            placeholder="Ayesha"
            disabled={currentUsers >= userLimit}
          />
          {errors.firstName && <span className="form-error">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName" className="form-label">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`form-input ${errors.lastName ? 'error' : ''}`}
            placeholder="Khan"
            disabled={currentUsers >= userLimit}
          />
          {errors.lastName && <span className="form-error">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          <FiMail className="form-icon" />
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="ayesha@company.com"
          disabled={currentUsers >= userLimit}
        />
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      {addMode === 'direct' && (
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            <FiLock className="form-icon" />
            Initial Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Minimum 8 characters"
            disabled={currentUsers >= userLimit}
          />
          {errors.password && <span className="form-error">{errors.password}</span>}
          <div className="form-hint">
            Member will be immediately active and available for task assignments.
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          <FiShield className="form-icon" />
          Role *
        </label>
        <div className="role-selector">
          {roleOptions.map(role => (
            <label key={role.value} className="role-option">
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={formData.role === role.value}
                onChange={handleChange}
                disabled={currentUsers >= userLimit}
              />
              <div className="role-card">
                <div className="role-title">{role.label}</div>
                <div className="role-description">{role.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {errors.form && <div className="form-error-message">{errors.form}</div>}

      <div className="form-actions">
        <button type="button" className="btn secondary-btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary-btn"
          disabled={loading || currentUsers >= userLimit}
        >
          {loading
            ? 'Saving...'
            : (addMode === 'direct' ? 'Add Team Member' : 'Send Invitation')}
        </button>
      </div>
    </form>
  );
};

export default InviteUserForm;
