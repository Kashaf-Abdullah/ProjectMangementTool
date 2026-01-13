import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiBriefcase, 
  FiCheckSquare, 
  FiUsers, 
  FiCreditCard,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLayers,
  FiActivity
} from 'react-icons/fi';
import '../../styles/components/layout.css';

const Sidebar = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard', roles: ['*'] },
    { path: '/projects', icon: <FiHome />, label: 'Projects', roles: ['*'] },
    { path: '/tasks', icon: <FiCheckSquare />, label: 'Tasks', roles: ['*'] },
  ];

  const adminItems = [
    { path: '/users', icon: <FiUsers />, label: 'Users', roles: ['admin', 'super_admin'] },
    { path: '/organizations', icon: <FiLayers />, label: 'Organizations', roles: ['super_admin'] },
    { path: '/billing', icon: <FiCreditCard />, label: 'Billing', roles: ['admin', 'super_admin'] },
    { path: '/settings', icon: <FiSettings />, label: 'Settings', roles: ['*'] },
  ];

  const canAccess = (itemRoles) => {
    if (itemRoles.includes('*')) return true;
    if (itemRoles.includes(user?.role)) return true;
    if (isSuperAdmin()) return true;
    return false;
  };

  const handleNavigation = (path) => {
    navigate(path);
    // Close sidebar on mobile if needed
    if (window.innerWidth < 768) {
      // You might want to add mobile sidebar toggle logic here
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h3>Navigation</h3>}
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h4 className="section-title">{collapsed ? '' : 'Main'}</h4>
          <ul className="nav-list">
            {navItems.map((item) => (
              canAccess(item.roles) && (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => 
                      `nav-link ${isActive ? 'active' : ''}`
                    }
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

        {(isAdmin() || isSuperAdmin()) && (
          <div className="nav-section">
            <h4 className="section-title">{collapsed ? '' : 'Admin'}</h4>
            <ul className="nav-list">
              {adminItems.map((item) => (
                canAccess(item.roles) && (
                  <li key={item.path}>
                    <NavLink 
                      to={item.path} 
                      className={({ isActive }) => 
                        `nav-link ${isActive ? 'active' : ''}`
                      }
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
        )}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="org-info">
            <div className="org-name">{user?.orgName || 'Organization'}</div>
            <div className="org-users">
              {user?.currentUsers || 0}/{user?.userLimit || 5} users
            </div>
          </div>
        )}
        <button 
          className="compact-view-btn"
          onClick={() => handleNavigation('/dashboard')}
          title="Compact View"
        >
          <FiActivity />
          {!collapsed && <span>Compact View</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;