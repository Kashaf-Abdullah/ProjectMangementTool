import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { FiCalendar, FiUser, FiFlag, FiBriefcase } from 'react-icons/fi';
import '../../styles/components/forms.css';

const TaskForm = ({
  task,
  projects = [],
  defaultProjectId = '',
  onSubmit,
  onCancel,
  mode = 'create'
}) => {
  const getInitialProjectId = () => {
    if (task && mode === 'edit') {
      return task.projectId?._id || task.projectId || '';
    }
    if (defaultProjectId && defaultProjectId !== 'all') {
      return defaultProjectId;
    }
    return projects?.[0]?._id || '';
  };

  const [formData, setFormData] = useState({
    title: task && mode === 'edit' ? (task.title || '') : '',
    description: task && mode === 'edit' ? (task.description || '') : '',
    projectId: getInitialProjectId(),
    assigneeId: task && mode === 'edit' ? (task.assigneeId?._id || task.assigneeId || '') : '',
    status: task && mode === 'edit' ? (task.status || 'todo') : 'todo',
    priority: task && mode === 'edit' ? (task.priority || 'medium') : 'medium',
    startDate: task && mode === 'edit' && task.startDate
      ? new Date(task.startDate).toISOString().split('T')[0]
      : '',
    dueDate: task && mode === 'edit' && task.dueDate
      ? new Date(task.dueDate).toISOString().split('T')[0]
      : '',
    labels: task && mode === 'edit' ? (task.labels || []) : []
  });

  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let mounted = true;
    const fetchOrgUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await api.get('/users?activeOnly=true');
        if (mounted) {
          setAllUsers(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        if (mounted) setUsersLoading(false);
      }
    };
    fetchOrgUsers();
    return () => {
      mounted = false;
    };
  }, []);

  // Ensure projectId initializes if projects load slightly after mount
  useEffect(() => {
    if (!formData.projectId && projects?.length > 0) {
      const target = (defaultProjectId && defaultProjectId !== 'all')
        ? defaultProjectId
        : projects[0]._id;
      setFormData(prev => ({ ...prev, projectId: target }));
    }
  }, [projects, defaultProjectId, formData.projectId]);

  const selectedProject = useMemo(
    () => projects?.find(p => p._id === formData.projectId) || null,
    [projects, formData.projectId]
  );

  const { projectMembers, otherOrgMembers } = useMemo(() => {
    if (!selectedProject || !Array.isArray(selectedProject.members) || selectedProject.members.length === 0) {
      return { projectMembers: allUsers, otherOrgMembers: [] };
    }
    const memberIds = new Set(
      selectedProject.members.map(m => (typeof m === 'object' ? m._id : m))
    );
    if (selectedProject.projectManagerId) {
      const pmId = typeof selectedProject.projectManagerId === 'object'
        ? selectedProject.projectManagerId._id
        : selectedProject.projectManagerId;
      if (pmId) memberIds.add(pmId);
    }

    const inProj = allUsers.filter(u => memberIds.has(u._id));
    const outsideProj = allUsers.filter(u => !memberIds.has(u._id));
    return { projectMembers: inProj, otherOrgMembers: outsideProj };
  }, [allUsers, selectedProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
      newErrors.projectId = 'Please select a project';
    }
    if (!formData.assigneeId) {
      newErrors.assigneeId = 'Please assign this task to a team member';
    }
    if (formData.startDate && formData.dueDate && formData.dueDate < formData.startDate) {
      newErrors.dueDate = 'Due date must be on or after the start date';
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
    { value: 'review', label: 'In Review', color: '#f59e0b' },
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
          placeholder="e.g., Implement API authentication flow"
          maxLength={200}
        />
        {errors.title && <span className="form-error">{errors.title}</span>}
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
          placeholder="Add clear context, acceptance criteria, or notes..."
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="projectId" className="form-label">
            <FiBriefcase className="form-icon" />
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
                {project.name} {!project.isActive ? '(Archived)' : ''}
              </option>
            ))}
          </select>
          {errors.projectId && <span className="form-error">{errors.projectId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="assigneeId" className="form-label">
            <FiUser className="form-icon" />
            Assign Member *
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            value={formData.assigneeId}
            onChange={handleChange}
            disabled={usersLoading}
            className={`form-select ${errors.assigneeId ? 'error' : ''}`}
          >
            <option value="">
              {usersLoading ? 'Loading team members...' : 'Select Team Member'}
            </option>
            {projectMembers.length > 0 && otherOrgMembers.length > 0 ? (
              <>
                <optgroup label="Project Team Members">
                  {projectMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName} ({member.role.replace('_', ' ')})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other Organization Members (Auto-adds to project)">
                  {otherOrgMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName} ({member.role.replace('_', ' ')})
                    </option>
                  ))}
                </optgroup>
              </>
            ) : (
              allUsers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.firstName} {member.lastName} ({member.role.replace('_', ' ')})
                </option>
              ))
            )}
          </select>
          {errors.assigneeId && <span className="form-error">{errors.assigneeId}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <div className="status-selector">
            {statusOptions.map(status => (
              <button
                key={status.value}
                type="button"
                className={`status-option ${formData.status === status.value ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                style={{
                  borderColor: formData.status === status.value ? status.color : '#e2e8f0',
                  backgroundColor: formData.status === status.value ? `${status.color}15` : '#ffffff'
                }}
              >
                <span className="status-dot" style={{ backgroundColor: status.color }} />
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
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
                  borderColor: formData.priority === priority.value ? priority.color : '#e2e8f0',
                  backgroundColor: formData.priority === priority.value ? `${priority.color}15` : '#ffffff'
                }}
              >
                <span className="priority-dot" style={{ backgroundColor: priority.color }} />
                {priority.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDate" className="form-label">
            <FiCalendar className="form-icon" />
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="form-input"
            max={formData.dueDate || undefined}
          />
        </div>

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
            className={`form-input ${errors.dueDate ? 'error' : ''}`}
            min={formData.startDate || undefined}
          />
          {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Labels</label>
          <div className="labels-selector">
            {labelOptions.map(label => (
              <label key={label} className={`label-chip ${formData.labels.includes(label) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={formData.labels.includes(label)}
                  onChange={() => handleLabelToggle(label)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
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
          {loading
            ? (mode === 'create' ? 'Creating...' : 'Saving...')
            : (mode === 'create' ? 'Create & Assign Task' : 'Save Changes')}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
