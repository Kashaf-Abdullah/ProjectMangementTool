import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiBriefcase } from 'react-icons/fi';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import TaskForm from '../tasks/TaskForm';
import Modal from '../common/Modal';
import '../../styles/pages/projects.css';

const Projects = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskModalProjectId, setTaskModalProjectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches = project.name?.toLowerCase().includes(q) ||
          project.description?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterStatus !== 'all') {
        const isActive = filterStatus === 'active';
        if (project.isActive !== isActive) return false;
      }
      return true;
    });
  }, [projects, searchTerm, filterStatus]);

  const handleCreateProject = async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      setProjects(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      toast.success('Project created successfully!');
      refreshNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
      throw error;
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p._id !== projectId));
      toast.success('Project deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleStatusToggle = async (projectId, currentStatus) => {
    try {
      const response = await api.put(`/projects/${projectId}`, {
        isActive: !currentStatus
      });
      setProjects(prev => prev.map(p => (p._id === projectId ? response.data : p)));
      toast.success(`Project ${currentStatus ? 'archived' : 'activated'}!`);
    } catch (error) {
      toast.error('Failed to update project status');
    }
  };

  const handleCreateTaskInProject = async (taskData) => {
    try {
      await api.post('/tasks', taskData);
      setTaskModalProjectId(null);
      toast.success('Task created and assigned in project!');
      fetchProjects();
      refreshNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
      throw error;
    }
  };

  const canManage = ['admin', 'project_manager', 'super_admin'].includes(user?.role);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="text-muted">
            {projects.length} projects • {projects.filter(p => p.isActive).length} active
          </p>
        </div>

        <div className="header-actions">
          {canManage && (
            <button
              className="btn primary-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <FiPlus size={16} />
              New Project
            </button>
          )}
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-options">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Projects</option>
            <option value="active">Active Only</option>
            <option value="inactive">Archived</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <FiBriefcase className="empty-state-icon" />
          <h3>No projects found</h3>
          <p>Create your first project to organize tasks and collaborate with your team.</p>
          {canManage && (
            <button
              className="btn primary-btn mt-md"
              onClick={() => setShowCreateModal(true)}
            >
              <FiPlus size={16} />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              onDelete={handleDeleteProject}
              onStatusToggle={handleStatusToggle}
              onQuickAddTask={(pid) => setTaskModalProjectId(pid)}
              userRole={user?.role}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Quick Create Task Inside Specific Project Modal */}
      <Modal
        isOpen={!!taskModalProjectId}
        onClose={() => setTaskModalProjectId(null)}
        title="Create Task in Project"
      >
        <TaskForm
          projects={projects}
          defaultProjectId={taskModalProjectId || ''}
          onSubmit={handleCreateTaskInProject}
          onCancel={() => setTaskModalProjectId(null)}
        />
      </Modal>
    </div>
  );
};

export default Projects;
