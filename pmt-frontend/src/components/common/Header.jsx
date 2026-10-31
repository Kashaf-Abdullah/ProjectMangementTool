import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiClipboard,
  FiBriefcase
} from 'react-icons/fi';
import '../../styles/components/layout.css';

const Header = () => {
  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  const navigate = useNavigate();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setShowNotifications(false);
    if (notif.projectId?._id || notif.projectId) {
      const pid = notif.projectId?._id || notif.projectId;
      if (notif.type === 'project_member_added') {
        navigate(`/projects/${pid}`);
        return;
      }
    }
    navigate('/tasks');
  };

  const displayedNotifications = notifFilter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            <span className="logo-mark">PM</span>
            <span className="logo-text">Workspace</span>
          </Link>
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle Menu"
          >
            {showMobileMenu ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        <div className="header-right">
          {/* Live Notification Bell & Dropdown */}
          <div className="notification-wrapper" ref={notifRef}>
            <button
              className={`notification-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notif-header">
                  <div className="notif-title-row">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="notif-unread-pill">{unreadCount} new</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notif-mark-all-btn"
                      onClick={markAllAsRead}
                    >
                      <FiCheck size={14} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notif-tabs">
                  <button
                    type="button"
                    className={`notif-tab ${notifFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setNotifFilter('all')}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    className={`notif-tab ${notifFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setNotifFilter('unread')}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                <div className="notif-list">
                  {displayedNotifications.length === 0 ? (
                    <div className="notif-empty">
                      <FiCheckCircle size={28} />
                      <p>{notifFilter === 'unread' ? 'You are all caught up!' : 'No notifications yet'}</p>
                    </div>
                  ) : (
                    displayedNotifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notif-icon">
                          {notif.type === 'project_member_added' ? (
                            <FiBriefcase size={15} />
                          ) : (
                            <FiClipboard size={15} />
                          )}
                        </div>
                        <div className="notif-body">
                          <div className="notif-item-title">{notif.title}</div>
                          <div className="notif-item-msg">{notif.message}</div>
                          <div className="notif-meta">
                            {notif.projectId?.name && (
                              <span className="notif-project">
                                {notif.projectId.name}
                              </span>
                            )}
                            <span>
                              {notif.createdAt
                                ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
                                : 'Just now'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="notif-delete-btn"
                          title="Dismiss"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif._id);
                          }}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="user-menu" ref={userMenuRef}>
            <button
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-text-meta">
                <span className="user-name">{user?.firstName} {user?.lastName}</span>
                <span className="user-role">{user?.role?.replace('_', ' ')}</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-avatar">
                    {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="user-name">{user?.firstName} {user?.lastName}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                  <FiLogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <Link to="/dashboard" onClick={() => setShowMobileMenu(false)}>
              Dashboard
            </Link>
            <Link to="/projects" onClick={() => setShowMobileMenu(false)}>
              Projects
            </Link>
            <Link to="/tasks" onClick={() => setShowMobileMenu(false)}>
              Tasks
            </Link>
            <Link to="/analytics" onClick={() => setShowMobileMenu(false)}>
              Analytics
            </Link>
            {['admin', 'project_manager', 'super_admin'].includes(user?.role) && (
              <Link to="/users" onClick={() => setShowMobileMenu(false)}>
                Team Members
              </Link>
            )}
            {['admin', 'super_admin'].includes(user?.role) && (
              <Link to="/billing" onClick={() => setShowMobileMenu(false)}>
                Billing
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
