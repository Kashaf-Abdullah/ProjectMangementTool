import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiUsers,
  FiBriefcase,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import '../../styles/pages/analytics.css';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsList();
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedProject);
  }, [selectedProject]);

  const fetchProjectsList = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load projects for filter:', err);
    }
  };

  const fetchAnalytics = async (projectId = 'all') => {
    setLoading(true);
    try {
      const query = projectId && projectId !== 'all' ? `?projectId=${projectId}` : '';
      const response = await api.get(`/analytics${query}`);
      setData(response.data);
    } catch (err) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Workspace Analytics Summary'],
      ['Completion Rate', `${data.summary.completionRate}%`],
      ['Total Tasks', data.summary.totalTasks],
      ['Completed Tasks', data.summary.completedTasks],
      ['In Progress Tasks', data.summary.inProgressTasks],
      ['Overdue Tasks', data.summary.overdueTasks],
      ['Active Projects', data.summary.activeProjects],
      ['Team Members', data.summary.totalMembers],
      [],
      ['Team Member Workload'],
      ['Member', 'Role', 'Assigned', 'Completed', 'In Progress', 'Overdue', 'Completion Rate'],
      ...(data.memberWorkload || []).map(m => [
        m.name,
        m.role,
        m.assignedTasks,
        m.completedTasks,
        m.inProgressTasks,
        m.overdueTasks,
        `${m.completionRate}%`
      ]),
      [],
      ['Project Performance'],
      ['Project', 'Lead', 'Total Tasks', 'Completed', 'In Progress', 'Overdue', 'Progress'],
      ...(data.projectStats || []).map(p => [
        p.name,
        p.managerName,
        p.totalTasks,
        p.completedTasks,
        p.inProgressTasks,
        p.overdueTasks,
        `${p.progress}%`
      ])
    ];

    const csv = rows
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV Analytics exported!');
  };

  if (loading && !data) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const statusDistribution = data?.statusDistribution || [];
  const priorityDistribution = data?.priorityDistribution || [];
  const projectStats = data?.projectStats || [];
  const memberWorkload = data?.memberWorkload || [];
  const weeklyTrend = data?.weeklyTrend || [];

  const maxTrendVal = Math.max(
    1,
    ...weeklyTrend.map(d => Math.max(d.created || 0, d.completed || 0))
  );

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Workspace Analytics</h1>
          <p className="text-muted">
            Real-time project completion, task distribution, and team member performance
          </p>
        </div>

        <div className="header-actions">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          <button
            type="button"
            className="btn secondary-btn"
            onClick={() => fetchAnalytics(selectedProject)}
          >
            <FiRefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            className="btn primary-btn"
            onClick={handleExportCSV}
          >
            <FiDownload size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <div className="kpi-icon-box" style={{ backgroundColor: '#10b98118', color: '#10b981' }}>
            <FiCheckCircle size={20} />
          </div>
          <div>
            <div className="kpi-label">Completion Rate</div>
            <div className="kpi-value tabular-nums">{summary.completionRate || 0}%</div>
            <div className="kpi-sub">{summary.completedTasks || 0} of {summary.totalTasks || 0} tasks done</div>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon-box" style={{ backgroundColor: '#3b82f618', color: '#3b82f6' }}>
            <FiBarChart2 size={20} />
          </div>
          <div>
            <div className="kpi-label">Active Workload</div>
            <div className="kpi-value tabular-nums">{summary.inProgressTasks || 0}</div>
            <div className="kpi-sub">{summary.reviewTasks || 0} waiting in review</div>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon-box" style={{ backgroundColor: '#ef444418', color: '#ef4444' }}>
            <FiAlertTriangle size={20} />
          </div>
          <div>
            <div className="kpi-label">Overdue Tasks</div>
            <div className="kpi-value tabular-nums">{summary.overdueTasks || 0}</div>
            <div className="kpi-sub">{summary.todoTasks || 0} still in To Do</div>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon-box" style={{ backgroundColor: '#7c3aed18', color: '#7c3aed' }}>
            <FiUsers size={20} />
          </div>
          <div>
            <div className="kpi-label">Avg Tasks / Member</div>
            <div className="kpi-value tabular-nums">{summary.avgTasksPerMember || 0}</div>
            <div className="kpi-sub">{summary.totalMembers || 0} active members</div>
          </div>
        </div>
      </div>

      {/* Charts Grid: 7-Day Velocity + Status & Priority Distributions */}
      <div className="analytics-charts-grid">
        {/* 7-Day Task Velocity Bar Chart */}
        <div className="analytics-panel">
          <div className="panel-header">
            <h3>7-Day Task Activity</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-swatch" style={{ backgroundColor: '#3b82f6' }} /> Created
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ backgroundColor: '#10b981' }} /> Completed
              </span>
            </div>
          </div>

          <div className="velocity-chart">
            {weeklyTrend.map((day) => {
              const createdHeight = Math.max(6, Math.round((day.created / maxTrendVal) * 140));
              const completedHeight = Math.max(6, Math.round((day.completed / maxTrendVal) * 140));
              return (
                <div key={day.date} className="velocity-col" title={day.label}>
                  <div className="velocity-bars">
                    <div className="bar-wrap">
                      <span className="bar-num tabular-nums">{day.created}</span>
                      <div
                        className="bar-fill created"
                        style={{ height: `${day.created === 0 ? 4 : createdHeight}px` }}
                      />
                    </div>
                    <div className="bar-wrap">
                      <span className="bar-num tabular-nums">{day.completed}</span>
                      <div
                        className="bar-fill completed"
                        style={{ height: `${day.completed === 0 ? 4 : completedHeight}px` }}
                      />
                    </div>
                  </div>
                  <div className="velocity-day">{day.shortLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status & Priority Breakdown */}
        <div className="analytics-panel">
          <div className="panel-header">
            <h3>Tasks by Status & Priority</h3>
          </div>

          <div className="distribution-group">
            <h4 className="sub-heading">By Status</h4>
            {statusDistribution.map(st => {
              const pct = summary.totalTasks > 0
                ? Math.round((st.count / summary.totalTasks) * 100)
                : 0;
              return (
                <div key={st.key} className="dist-bar-row">
                  <div className="dist-bar-meta">
                    <span>
                      <span className="status-dot" style={{ backgroundColor: st.color }} />
                      {st.label}
                    </span>
                    <span className="tabular-nums">{st.count} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: st.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="distribution-group mt-lg">
            <h4 className="sub-heading">By Priority</h4>
            {priorityDistribution.map(pr => {
              const pct = summary.totalTasks > 0
                ? Math.round((pr.count / summary.totalTasks) * 100)
                : 0;
              return (
                <div key={pr.key} className="dist-bar-row">
                  <div className="dist-bar-meta">
                    <span>
                      <span className="status-dot" style={{ backgroundColor: pr.color }} />
                      {pr.label}
                    </span>
                    <span className="tabular-nums">{pr.count} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: pr.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Performance Breakdown */}
      <div className="analytics-panel mt-lg">
        <div className="panel-header">
          <h3>
            <FiBriefcase size={17} /> Project Performance Comparison
          </h3>
        </div>
        {projectStats.length === 0 ? (
          <p className="text-muted">No projects available.</p>
        ) : (
          <div className="analytics-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Lead</th>
                  <th className="text-right">Total Tasks</th>
                  <th className="text-right">Completed</th>
                  <th className="text-right">In Progress</th>
                  <th className="text-right">Overdue</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {projectStats.map(proj => (
                  <tr key={proj._id}>
                    <td>
                      <Link to={`/projects/${proj._id}`} className="table-project-link">
                        <span className="project-dot" style={{ backgroundColor: proj.color }} />
                        {proj.name}
                      </Link>
                    </td>
                    <td>{proj.managerName}</td>
                    <td className="text-right tabular-nums">{proj.totalTasks}</td>
                    <td className="text-right tabular-nums text-success">{proj.completedTasks}</td>
                    <td className="text-right tabular-nums text-info">{proj.inProgressTasks}</td>
                    <td className={`text-right tabular-nums ${proj.overdueTasks > 0 ? 'text-danger' : ''}`}>
                      {proj.overdueTasks}
                    </td>
                    <td style={{ minWidth: '160px' }}>
                      <div className="inline-progress-cell">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${proj.progress}%`, backgroundColor: proj.color || '#2563eb' }}
                          />
                        </div>
                        <span className="tabular-nums">{proj.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Member Workload & Completion Rate */}
      <div className="analytics-panel mt-lg">
        <div className="panel-header">
          <h3>
            <FiUsers size={17} /> Team Member Workload & Delivery
          </h3>
        </div>
        {memberWorkload.length === 0 ? (
          <p className="text-muted">No active team members found.</p>
        ) : (
          <div className="analytics-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Role</th>
                  <th className="text-right">Assigned</th>
                  <th className="text-right">To Do</th>
                  <th className="text-right">In Progress</th>
                  <th className="text-right">Done</th>
                  <th className="text-right">Overdue</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {memberWorkload.map(member => (
                  <tr key={member._id}>
                    <td>
                      <div className="member-table-cell">
                        <span className="mini-avatar">
                          {member.firstName?.charAt(0)?.toUpperCase()}
                        </span>
                        <div>
                          <div className="member-cell-name">{member.name}</div>
                          <div className="member-cell-email">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{member.role?.replace('_', ' ')}</td>
                    <td className="text-right tabular-nums"><strong>{member.assignedTasks}</strong></td>
                    <td className="text-right tabular-nums">{member.todoTasks}</td>
                    <td className="text-right tabular-nums text-info">{member.inProgressTasks}</td>
                    <td className="text-right tabular-nums text-success">{member.completedTasks}</td>
                    <td className={`text-right tabular-nums ${member.overdueTasks > 0 ? 'text-danger' : ''}`}>
                      {member.overdueTasks}
                    </td>
                    <td style={{ minWidth: '160px' }}>
                      <div className="inline-progress-cell">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${member.completionRate}%`, backgroundColor: '#10b981' }}
                          />
                        </div>
                        <span className="tabular-nums">{member.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
