import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiCalendar, FiUser, FiFlag } from 'react-icons/fi';
import '../../styles/components/forms.css';

const TaskForm = ({ task, projects, onSubmit, onCancel, mode = 'create' }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    labels: []
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task && mode === 'edit') {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId?._id || '',
        assigneeId: task.assigneeId?._id || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        labels: task.labels || []
      });
    }
    
    if (projects?.length > 0 && !formData.projectId) {
      setFormData(prev => ({
        ...prev,
        projectId: projects[0]._id
      }));
    }
    
    fetchUsers();
  }, [task, projects, mode]);

  useEffect(() => {
    if (formData.projectId) {
      fetchProjectUsers(formData.projectId);
    }
  }, [formData.projectId]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjectUsers = async (projectId) => {
    try {
      const project = projects.find(p => p._id === projectId);
      if (project?.members) {
        // Filter users to only include project members
        const projectMemberIds = project.members.map(m => m._id);
        const filteredUsers = availableUsers.filter(u => 
          projectMemberIds.includes(u._id)
        );
        if (filteredUsers.length > 0) {
          setAvailableUsers(filteredUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching project users:', error);
    }
  };

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

  const handleLabelToggle = (label) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.assigneeId) {
      newErrors.assigneeId = 'Assignee is required';
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

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#64748b' },
    { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { value: 'review', label: 'Review', color: '#f59e0b' },
    { value: 'done', label: 'Done', color: '#10b981' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#64748b' },
    { value: 'medium', label: 'Medium', color: '#3b82f6' },
    { value: 'high', label: 'High', color: '#f59e0b' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444' }
  ];

  const labelOptions = ['bug', 'feature', 'docs', 'ui', 'backend', 'design'];

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`form-input ${errors.title ? 'error' : ''}`}
          placeholder="Enter task title"
          maxLength={200}
        />
        {errors.title && (
          <span className="form-error">{errors.title}</span>
        )}
        <div className="form-hint">
          {formData.title.length}/200 characters
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
          className="form-textarea"
          placeholder="Describe the task..."
          rows={3}
          maxLength={1000}
        />
        <div className="form-hint">
          {formData.description.length}/1000 characters
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="projectId" className="form-label">
            <FiFlag className="form-icon" />
            Project *
          </label>
          <select
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className={`form-select ${errors.projectId ? 'error' : ''}`}
          >
            <option value="">Select Project</option>
            {projects?.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.projectId && (
            <span className="form-error">{errors.projectId}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="assigneeId" className="form-label">
            <FiUser className="form-icon" />
            Assignee *
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            value={formData.assigneeId}
            onChange={handleChange}
            className={`form-select ${errors.assigneeId ? 'error' : ''}`}
          >
            <option value="">Select Assignee</option>
            {availableUsers.map(user => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.role})
              </option>
            ))}
          </select>
          {errors.assigneeId && (
            <span className="form-error">{errors.assigneeId}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status" className="form-label">
            Status
          </label>
          <div className="status-selector">
            {statusOptions.map(status => (
              <button
                key={status.value}
                type="button"
                className={`status-option ${formData.status === status.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                style={{
                  borderColor: formData.status === status.value ? status.color : 'transparent',
                  backgroundColor: formData.status === status.value ? `${status.color}20` : 'transparent'
                }}
              >
                <div 
                  className="status-dot" 
                  style={{ backgroundColor: status.color }}
                />
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="priority" className="form-label">
            <FiFlag className="form-icon" />
            Priority
          </label>
          <div className="priority-selector">
            {priorityOptions.map(priority => (
              <button
                key={priority.value}
                type="button"
                className={`priority-option ${formData.priority === priority.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                style={{
                  borderColor: formData.priority === priority.value ? priority.color : 'transparent',
                  backgroundColor: formData.priority === priority.value ? `${priority.color}20` : 'transparent'
                }}
              >
                <div 
                  className="priority-dot" 
                  style={{ backgroundColor: priority.color }}
                />
                {priority.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dueDate" className="form-label">
            <FiCalendar className="form-icon" />
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="form-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Labels
        </label>
        <div className="labels-selector">
          {labelOptions.map(label => (
            <label key={label} className="label-option">
              <input
                type="checkbox"
                checked={formData.labels.includes(label)}
                onChange={() => handleLabelToggle(label)}
              />
              <span className="label-tag">{label}</span>
            </label>
          ))}
        </div>
        <div className="form-hint">
          {formData.labels.length} label{formData.labels.length !== 1 ? 's' : ''} selected
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
            mode === 'create' ? 'Create Task' : 'Update Task'
          )}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;