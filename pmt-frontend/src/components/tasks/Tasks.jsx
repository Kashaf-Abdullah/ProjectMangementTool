import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiCalendar,
  FiUser,
  FiFlag,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import Modal from '../common/Modal';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    project: 'all',
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, filters]);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects')
      ]);
      
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Project filter
    if (filters.project !== 'all') {
      filtered = filtered.filter(task => 
        task.projectId._id === filters.project
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Assignee filter
    if (filters.assignee !== 'all') {
      filtered = filtered.filter(task => 
        task.assigneeId._id === filters.assignee
      );
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      setTasks([response.data, ...tasks]);
      setShowCreateModal(false);
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      setTasks(tasks.map(task => 
        task._id === taskId ? response.data : task
      ));
      toast.success('Task updated!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted!');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Only update if status changed
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId;
      
      try {
        await handleUpdateTask(draggableId, { status: newStatus });
      } catch (error) {
        toast.error('Failed to update task status');
      }
    }
  };

  const statusColumns = [
    { id: 'todo', title: 'To Do', color: '#64748b' },
    { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'review', title: 'Review', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#10b981' }
  ];

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
            {tasks.length} total tasks • {tasks.filter(t => t.status === 'done').length} completed
          </p>
        </div>
        
        <div className="header-actions">
          {['admin', 'project_manager'].includes(user?.role) && (
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

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-grid">
          <select 
            value={filters.project}
            onChange={(e) => setFilters({...filters, project: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          
          <select 
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="filter-select"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {statusColumns.map(column => {
            const columnTasks = filteredTasks.filter(task => task.status === column.id);
            
            return (
              <div key={column.id} className="kanban-column">
                <div className="column-header">
                  <div className="column-title" style={{ borderLeftColor: column.color }}>
                    <h3>{column.title}</h3>
                    <span className="task-count">{columnTasks.length}</span>
                  </div>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`tasks-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable 
                          key={task._id} 
                          draggableId={task._id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <TaskCard
                                task={task}
                                onUpdate={handleUpdateTask}
                                onDelete={handleDeleteTask}
                                userRole={user?.role}
                                userId={user?._id}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
      >
        <TaskForm
          projects={projects}
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Tasks;