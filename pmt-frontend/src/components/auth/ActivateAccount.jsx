import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiLock, FiXCircle, FiLoader } from 'react-icons/fi';
import api from '../../services/api';
import '../../styles/pages/auth.css';
import '../../styles/pages/activation.css';

const ActivateAccount = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('form');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setStatus('loading');

    try {
      const response = await api.post(`/auth/activate/${token}`, { password });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
      }

      setStatus('success');
      setMessage('Your account is ready. You will be redirected to your dashboard shortly.');
      toast.success('Account activated successfully!');

      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setStatus('error');
      const errorMessage = error.response?.data?.message || 'Invalid or expired invitation link';
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <main className="auth-container activation-page">
      <section className="auth-card activation-card" aria-live="polite">
        {status === 'form' ? (
          <>
            <header className="activation-header">
              <div className="activation-mark" aria-hidden="true">
                <FiLock />
              </div>
              <p className="activation-eyebrow">SECURE ACCOUNT SETUP</p>
              <h1>Set your password</h1>
              <p className="activation-description">
                Create a password to activate your account and join your workspace.
              </p>
            </header>

            <form className="activation-form" onSubmit={handleSubmit}>
              <div className="activation-field">
                <label htmlFor="activation-password">New password</label>
                <input
                  autoComplete="new-password"
                  id="activation-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={password}
                />
                <span className="activation-hint">Use at least 8 characters.</span>
              </div>

              <div className="activation-field">
                <label htmlFor="activation-confirm-password">Confirm password</label>
                <input
                  autoComplete="new-password"
                  id="activation-confirm-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  required
                  type="password"
                  value={confirmPassword}
                />
              </div>

              <button className="auth-btn primary-btn activation-submit" type="submit">
                Activate account
              </button>
            </form>

            <p className="activation-security">
              <FiLock aria-hidden="true" />
              Your account details are protected
            </p>
          </>
        ) : (
          <div className={`activation-result activation-result-${status}`}>
            <div className="activation-result-icon" aria-hidden="true">
              {status === 'loading' && <FiLoader className="activation-spinner" />}
              {status === 'success' && <FiCheckCircle />}
              {status === 'error' && <FiXCircle />}
            </div>
            <p className="activation-eyebrow">
              {status === 'loading' ? 'JUST A MOMENT' : status === 'success' ? 'ALL SET' : 'LINK ISSUE'}
            </p>
            <h1>
              {status === 'loading' && 'Activating your account'}
              {status === 'success' && 'Welcome to your workspace'}
              {status === 'error' && 'Could not activate account'}
            </h1>
            <p className="activation-description">{message}</p>

            {status === 'loading' && <div className="activation-progress" />}
            {status === 'success' && (
              <button
                className="auth-btn primary-btn activation-submit"
                onClick={() => navigate('/dashboard')}
                type="button"
              >
                Go to dashboard
              </button>
            )}
            {status === 'error' && (
              <>
                <p className="activation-help">Please contact your administrator for a new invitation.</p>
                <button
                  className="auth-btn secondary-btn activation-submit"
                  onClick={() => navigate('/login')}
                  type="button"
                >
                  Back to login
                </button>
              </>
            )}
          </div>
        )}
      </section>
      <p className="activation-footer">A better way to work, together.</p>
    </main>
  );
};

export default ActivateAccount;
