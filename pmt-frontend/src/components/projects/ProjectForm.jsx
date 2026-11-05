import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers } from 'react-icons/fi';
import '../../styles/components/forms.css';

const ProjectForm = ({ project, onSubmit, onCancel, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: project && mode === 'edit' ? (project.name || '') : '',
    description: project && mode === 'edit' ? (project.description || '') : '',
    color: project && mode === 'edit' ? (project.color || '#2563eb') : '#2563eb',
    members: project && mode === 'edit'
      ? (project.members?.map(m => (typeof m === 'object' ? m._id : m)) || [])
      : []
  });
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/users?activeOnly=true');
        setAvailableMembers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
    { value: '#2563eb', label: 'Blue' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#7c3aed', label: 'Violet' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Crimson' },
    { value: '#0ea5e9', label: 'Sky' },
    { value: '#64748b', label: 'Slate' }
  ];

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <div className="form-group">
        <label htmlFor="name" className="form-label">Project Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="e.g., Mobile App Redesign, Q4 Marketing Portal"
          maxLength={100}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={`form-textarea ${errors.description ? 'error' : ''}`}
          placeholder="Describe project goals, scope, or deliverables..."
          rows={3}
          maxLength={500}
        />
        {errors.description && <span className="form-error">{errors.description}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Project Color</label>
        <div className="color-selector">
          {colorOptions.map(color => (
            <label key={color.value} className="color-option" title={color.label}>
              <input
                type="radio"
                name="color"
                value={color.value}
                checked={formData.color === color.value}
                onChange={handleChange}
              />
              <span
                className={`color-dot ${formData.color === color.value ? 'selected' : ''}`}
                style={{ backgroundColor: color.value }}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <FiUsers className="form-icon" />
          Assign Team Members
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
                  {member.firstName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="member-details">
                  <span className="member-name">{member.firstName} {member.lastName}</span>
                  <span className="member-role">{member.role?.replace('_', ' ')}</span>
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
        <button type="button" className="btn secondary-btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn primary-btn" disabled={loading}>
          {loading
            ? (mode === 'create' ? 'Creating...' : 'Updating...')
            : (mode === 'create' ? 'Create Project' : 'Update Project')}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
