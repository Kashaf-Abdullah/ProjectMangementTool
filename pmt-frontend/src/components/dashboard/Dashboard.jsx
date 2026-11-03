import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiBarChart2,
  FiDownload,
  FiMessageSquare,
  FiFolder
} from 'react-icons/fi';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import '../../styles/pages/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardAnalytics();
  }, []);

  const fetchDashboardAnalytics = async () => {
    try {
      const response = await api.get('/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!analytics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Projects', analytics.summary.totalProjects],
      ['Active Projects', analytics.summary.activeProjects],
      ['Total Tasks', analytics.summary.totalTasks],
      ['Completed Tasks', analytics.summary.completedTasks],
      ['In Progress Tasks', analytics.summary.inProgressTasks],
      ['Overdue Tasks', analytics.summary.overdueTasks],
      ['Completion Rate (%)', analytics.summary.completionRate],
      ['Team Members', analytics.summary.totalMembers],
      [],
      ['Project Name', 'Total Tasks', 'Completed', 'In Progress', 'Overdue', 'Completion %'],
      ...(analytics.projectStats || []).map(p => [
        p.name,
        p.totalTasks,
        p.completedTasks,
        p.inProgressTasks,
        p.overdueTasks,
        `${p.progress}%`
      ])
    ];

    const csvContent = rows
      .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics CSV report downloaded!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const summary = analytics?.summary || {
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    overdueTasks: 0,
    completionRate: 0
  };

  const projectStats = analytics?.projectStats || [];
  const statusDist = analytics?.statusDistribution || [];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">
            Welcome back, {user?.firstName}! Here is your real-time workspace overview.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/analytics" className="btn secondary-btn">
            <FiBarChart2 size={16} />
            Detailed Analytics
          </Link>
          <button className="btn primary-btn" onClick={handleExportReport}>
            <FiDownload size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Total Projects"
          value={summary.totalProjects}
          icon={<FiBriefcase />}
          color="#2563eb"
          link="/projects"
        />
        <StatsCard
          title="Active Projects"
          value={summary.activeProjects}
          icon={<FiBarChart2 />}
          color="#10b981"
          link="/projects"
        />
        <StatsCard
          title="Total Tasks"
          value={summary.totalTasks}
          icon={<FiCheckCircle />}
          color="#3b82f6"
          link="/tasks"
        />
        <StatsCard
          title="Completed Tasks"
          value={summary.completedTasks}
          icon={<FiCheckCircle />}
          color="#10b981"
          progress={summary.completionRate}
          link="/analytics"
        />
        <StatsCard
          title="Team Members"
          value={summary.totalMembers}
          icon={<FiUsers />}
          color="#7c3aed"
          link={['admin', 'project_manager', 'super_admin'].includes(user?.role) ? '/users' : null}
        />
        <StatsCard
          title="Overdue Tasks"
          value={summary.overdueTasks}
          icon={<FiClock />}
          color="#ef4444"
          link="/tasks"
        />
      </div>

      {/* Visual Analytics Snapshot Row */}
      <div className="dashboard-analytics-strip">
        <div className="dashboard-section">
          <div className="section-head-row">
            <h2>Project Progress</h2>
            <Link to="/projects" className="view-all-link">Manage Projects →</Link>
          </div>
          {projectStats.length === 0 ? (
            <p className="text-muted">No projects created yet.</p>
          ) : (
            <div className="mini-project-bars">
              {projectStats.slice(0, 5).map(proj => (
                <div key={proj._id} className="mini-proj-row">
                  <div className="mini-proj-top">
                    <Link to={`/projects/${proj._id}`} className="mini-proj-name">
                      <span className="project-dot" style={{ backgroundColor: proj.color }} />
                      {proj.name}
                    </Link>
                    <span className="mini-proj-meta tabular-nums">
                      {proj.completedTasks}/{proj.totalTasks} tasks ({proj.progress}%)
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${proj.progress}%`, backgroundColor: proj.color || '#2563eb' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-head-row">
            <h2>Task Status Breakdown</h2>
            <Link to="/analytics" className="view-all-link">Full Analytics →</Link>
          </div>
          <div className="mini-status-list">
            {statusDist.map(item => {
              const pct = summary.totalTasks > 0
                ? Math.round((item.count / summary.totalTasks) * 100)
                : 0;
              return (
                <div key={item.key} className="mini-status-item">
                  <div className="mini-status-head">
                    <span className="mini-status-label">
                      <span className="status-dot" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="tabular-nums">{item.count} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
                <FiBriefcase size={22} />
              </div>
              <h3>Projects</h3>
              <p>Create or manage projects</p>
            </Link>

            <Link to="/tasks" className="action-card">
              <div className="action-icon">
                <FiCheckCircle size={22} />
              </div>
              <h3>Tasks Board</h3>
              <p>Create & assign tasks</p>
            </Link>

            <Link to="/chat" className="action-card">
              <div className="action-icon">
                <FiMessageSquare size={22} />
              </div>
              <h3>Team Chat</h3>
              <p>Channels, DMs & @mentions</p>
            </Link>

            <Link to="/files" className="action-card">
              <div className="action-icon">
                <FiFolder size={22} />
              </div>
              <h3>Shared Files</h3>
              <p>Upload & download specs</p>
            </Link>

            <Link to="/analytics" className="action-card">
              <div className="action-icon">
                <FiBarChart2 size={22} />
              </div>
              <h3>Analytics</h3>
              <p>Team workload & velocity</p>
            </Link>

            {['admin', 'project_manager', 'super_admin'].includes(user?.role) && (
              <Link to="/users" className="action-card">
                <div className="action-icon">
                  <FiUsers size={22} />
                </div>
                <h3>Team Members</h3>
                <p>Add or invite members</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
