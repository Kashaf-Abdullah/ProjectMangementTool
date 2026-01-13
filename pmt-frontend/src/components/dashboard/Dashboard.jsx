import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FiUsers, 
  FiBriefcase, 
  FiCheckCircle, 
  FiClock,
  FiBarChart2,
  FiActivity
} from 'react-icons/fi';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import '../../styles/pages/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalUsers: 0,
    overdueTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/users')
      ]);

      const projects = projectsRes.data;
      const tasks = tasksRes.data;
      const users = usersRes.data;

      const completedTasks = tasks.filter(task => task.status === 'done').length;
      const overdueTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date() && task.status !== 'done';
      }).length;

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.isActive).length,
        totalTasks: tasks.length,
        completedTasks,
        totalUsers: users.length,
        overdueTasks
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.firstName}!</p>
        </div>
        <div className="header-actions">
          <button className="btn primary-btn">
            <FiActivity size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<FiBriefcase />}
          color="var(--primary-color)"
          link="/projects"
        />
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={<FiBarChart2 />}
          color="var(--success-color)"
          link="/projects"
        />
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={<FiCheckCircle />}
          color="var(--info-color)"
          link="/tasks"
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={<FiCheckCircle />}
          color="var(--success-color)"
          progress={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}
        />
        <StatsCard
          title="Team Members"
          value={stats.totalUsers}
          icon={<FiUsers />}
          color="var(--secondary-color)"
          link={user?.role === 'admin' ? '/users' : null}
        />
        <StatsCard
          title="Overdue Tasks"
          value={stats.overdueTasks}
          icon={<FiClock />}
          color="var(--danger-color)"
          link="/tasks"
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <RecentActivity />
        </div>

        <div className="dashboard-section quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/projects" className="action-card">
              <div className="action-icon">
                <FiBriefcase size={24} />
              </div>
              <h3>Create Project</h3>
              <p>Start a new project</p>
            </Link>
            
            <Link to="/tasks" className="action-card">
              <div className="action-icon">
                <FiCheckCircle size={24} />
              </div>
              <h3>Add Task</h3>
              <p>Create a new task</p>
            </Link>
            
            {user?.role === 'admin' && (
              <>
                <Link to="/users" className="action-card">
                  <div className="action-icon">
                    <FiUsers size={24} />
                  </div>
                  <h3>Invite User</h3>
                  <p>Add team member</p>
                </Link>
                
                <Link to="/billing" className="action-card">
                  <div className="action-icon">
                    <FiBarChart2 size={24} />
                  </div>
                  <h3>Upgrade Plan</h3>
                  <p>Add more users</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;