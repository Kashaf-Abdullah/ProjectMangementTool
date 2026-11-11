import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  FiSearch,
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiClipboard,
  FiBriefcase,
  FiAtSign,
  FiMessageSquare,
  FiCheckSquare,
  FiUsers
} from 'react-icons/fi';
import api from '../../services/api';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tasks: [], projects: [], users: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSlashShortcut = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      }
    };

    document.addEventListener('keydown', handleSlashShortcut);
    return () => document.removeEventListener('keydown', handleSlashShortcut);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults({ tasks: [], projects: [], users: [] });
      setSearchLoading(false);
      setSearchError('');
      setSelectedSearchIndex(-1);
      return undefined;
    }

    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError('');
    setSelectedSearchIndex(-1);
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.get('/search', {
          params: { q: query },
          signal: controller.signal
        });
        setSearchResults(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchError(error.response?.data?.message || 'Search is unavailable. Please try again.');
          setSearchResults({ tasks: [], projects: [], users: [] });
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setShowNotifications(false);

    if (notif.channelId || notif.type === 'chat_dm') {
      navigate('/chat');
      return;
    }

    const pid = notif.projectId?._id || notif.projectId;
    const tid = notif.taskId?._id || notif.taskId;

    if (notif.discussionId && pid) {
      navigate(`/projects/${pid}?tab=discussions`);
      return;
    }

    if (tid) {
      navigate(`/tasks?task=${tid}`);
      return;
    }

    if (pid) {
      navigate(`/projects/${pid}`);
      return;
    }

    navigate('/tasks');
  };

  const renderNotifIcon = (type) => {
    if (type === 'mention') return <FiAtSign size={15} />;
    if (type === 'chat_dm' || type === 'task_comment' || type === 'discussion_reply') {
      return <FiMessageSquare size={15} />;
    }
    if (type === 'project_member_added') return <FiBriefcase size={15} />;
    return <FiClipboard size={15} />;
  };

  const displayedNotifications = notifFilter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;
  const searchItems = [
    ...searchResults.tasks.map(item => ({ ...item, type: 'task' })),
    ...searchResults.projects.map(item => ({ ...item, type: 'project' })),
    ...searchResults.users.map(item => ({ ...item, type: 'user' }))
  ];

  const navigateToSearchResult = (item) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (item.type === 'task') {
      navigate(`/tasks?task=${item._id}`);
    } else if (item.type === 'project') {
      navigate(`/projects/${item._id}`);
    } else {
      navigate(`/chat?user=${item._id}`);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      setShowSearchResults(false);
      searchInputRef.current?.blur();
    } else if (event.key === 'ArrowDown' && searchItems.length > 0) {
      event.preventDefault();
      setSelectedSearchIndex(index => (index + 1) % searchItems.length);
    } else if (event.key === 'ArrowUp' && searchItems.length > 0) {
      event.preventDefault();
      setSelectedSearchIndex(index => (index <= 0 ? searchItems.length - 1 : index - 1));
    } else if (event.key === 'Enter' && searchItems[selectedSearchIndex]) {
      event.preventDefault();
      navigateToSearchResult(searchItems[selectedSearchIndex]);
    }
  };

  const renderSearchGroup = (type, title, items) => {
    if (items.length === 0) return null;
    const startIndex = searchItems.findIndex(item => item.type === type);
    return (
      <div className="global-search-group" key={type}>
        <div className="global-search-group-title">{title}</div>
        {items.map((item, index) => {
          const itemIndex = startIndex + index;
          return (
            <button
              type="button"
              className={`global-search-result ${selectedSearchIndex === itemIndex ? 'selected' : ''}`}
              key={item._id}
              onMouseEnter={() => setSelectedSearchIndex(itemIndex)}
              onClick={() => navigateToSearchResult({ ...item, type })}
            >
              <span className={`global-search-result-icon ${type}`}>
                {type === 'task' ? <FiCheckSquare size={16} /> : type === 'project' ? <FiBriefcase size={16} /> : <FiUsers size={16} />}
              </span>
              <span className="global-search-result-copy">
                <span className="global-search-result-name">
                  {type === 'user' ? `${item.firstName} ${item.lastName}` : item.title || item.name}
                </span>
                <span className="global-search-result-detail">
                  {type === 'task'
                    ? `${item.projectId?.name || 'Task'} · ${item.status?.replace('_', ' ')}`
                    : type === 'project'
                      ? item.description || 'Project'
                      : item.email}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

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

        <div className="global-search" ref={searchRef}>
          <div className="global-search-input-wrap">
            <FiSearch className="global-search-icon" size={17} />
            <input
              ref={searchInputRef}
              type="search"
              className="global-search-input"
              placeholder="Search tasks, projects, people..."
              value={searchQuery}
              aria-label="Search tasks, projects, and people"
              aria-expanded={showSearchResults && searchQuery.trim().length >= 2}
              onFocus={() => setShowSearchResults(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSearchResults(true);
              }}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <button
                type="button"
                className="global-search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
              >
                <FiX size={15} />
              </button>
            )}
            <kbd className="global-search-shortcut">/</kbd>
          </div>
          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div className="global-search-dropdown">
              {searchLoading ? (
                <div className="global-search-message">Searching workspace...</div>
              ) : searchError ? (
                <div className="global-search-message error">{searchError}</div>
              ) : searchItems.length === 0 ? (
                <div className="global-search-message">No matching tasks, projects, or people.</div>
              ) : (
                <>
                  {renderSearchGroup('task', 'Tasks', searchResults.tasks)}
                  {renderSearchGroup('project', 'Projects', searchResults.projects)}
                  {renderSearchGroup('user', 'People', searchResults.users)}
                  <div className="global-search-hint">Use ↑ ↓ to navigate · Enter to open · Esc to close</div>
                </>
              )}
            </div>
          )}
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
                          {renderNotifIcon(notif.type)}
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
            <Link to="/chat" onClick={() => setShowMobileMenu(false)}>
              Team Chat
            </Link>
            <Link to="/files" onClick={() => setShowMobileMenu(false)}>
              Shared Files
            </Link>
            <Link to="/activity" onClick={() => setShowMobileMenu(false)}>
              Activity Feed
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
