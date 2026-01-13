import React, { useState, useEffect } from 'react';
import {  FiGlobe, FiUsers } from 'react-icons/fi';
import '../../styles/components/forms.css';

const OrganizationForm = ({ organization, onSubmit, onCancel, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    userLimit: 5
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (organization && mode === 'edit') {
      setFormData({
        name: organization.name || '',
        subdomain: organization.subdomain || '',
        userLimit: organization.userLimit || 5
      });
    }
  }, [organization, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle subdomain formatting
    let formattedValue = value;
    if (name === 'subdomain') {
      formattedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
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

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (formData.subdomain) {
      if (formData.subdomain.length < 3) {
        newErrors.subdomain = 'Subdomain must be at least 3 characters';
      } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
        newErrors.subdomain = 'Only lowercase letters, numbers, and hyphens allowed';
      }
    }

    if (formData.userLimit < 5) {
      newErrors.userLimit = 'Minimum user limit is 5';
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

    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const userLimitOptions = [5, 10, 15, 20, 25, 50, 100];

  return (
    <form onSubmit={handleSubmit} className="organization-form">
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          {/* <FiBuilding className="form-icon" /> */}
          Organization Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="Enter organization name"
          maxLength={100}
        />
        {errors.name && (
          <span className="form-error">{errors.name}</span>
        )}
        <div className="form-hint">
          {formData.name.length}/100 characters
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="subdomain" className="form-label">
          <FiGlobe className="form-icon" />
          Subdomain
        </label>
        <div className="subdomain-input">
          <input
            type="text"
            id="subdomain"
            name="subdomain"
            value={formData.subdomain}
            onChange={handleChange}
            className={`form-input ${errors.subdomain ? 'error' : ''}`}
            placeholder="your-organization"
            maxLength={50}
          />
          <span className="subdomain-suffix">.yourdomain.com</span>
        </div>
        {errors.subdomain && (
          <span className="form-error">{errors.subdomain}</span>
        )}
        <div className="form-hint">
          Optional. Used for custom URLs (e.g., {formData.subdomain || 'your-org'}.yourdomain.com)
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="userLimit" className="form-label">
          <FiUsers className="form-icon" />
          Initial User Limit *
        </label>
        <div className="user-limit-selector">
          {userLimitOptions.map(limit => (
            <label key={limit} className="limit-option">
              <input
                type="radio"
                name="userLimit"
                value={limit}
                checked={formData.userLimit === limit}
                onChange={handleChange}
              />
              <div className="limit-card">
                <div className="limit-value">{limit}</div>
                <div className="limit-label">users</div>
              </div>
            </label>
          ))}
        </div>
        {errors.userLimit && (
          <span className="form-error">{errors.userLimit}</span>
        )}
        <div className="form-hint">
          Can be increased later through billing
        </div>
      </div>

      <div className="form-note">
        <p>
          <strong>Note:</strong> The organization admin will be created separately 
          after organization creation.
        </p>
      </div>

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
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            mode === 'create' ? 'Create Organization' : 'Update Organization'
          )}
        </button>
      </div>
    </form>
  );
};

export default OrganizationForm;