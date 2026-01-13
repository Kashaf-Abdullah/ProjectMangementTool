import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUser, 
  FiCalendar, 
  FiFlag, 
  FiEdit, 
  FiTrash2,
  FiMessageSquare,
  FiPaperclip,
  FiMoreVertical
} from 'react-icons/fi';
import { format } from 'date-fns';

const TaskCard = ({ task, onUpdate, onDelete, userRole, userId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#64748b'
    };
    return colors[priority] || '#64748b';
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: '#64748b',
      in_progress: '#3b82f6',
      review: '#f59e0b',
      done: '#10b981'
    };
    return colors[status] || '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return format(date, 'MMM d');
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const canEdit = ['admin', 'project_manager'].includes(userRole) || 
                  (task.assigneeId?._id === userId);

  const handleStatusChange = (newStatus) => {
    onUpdate(task._id, { status: newStatus });
  };

  const handlePriorityChange = (newPriority) => {
    onUpdate(task._id, { priority: newPriority });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task._id);
    }
  };

  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-header">
        <div className="task-meta">
          <Link to={`/projects/${task.projectId?._id}`} className="project-link">
            {task.projectId?.name}
          </Link>
          <div className="task-actions">
            <button 
              className="menu-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <FiMoreVertical size={14} />
            </button>
            
            {showMenu && (
              <div className="dropdown-menu">
                {canEdit && (
                  <>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowEdit(true);
                        setShowMenu(false);
                      }}
                    >
                      <FiEdit size={14} />
                      Edit
                    </button>
                    <div className="dropdown-divider"></div>
                  </>
                )}
                
                <div className="status-options">
                  <div className="dropdown-label">Change Status</div>
                  {['todo', 'in_progress', 'review', 'done'].map(status => (
                    <button
                      key={status}
                      className={`status-option ${task.status === status ? 'active' : ''}`}
                      onClick={() => handleStatusChange(status)}
                    >
                      <div 
                        className="status-dot" 
                        style={{ backgroundColor: getStatusColor(status) }}
                      />
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                
                <div className="priority-options">
                  <div className="dropdown-label">Change Priority</div>
                  {['low', 'medium', 'high', 'urgent'].map(priority => (
                    <button
                      key={priority}
                      className={`priority-option ${task.priority === priority ? 'active' : ''}`}
                      onClick={() => handlePriorityChange(priority)}
                    >
                      <div 
                        className="priority-dot" 
                        style={{ backgroundColor: getPriorityColor(priority) }}
                      />
                      {priority}
                    </button>
                  ))}
                </div>
                
                {(userRole === 'admin' || userRole === 'project_manager') && (
                  <>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item delete"
                      onClick={handleDelete}
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="task-body">
        <h4 className="task-title">{task.title}</h4>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        
        {task.labels && task.labels.length > 0 && (
          <div className="task-labels">
            {task.labels.map((label, index) => (
              <span key={index} className="label-tag">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="task-footer">
        <div className="task-info">
          <div className="assignee-info">
            <FiUser size={12} />
            <span>{task.assigneeId?.firstName || 'Unassigned'}</span>
          </div>
          
          {task.dueDate && (
            <div className={`due-date ${isOverdue ? 'overdue' : ''}`}>
              <FiCalendar size={12} />
              <span>{formatDate(task.dueDate)}</span>
              {isOverdue && <span className="overdue-badge">Overdue</span>}
            </div>
          )}
        </div>

        <div className="task-badges">
          <div 
            className="priority-badge"
            style={{ 
              backgroundColor: `${getPriorityColor(task.priority)}20`,
              color: getPriorityColor(task.priority)
            }}
          >
            <FiFlag size={10} />
            <span>{task.priority}</span>
          </div>
          
          <div 
            className="status-badge"
            style={{ 
              backgroundColor: `${getStatusColor(task.status)}20`,
              color: getStatusColor(task.status)
            }}
          >
            {task.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {(task.attachments?.length > 0 || task.comments?.length > 0) && (
        <div className="task-meta-footer">
          {task.attachments?.length > 0 && (
            <div className="attachments-info">
              <FiPaperclip size={12} />
              <span>{task.attachments.length}</span>
            </div>
          )}
          
          {task.comments?.length > 0 && (
            <div className="comments-info">
              <FiMessageSquare size={12} />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;