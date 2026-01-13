import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiBell, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import '../../styles/components/layout.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <h1>PM Tool</h1>
          </Link>
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        <div className="header-right">
          <button className="notification-btn">
            <FiBell size={20} />
            <span className="notification-badge">3</span>
          </button>

          <div className="user-menu">
            <button 
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {user?.firstName?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.role}</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-avatar">
                    {user?.firstName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name">{user?.firstName} {user?.lastName}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item">
                  <FiUser size={16} />
                  <span>Profile</span>
                </Link>
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
            {user?.role === 'admin' && (
              <Link to="/users" onClick={() => setShowMobileMenu(false)}>
                Users
              </Link>
            )}
            <Link to="/billing" onClick={() => setShowMobileMenu(false)}>
              Billing
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;