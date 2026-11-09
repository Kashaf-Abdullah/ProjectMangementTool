import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import '../../styles/pages/auth.css';

const demoUsers = [
  { name: 'Avery Morgan', role: 'Admin', email: 'admin@acme-demo.dev' },
  { name: 'Jordan Lee', role: 'Project Manager', email: 'manager@acme-demo.dev' },
  { name: 'Riley Taylor', role: 'Team Member', email: 'member@acme-demo.dev' }
];
const demoPassword = 'DemoPass123!';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleDemoLogin = async (demoUser) => {
    setFormData({ email: demoUser.email, password: demoPassword });
    setLoading(true);

    const result = await login(demoUser.email, demoPassword);

    if (result.success) {
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FiMail className="form-icon" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <FiLock className="form-icon" />
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="auth-btn primary-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <section className="demo-accounts" aria-labelledby="demo-accounts-title">
          <h2 id="demo-accounts-title">Try a demo account</h2>
          <p>Choose a role to sign in instantly. Shared password: <strong>{demoPassword}</strong></p>
          <div className="demo-account-list">
            {demoUsers.map((demoUser) => (
              <button
                key={demoUser.email}
                type="button"
                className="demo-account-btn"
                onClick={() => handleDemoLogin(demoUser)}
                disabled={loading}
              >
                <FiUser aria-hidden="true" />
                <span className="demo-account-info">
                  <strong>{demoUser.name}</strong>
                  <span>{demoUser.role} · {demoUser.email}</span>
                </span>
                <span className="demo-account-action">{loading ? 'Signing in...' : 'Try'}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
          <p>
            Need super admin access?{' '}
            <Link to="/register-super-admin" className="auth-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;