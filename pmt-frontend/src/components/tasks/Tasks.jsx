import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useRealtime } from '../../context/RealtimeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiCalendar,
  FiBarChart2,
  FiUser,
  FiMessageSquare
} from 'react-icons/fi';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskCommentsModal from './TaskCommentsModal';
import TaskScheduleViews from './TaskScheduleViews';
import Modal from '../common/Modal';
import '../../styles/pages/tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { subscribe } = useRealtime();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUserId = user?._id || user?.id;
  const initialProjectFilter = searchParams.get('project') || 'all';
  const focusedTaskParam = searchParams.get('task');

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);
  const [viewMode, setViewMode] = useState('board');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    project: initialProjectFilter,
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Open task comments modal automatically if deep-linked via ?task=...
  useEffect(() => {
    if (focusedTaskParam && tasks.length > 0) {
      const target = tasks.find((t) => t._id === focusedTaskParam);
      if (target) {
        setSelectedTaskForComments(target);
      }
    }
  }, [focusedTaskParam, tasks]);

  useEffect(() => {
    const unsubCreated = subscribe('task:created', (evt) => {
      if (!evt.task) return;
      setTasks((prev) =>
        prev.some((t) => t._id === evt.task._id) ? prev : [evt.task, ...prev]
      );
    });

    const unsubUpdated = subscribe('task:updated', (evt) => {
      if (!evt.task) return;
      setTasks((prev) => prev.map((t) => (t._id === evt.task._id ? evt.task : t)));
    });

    const unsubDeleted = subscribe('task:deleted', (evt) => {
      if (!evt.taskId) return;
      setTasks((prev) => prev.filter((t) => t._id !== evt.taskId));
    });

    const unsubComment = subscribe('task:comment_added', (evt) => {
      if (evt.task) {
        setTasks((prev) => prev.map((t) => (t._id === evt.task._id ? evt.task : t)));
      }
    });

    const unsubCommentDel = subscribe('task:comment_deleted', (evt) => {
      if (evt.task) {
        setTasks((prev) => prev.map((t) => (t._id === evt.task._id ? evt.task : t)));
      }
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
      unsubComment();
      unsubCommentDel();
    };
  }, [subscribe]);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/users?activeOnly=true')
      ]);

      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setMembers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (error) {
      toast.error('Failed to load tasks data');
    } finally {
      setLoading(false);
    }
  };

  const getId = (val) => (typeof val === 'object' && val !== null ? val._id : val);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = task.title?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchProj = task.projectId?.name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchProj) return false;
      }

      if (filters.project !== 'all') {
        if (getId(task.projectId) !== filters.project) return false;
      }

      if (filters.status !== 'all') {
        if (task.status !== filters.status) return false;
      }

      if (filters.priority !== 'all') {
        if (task.priority !== filters.priority) return false;
      }

      if (filters.assignee !== 'all') {
        const targetAssignee = filters.assignee === 'me' ? currentUserId : filters.assignee;
        if (getId(task.assigneeId) !== targetAssignee) return false;
      }

      return true;
    });
  }, [tasks, searchTerm, filters, currentUserId]);

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      setTasks(prev => (prev.some(t => t._id === response.data._id) ? prev : [response.data, ...prev]));
      setShowCreateModal(false);
      toast.success('Task created and assigned! Notification sent.');
      refreshNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
      throw error;
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      setTasks(prev => prev.map(task => (task._id === taskId ? response.data : task)));
      toast.success(updates.assigneeId ? 'Task reassigned & member notified!' : 'Task updated!');
      refreshNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
      throw error;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleSyncSingleTask = (updatedTask) => {
    if (!updatedTask) return;
    setTasks(prev => prev.map(t => (t._id === updatedTask._id ? updatedTask : t)));
  };

  const handleDropOnColumn = async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;

    const targetTask = tasks.find(t => t._id === taskId);
    if (!targetTask || targetTask.status === newStatus) return;

    await handleUpdateTask(taskId, { status: newStatus });
  };

  const statusColumns = [
    { id: 'todo', title: 'To Do', color: '#64748b' },
    { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'review', title: 'In Review', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#10b981' }
  ];

  const canCreateTask = ['admin', 'project_manager', 'super_admin'].includes(user?.role);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="text-muted">
            {filteredTasks.length} shown of {tasks.length} total tasks • Click any task to comment, @mention, or share files
          </p>
        </div>

        <div className="header-actions">
          <div className="view-toggle">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
              title="Kanban Board"
            >
              <FiGrid size={15} />
              Board
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FiList size={15} />
              List
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Weekly and monthly calendar"
            >
              <FiCalendar size={15} />
              Calendar
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
              title="Project timeline and Gantt chart"
            >
              <FiBarChart2 size={15} />
              Timeline
            </button>
          </div>

          {canCreateTask && (
            <button
              className="btn primary-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <FiPlus size={16} />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Multi-Project & Member Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks or projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-grid">
          <select
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Members</option>
            <option value="me">Assigned to Me</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'calendar' || viewMode === 'timeline' ? (
        <TaskScheduleViews
          viewMode={viewMode}
          tasks={filteredTasks}
          projects={projects}
          members={members}
          onSelectTask={setSelectedTaskForComments}
        />
      ) : viewMode === 'board' ? (
        <div className="kanban-board">
          {statusColumns.map(column => {
            const columnTasks = filteredTasks.filter(task => task.status === column.id);

            return (
              <div
                key={column.id}
                className={`kanban-column ${dragOverCol === column.id ? 'dragging-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(column.id);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDropOnColumn(e, column.id)}
              >
                <div className="column-header">
                  <div className="column-title">
                    <span className="column-dot" style={{ backgroundColor: column.color }} />
                    <h3>{column.title}</h3>
                    <span className="task-count">{columnTasks.length}</span>
                  </div>
                </div>

                <div className="tasks-list">
                  {columnTasks.length === 0 ? (
                    <div className="empty-column-drop">
                      Drop tasks here
                    </div>
                  ) : (
                    columnTasks.map(task => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTaskId(task._id);
                          e.dataTransfer.setData('text/plain', task._id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        className={`task-item-wrapper ${draggedTaskId === task._id ? 'dragging' : ''}`}
                      >
                        <TaskCard
                          task={task}
                          projects={projects}
                          members={members}
                          onUpdate={handleUpdateTask}
                          onDelete={handleDeleteTask}
                          onTaskSynced={handleSyncSingleTask}
                          userRole={user?.role}
                          userId={currentUserId}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="tasks-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assigned Member</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No tasks match your current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task._id}>
                    <td>
                      <div
                        className="table-task-title"
                        style={{ cursor: 'pointer', color: '#2563eb' }}
                        onClick={() => setSelectedTaskForComments(task)}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="table-task-desc">{task.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="table-project-tag">
                        <span
                          className="project-dot"
                          style={{ backgroundColor: task.projectId?.color || '#2563eb' }}
                        />
                        {task.projectId?.name || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className="table-member-cell">
                        <FiUser size={13} />
                        {task.assigneeId
                          ? `${task.assigneeId.firstName} ${task.assigneeId.lastName}`
                          : 'Unassigned'}
                      </span>
                    </td>
                    <td className="capitalize">{task.priority}</td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                        className="inline-status-select"
                        disabled={!canCreateTask && getId(task.assigneeId) !== currentUserId}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="task-collab-Trigger"
                        onClick={() => setSelectedTaskForComments(task)}
                      >
                        <FiMessageSquare size={12} />
                        <span>{task.commentCount || 0}</span>
                      </button>
                    </td>
                    <td>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Deep-linked or Table-triggered Task Comments Modal */}
      <TaskCommentsModal
        isOpen={Boolean(selectedTaskForComments)}
        onClose={() => {
          setSelectedTaskForComments(null);
          if (focusedTaskParam) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('task');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        task={selectedTaskForComments}
        members={members}
        userId={currentUserId}
        userRole={user?.role}
        onTaskUpdated={handleSyncSingleTask}
      />

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create & Assign New Task"
      >
        <TaskForm
          projects={projects}
          defaultProjectId={filters.project !== 'all' ? filters.project : ''}
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Tasks;
