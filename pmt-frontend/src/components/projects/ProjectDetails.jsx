import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiUsers, 
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiBarChart2,
  FiMessageSquare,
  FiFileText
} from 'react-icons/fi';
import Modal from '../common/Modal';
import ProjectForm from './ProjectForm';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects`).then(res => 
          res.data.find(p => p._id === projectId)
        ),
        api.get('/tasks').then(res =>
          res.data.filter(t => t.projectId?._id === projectId)
        )
      ]);

      if (!projectRes) {
        toast.error('Project not found');
        navigate('/projects');
        return;
      }

      setProject(projectRes);
      setTasks(tasksRes);
    } catch (error) {
      toast.error('Failed to load project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (updatedData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, updatedData);
      setProject(response.data);
      setShowEditModal(false);
      toast.success('Project updated successfully!');
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully!');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inReview = tasks.filter(t => t.status === 'review').length;

    return {
      total,
      completed,
      inProgress,
      todo,
      inReview,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="not-found">
        <h2>Project not found</h2>
        <Link to="/projects" className="btn primary-btn">
          <FiArrowLeft />
          Back to Projects
        </Link>
      </div>
    );
  }

  const taskStats = getTaskStats();
  const canEdit = ['admin', 'project_manager'].includes(user?.role);

  return (
    <div className="project-details">
      {/* Header */}
      <div className="project-header">
        <div className="header-left">
          <Link to="/projects" className="back-link">
            <FiArrowLeft />
            Back to Projects
          </Link>
          <div className="project-title-section">
            <div 
              className="project-color" 
              style={{ backgroundColor: project.color }}
            />
            <h1>{project.name}</h1>
            <span className={`project-status ${project.isActive ? 'active' : 'archived'}`}>
              {project.isActive ? 'Active' : 'Archived'}
            </span>
          </div>
          <p className="project-description">{project.description}</p>
        </div>

        <div className="header-actions">
          {canEdit && (
            <>
              <button 
                className="btn secondary-btn"
                onClick={() => setShowEditModal(true)}
              >
                <FiEdit />
                Edit
              </button>
              <button 
                className="btn danger-btn"
                onClick={handleDeleteProject}
              >
                <FiTrash2 />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <FiCheckCircle className="stat-icon" style={{ color: 'var(--success-color)' }} />
          <div className="stat-value">{taskStats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <FiActivity className="stat-icon" style={{ color: 'var(--info-color)' }} />
          <div className="stat-value">{taskStats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <FiClock className="stat-icon" style={{ color: 'var(--warning-color)' }} />
          <div className="stat-value">{taskStats.todo}</div>
          <div className="stat-label">To Do</div>
        </div>
        <div className="stat-card">
          <FiUsers className="stat-icon" style={{ color: 'var(--secondary-color)' }} />
          <div className="stat-value">{project.members?.length || 0}</div>
          <div className="stat-label">Members</div>
        </div>
        <div className="stat-card">
          <FiBarChart2 className="stat-icon" style={{ color: 'var(--primary-color)' }} />
          <div className="stat-value">{taskStats.progress}%</div>
          <div className="stat-label">Progress</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="project-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiActivity />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <FiCheckCircle />
          Tasks ({tasks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <FiUsers />
          Team
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <FiMessageSquare />
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="overview-section">
              <h3>Progress Overview</h3>
              <div className="progress-container">
                <div className="progress-bar large">
                  <div 
                    className="progress-fill"
                    style={{ width: `${taskStats.progress}%` }}
                  />
                </div>
                <div className="progress-stats">
                  <span>{taskStats.completed} of {taskStats.total} tasks completed</span>
                  <span>{taskStats.progress}%</span>
                </div>
              </div>
            </div>

            <div className="overview-section">
              <h3>Task Status Distribution</h3>
              <div className="status-distribution">
                {[
                  { status: 'To Do', count: taskStats.todo, color: '#64748b' },
                  { status: 'In Progress', count: taskStats.inProgress, color: '#3b82f6' },
                  { status: 'Review', count: taskStats.inReview, color: '#f59e0b' },
                  { status: 'Done', count: taskStats.completed, color: '#10b981' }
                ].map((item, index) => (
                  <div key={index} className="status-item">
                    <div className="status-info">
                      <div 
                        className="status-color" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="status-name">{item.status}</span>
                    </div>
                    <span className="status-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-content">
            <div className="tasks-header">
              <h3>Project Tasks</h3>
              <Link to="/tasks" className="btn secondary-btn">
                View All Tasks
              </Link>
            </div>
            
            {tasks.length === 0 ? (
              <div className="empty-tasks">
                <FiFileText className="empty-icon" />
                <p>No tasks yet for this project</p>
                <Link to="/tasks" className="btn primary-btn">
                  Create Task
                </Link>
              </div>
            ) : (
              <div className="tasks-list">
                {tasks.slice(0, 10).map(task => (
                  <div key={task._id} className="task-item">
                    <div className="task-info">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span className={`task-status ${task.status}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className="task-priority">{task.priority}</span>
                      </div>
                    </div>
                    <div className="task-assignee">
                      {task.assigneeId?.firstName || 'Unassigned'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-content">
            <h3>Project Team</h3>
            {project.members?.length === 0 ? (
              <div className="empty-team">
                <FiUsers className="empty-icon" />
                <p>No team members assigned yet</p>
              </div>
            ) : (
              <div className="team-grid">
                {project.members?.map(member => (
                  <div key={member._id} className="team-member">
                    <div className="member-avatar">
                      {member.firstName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <div className="member-name">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="member-role">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
      >
        <ProjectForm
          project={project}
          onSubmit={handleUpdateProject}
          onCancel={() => setShowEditModal(false)}
          mode="edit"
        />
      </Modal>
    </div>
  );
};

export default ProjectDetails;