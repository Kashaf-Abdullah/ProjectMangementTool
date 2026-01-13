import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit, 
  FiTrash2,
  FiUsers,
  FiCalendar,
  FiCheckCircle
} from 'react-icons/fi';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import Modal from '../common/Modal';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, filterStatus]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project =>
        filterStatus === 'active' ? project.isActive : !project.isActive
      );
    }

    setFilteredProjects(filtered);
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      setProjects([response.data, ...projects]);
      setShowCreateModal(false);
      toast.success('Project created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
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
      
      setProjects(projects.map(p => 
        p._id === projectId ? response.data : p
      ));
      
      toast.success(`Project ${currentStatus ? 'archived' : 'activated'}!`);
    } catch (error) {
      toast.error('Failed to update project status');
    }
  };

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
          {['admin', 'project_manager'].includes(user?.role) && (
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

      {/* Filters */}
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

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          {/* <FiBriefcase className="empty-state-icon" /> */}
          <h3>No projects found</h3>
          <p>Create your first project to get started</p>
          {['admin', 'project_manager'].includes(user?.role) && (
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
    </div>
  );
};

export default Projects;