import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiBarChart2,
  FiMessageSquare,
  FiFileText,
  FiPlus
} from 'react-icons/fi';
import Modal from '../common/Modal';
import ProjectForm from './ProjectForm';
import TaskForm from '../tasks/TaskForm';
import TaskCard from '../tasks/TaskCard';
import '../../styles/pages/projects.css';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  const currentUserId = user?._id || user?.id;
  const canManage = ['admin', 'project_manager', 'super_admin'].includes(user?.role);

  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const [projectsRes, projectTasksRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get(`/tasks/project/${projectId}`),
        api.get('/users?activeOnly=true')
      ]);

      const projectList = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      const foundProject = projectList.find(p => p._id === projectId);

      if (!foundProject) {
        toast.error('Project not found');
        navigate('/projects');
        return;
      }

      setAllProjects(projectList);
      setProject(foundProject);
      setTasks(Array.isArray(projectTasksRes.data) ? projectTasksRes.data : []);
      setMembers(Array.isArray(usersRes.data) ? usersRes.data : []);
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
      refreshNotifications();
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully!');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      if ((response.data.projectId?._id || response.data.projectId) === projectId) {
        setTasks(prev => [response.data, ...prev]);
      }
      setShowCreateTaskModal(false);
      toast.success('Task created & assigned! Notification sent.');
      fetchProjectDetails();
      refreshNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
      throw error;
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      const updatedPid = response.data.projectId?._id || response.data.projectId;
      if (updatedPid !== projectId) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      } else {
        setTasks(prev => prev.map(t => (t._id === taskId ? response.data : t)));
      }
      toast.success(updates.assigneeId ? 'Task reassigned & notified!' : 'Task updated!');
      refreshNotifications();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!project) return null;

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inReview = tasks.filter(t => t.status === 'review').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="project-details-page">
      <div className="project-detail-header">
        <div className="header-left">
          <Link to="/projects" className="back-link">
            <FiArrowLeft />
            Back to Projects
          </Link>
          <div className="project-title-section">
            <span
              className="project-color-swatch"
              style={{ backgroundColor: project.color || '#2563eb' }}
            />
            <h1>{project.name}</h1>
            <span className={`project-status ${project.isActive ? 'active' : 'archived'}`}>
              {project.isActive ? 'Active' : 'Archived'}
            </span>
          </div>
          {project.description && (
            <p className="project-description-lead">{project.description}</p>
          )}
        </div>

        <div className="header-actions">
          {canManage && (
            <>
              <button
                className="btn primary-btn"
                onClick={() => setShowCreateTaskModal(true)}
              >
                <FiPlus size={16} />
                New Task in Project
              </button>
              <button
                className="btn secondary-btn"
                onClick={() => setShowEditModal(true)}
              >
                <FiEdit size={15} />
                Edit
              </button>
              <button
                className="btn danger-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <FiTrash2 size={15} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="project-kpi-grid">
        <div className="project-kpi-card">
          <FiCheckCircle style={{ color: '#10b981' }} size={20} />
          <div>
            <div className="kpi-num">{completed}</div>
            <div className="kpi-lbl">Completed</div>
          </div>
        </div>
        <div className="project-kpi-card">
          <FiActivity style={{ color: '#3b82f6' }} size={20} />
          <div>
            <div className="kpi-num">{inProgress}</div>
            <div className="kpi-lbl">In Progress</div>
          </div>
        </div>
        <div className="project-kpi-card">
          <FiClock style={{ color: '#64748b' }} size={20} />
          <div>
            <div className="kpi-num">{todo}</div>
            <div className="kpi-lbl">To Do</div>
          </div>
        </div>
        <div className="project-kpi-card">
          <FiUsers style={{ color: '#7c3aed' }} size={20} />
          <div>
            <div className="kpi-num">{project.members?.length || 0}</div>
            <div className="kpi-lbl">Team Members</div>
          </div>
        </div>
        <div className="project-kpi-card">
          <FiBarChart2 style={{ color: '#2563eb' }} size={20} />
          <div>
            <div className="kpi-num">{progress}%</div>
            <div className="kpi-lbl">Completion</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="project-tabs">
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <FiCheckCircle />
          Tasks ({tasks.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiActivity />
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <FiUsers />
          Team ({project.members?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <FiMessageSquare />
          Activity
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'tasks' && (
          <div className="tasks-content">
            <div className="section-toolbar">
              <h3>Tasks in {project.name}</h3>
              <div className="header-actions">
                <Link to={`/tasks?project=${project._id}`} className="btn secondary-btn btn-sm">
                  Open in Kanban Board
                </Link>
                {canManage && (
                  <button
                    className="btn primary-btn btn-sm"
                    onClick={() => setShowCreateTaskModal(true)}
                  >
                    <FiPlus size={14} />
                    Add Task
                  </button>
                )}
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <FiFileText className="empty-state-icon" />
                <h3>No tasks yet for {project.name}</h3>
                <p>Create and assign the first task for this project.</p>
                {canManage && (
                  <button
                    className="btn primary-btn mt-md"
                    onClick={() => setShowCreateTaskModal(true)}
                  >
                    <FiPlus size={15} />
                    Create First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="project-tasks-grid">
                {tasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    projects={allProjects}
                    members={members}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    userRole={user?.role}
                    userId={currentUserId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="overview-section">
              <h3>Overall Completion</h3>
              <div className="progress-bar large">
                <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: '#2563eb' }} />
              </div>
              <div className="progress-stats">
                <span>{completed} of {total} tasks completed</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
            </div>

            <div className="overview-section">
              <h3>Status Breakdown</h3>
              <div className="status-distribution">
                {[
                  { status: 'To Do', count: todo, color: '#64748b' },
                  { status: 'In Progress', count: inProgress, color: '#3b82f6' },
                  { status: 'In Review', count: inReview, color: '#f59e0b' },
                  { status: 'Done', count: completed, color: '#10b981' }
                ].map((item, idx) => (
                  <div key={idx} className="status-dist-row">
                    <div className="status-dist-label">
                      <span className="status-dot" style={{ backgroundColor: item.color }} />
                      <span>{item.status}</span>
                    </div>
                    <span className="status-dist-count tabular-nums">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-content">
            <h3>Assigned Project Team</h3>
            {!project.members || project.members.length === 0 ? (
              <div className="empty-state">
                <FiUsers className="empty-state-icon" />
                <p>No members assigned yet.</p>
              </div>
            ) : (
              <div className="team-grid">
                {project.members.map(member => (
                  <div key={member._id} className="team-member-card">
                    <div className="member-avatar">
                      {member.firstName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.firstName} {member.lastName}</div>
                      <div className="member-role">{member.role?.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-content">
            <h3>Recent Project Activity</h3>
            {tasks.length === 0 ? (
              <p className="text-muted">No task activity recorded yet for this project.</p>
            ) : (
              <div className="project-activity-feed">
                {tasks.slice(0, 10).map(t => (
                  <div key={t._id} className="project-activity-row">
                    <span className="status-dot" style={{ backgroundColor: t.status === 'done' ? '#10b981' : '#3b82f6' }} />
                    <div>
                      <strong>{t.assigneeId?.firstName || 'Unassigned'}</strong> — "{t.title}" is currently{' '}
                      <span className="capitalize">{t.status.replace('_', ' ')}</span>
                      <div className="text-muted">
                        Updated {formatDistanceToNow(new Date(t.updatedAt || t.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
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

      {/* Create Task in This Project Modal */}
      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        title={`Create Task in ${project.name}`}
      >
        <TaskForm
          projects={allProjects}
          defaultProjectId={project._id}
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateTaskModal(false)}
        />
      </Modal>

      {/* Delete Project Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Project"
        size="small"
      >
        <div className="confirm-dialog-body">
          <p>Are you sure you want to permanently delete <strong>"{project.name}"</strong> and all its tasks?</p>
          <div className="form-actions">
            <button className="btn secondary-btn" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
            <button className="btn danger-btn" onClick={handleDeleteProject}>
              Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
