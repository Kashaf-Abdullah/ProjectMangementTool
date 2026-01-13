import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // Use your API service
import { 
  FiPlus, 
  FiEdit, 
  FiCheckCircle, 
  FiUserPlus,
  FiMessageSquare,
  FiCalendar
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import '../../styles/pages/dashboard.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Use your API service (which should have baseURL set)
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get('/projects/recent'),
        api.get('/tasks'),
        api.get('/users')
      ]);

      // Process projects
      const recentProjects = Array.isArray(projectsRes.data) 
        ? projectsRes.data.slice(0, 3).map(project => ({
            id: project._id,
            type: 'project',
            action: 'created',
            title: project.name,
            user: project.createdBy?.firstName || 'Unknown',
            timestamp: project.createdAt,
            icon: <FiPlus />,
            color: 'var(--primary-color)'
          }))
        : [];

      // Process tasks
      const recentTasks = Array.isArray(tasksRes.data)
        ? tasksRes.data.slice(0, 3).map(task => ({
            id: task._id,
            type: 'task',
            action: task.status === 'done' ? 'completed' : 'updated',
            title: task.title,
            user: task.assigneeId?.firstName || 'Unknown',
            timestamp: task.updatedAt || task.createdAt,
            icon: task.status === 'done' ? <FiCheckCircle /> : <FiEdit />,
            color: task.status === 'done' ? 'var(--success-color)' : 'var(--warning-color)'
          }))
        : [];

      // Process users
      const recentUsers = Array.isArray(usersRes.data)
        ? usersRes.data.slice(0, 2).map(user => ({
            id: user._id,
            type: 'user',
            action: 'joined',
            title: `${user.firstName} ${user.lastName}`,
            user: 'System',
            timestamp: user.createdAt,
            icon: <FiUserPlus />,
            color: 'var(--secondary-color)'
          }))
        : [];

      // Combine and sort
      const allActivities = [...recentProjects, ...recentTasks, ...recentUsers]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activity:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityMessage = (activity) => {
    const { user, action, title } = activity;
    const actions = {
      created: 'created',
      updated: 'updated',
      completed: 'completed',
      joined: 'joined'
    };
    
    return (
      <>
        <strong>{user}</strong> {actions[action]}{' '}
        <span className="activity-entity">{title}</span>
      </>
    );
  };

  if (loading) {
    return (
      <div className="activity-loading">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="activity-skeleton">
            <div className="skeleton-icon"></div>
            <div className="skeleton-content">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="empty-activity">
        <FiMessageSquare className="empty-icon" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className="activity-icon" style={{ backgroundColor: `${activity.color}20`, color: activity.color }}>
              {activity.icon}
            </div>
            <div className="activity-content">
              <div className="activity-message">
                {getActivityMessage(activity)}
              </div>
              <div className="activity-time">
                <FiCalendar size={12} />
                <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="activity-footer">
        <Link to="/activity" className="view-all-link">
          View all activity →
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;