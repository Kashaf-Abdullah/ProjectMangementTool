import React, { useState } from 'react';
import { FiMail, FiUser, FiShield } from 'react-icons/fi';
import '../../styles/components/forms.css';

const InviteUserForm = ({ onSubmit, onCancel, currentUsers, userLimit }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Check user limit
    if (currentUsers >= userLimit) {
      setErrors({ form: 'User limit reached. Please upgrade your plan.' });
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features' },
    { value: 'project_manager', label: 'Project Manager', description: 'Manage projects and tasks' },
    { value: 'user', label: 'User', description: 'Basic task management' }
  ];

  return (
    <form onSubmit={handleSubmit} className="invite-form">
      <div className="form-info">
        <div className="limit-info">
          <span className="limit-label">User Limit:</span>
          <span className="limit-value">{currentUsers}/{userLimit}</span>
        </div>
        {currentUsers >= userLimit && (
          <div className="limit-warning">
            User limit reached. Please upgrade your plan to invite more users.
          </div>
        )}
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
            placeholder="John"
            disabled={currentUsers >= userLimit}
          />
          {errors.firstName && (
            <span className="form-error">{errors.firstName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="lastName" className="form-label">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`form-input ${errors.lastName ? 'error' : ''}`}
            placeholder="Doe"
            disabled={currentUsers >= userLimit}
          />
          {errors.lastName && (
            <span className="form-error">{errors.lastName}</span>
          )}
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
          placeholder="john@example.com"
          disabled={currentUsers >= userLimit}
        />
        {errors.email && (
          <span className="form-error">{errors.email}</span>
        )}
        <div className="form-hint">
          An invitation email will be sent to this address
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="role" className="form-label">
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

      {errors.form && (
        <div className="form-error-message">
          {errors.form}
        </div>
      )}

      <div className="form-actions">
        <button 
          type="button" 
          className="btn secondary-btn"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn primary-btn"
          disabled={loading || currentUsers >= userLimit}
        >
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              Sending Invitation...
            </>
          ) : (
            'Send Invitation'
          )}
        </button>
      </div>
    </form>
  );
};

export default InviteUserForm;