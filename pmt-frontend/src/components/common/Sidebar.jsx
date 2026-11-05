import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import {
  FiHome,
  FiBriefcase,
  FiCheckSquare,
  FiMessageSquare,
  FiFolder,
  FiActivity,
  FiBarChart2,
  FiUsers,
  FiCreditCard,
  FiChevronLeft,
  FiChevronRight,
  FiLayers
} from 'react-icons/fi';
import '../../styles/components/layout.css';

const Sidebar = () => {
  const { user, isSuperAdmin } = useAuth();
  const { onlineUserIds } = useRealtime();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard', roles: ['*'] },
    { path: '/projects', icon: <FiBriefcase />, label: 'Projects', roles: ['*'] },
    { path: '/tasks', icon: <FiCheckSquare />, label: 'Tasks', roles: ['*'] },
    { path: '/analytics', icon: <FiBarChart2 />, label: 'Analytics', roles: ['*'] }
  ];

  const collabItems = [
    {
      path: '/chat',
      icon: <FiMessageSquare />,
      label: 'Team Chat',
      roles: ['*'],
      badge: onlineUserIds.length > 0 ? `${onlineUserIds.length} live` : null
    },
    { path: '/files', icon: <FiFolder />, label: 'Shared Files', roles: ['*'] },
    { path: '/activity', icon: <FiActivity />, label: 'Activity Feed', roles: ['*'] }
  ];

  const managementItems = [
    { path: '/users', icon: <FiUsers />, label: 'Team Members', roles: ['admin', 'project_manager', 'super_admin'] },
    { path: '/organizations', icon: <FiLayers />, label: 'Organizations', roles: ['super_admin'] },
    { path: '/billing', icon: <FiCreditCard />, label: 'Billing', roles: ['admin', 'super_admin'] }
  ];

  const canAccess = (itemRoles) => {
    if (itemRoles.includes('*')) return true;
    if (itemRoles.includes(user?.role)) return true;
    if (isSuperAdmin()) return true;
    return false;
  };

  const visibleManagement = managementItems.filter(item => canAccess(item.roles));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <span className="sidebar-brand-label">Workspace</span>}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <h4 className="section-title">Overview</h4>}
          <ul className="nav-list">
            {navItems.map((item) => (
              canAccess(item.roles) && (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={item.label}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </NavLink>
                </li>
              )
            ))}
          </ul>
        </div>

        <div className="nav-section">
          {!collapsed && <h4 className="section-title">Collaboration</h4>}
          <ul className="nav-list">
            {collabItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && (
                    <span
                      className="nav-label"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {visibleManagement.length > 0 && (
          <div className="nav-section">
            {!collapsed && <h4 className="section-title">Management</h4>}
            <ul className="nav-list">
              {visibleManagement.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={item.label}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="org-info">
            <div className="org-name">{user?.orgName || 'Organization'}</div>
            <div className="org-users">
              Role: <span className="org-role-label">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
