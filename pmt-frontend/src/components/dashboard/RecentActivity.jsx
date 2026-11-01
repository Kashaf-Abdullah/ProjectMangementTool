import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
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
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get('/projects/recent'),
        api.get('/tasks?limit=8'),
        api.get('/users?activeOnly=true')
      ]);

      const recentProjects = Array.isArray(projectsRes.data)
        ? projectsRes.data.slice(0, 3).map(project => ({
            id: `proj-${project._id}`,
            type: 'project',
            action: 'created project',
            title: project.name,
            user: project.projectManagerId?.firstName || 'Admin',
            timestamp: project.createdAt,
            icon: <FiPlus />,
            color: '#2563eb'
          }))
        : [];

      const recentTasks = Array.isArray(tasksRes.data)
        ? tasksRes.data.slice(0, 5).map(task => ({
            id: `task-${task._id}`,
            type: 'task',
            action: task.status === 'done'
              ? 'completed task'
              : `assigned/updated in ${task.projectId?.name || 'project'}:`,
            title: task.title,
            user: task.assigneeId?.firstName || 'Team',
            timestamp: task.updatedAt || task.createdAt,
            icon: task.status === 'done' ? <FiCheckCircle /> : <FiEdit />,
            color: task.status === 'done' ? '#10b981' : '#f59e0b'
          }))
        : [];

      const recentUsers = Array.isArray(usersRes.data)
        ? usersRes.data.slice(0, 2).map(member => ({
            id: `usr-${member._id}`,
            type: 'user',
            action: 'joined workspace',
            title: `${member.firstName} ${member.lastName}`,
            user: 'Member',
            timestamp: member.createdAt,
            icon: <FiUserPlus />,
            color: '#7c3aed'
          }))
        : [];

      const allActivities = [...recentProjects, ...recentTasks, ...recentUsers]
        .filter(a => a.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activity:', error.message);
    } finally {
      setLoading(false);
    }
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
        <p>No recent activity yet</p>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div
              className="activity-icon"
              style={{ backgroundColor: `${activity.color}18`, color: activity.color }}
            >
              {activity.icon}
            </div>
            <div className="activity-content">
              <div className="activity-message">
                <strong>{activity.user}</strong> {activity.action}{' '}
                <span className="activity-entity">{activity.title}</span>
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
        <Link to="/analytics" className="view-all-link">
          View full analytics & workload →
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;
