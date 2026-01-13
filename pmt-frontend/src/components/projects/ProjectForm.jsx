import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiX, FiUsers } from 'react-icons/fi';
import '../../styles/components/forms.css';

const ProjectForm = ({ project, onSubmit, onCancel, mode = 'create' }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#64748b',
    members: []
  });
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project && mode === 'edit') {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        color: project.color || '#64748b',
        members: project.members?.map(m => m._id) || []
      });
    }
    fetchMembers();
  }, [project, mode]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/users');
      setAvailableMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMemberToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter(id => id !== memberId)
        : [...prev.members, memberId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Project name must be 100 characters or less';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
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

  const colorOptions = [
    { value: '#64748b', label: 'Gray' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Yellow' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
  ];

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="Enter project name"
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
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={`form-textarea ${errors.description ? 'error' : ''}`}
          placeholder="Describe the project..."
          rows={3}
          maxLength={500}
        />
        {errors.description && (
          <span className="form-error">{errors.description}</span>
        )}
        <div className="form-hint">
          {formData.description.length}/500 characters
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="color" className="form-label">
          Project Color
        </label>
        <div className="color-selector">
          {colorOptions.map(color => (
            <label key={color.value} className="color-option">
              <input
                type="radio"
                name="color"
                value={color.value}
                checked={formData.color === color.value}
                onChange={handleChange}
              />
              <span 
                className="color-dot" 
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <FiUsers className="form-icon" />
          Team Members
        </label>
        <div className="members-selector">
          {availableMembers.map(member => (
            <label key={member._id} className="member-option">
              <input
                type="checkbox"
                checked={formData.members.includes(member._id)}
                onChange={() => handleMemberToggle(member._id)}
              />
              <div className="member-info">
                <div className="member-avatar">
                  {member.firstName?.charAt(0).toUpperCase()}
                </div>
                <div className="member-details">
                  <span className="member-name">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="member-role">{member.role}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="form-hint">
          {formData.members.length} member{formData.members.length !== 1 ? 's' : ''} selected
        </div>
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
            mode === 'create' ? 'Create Project' : 'Update Project'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;