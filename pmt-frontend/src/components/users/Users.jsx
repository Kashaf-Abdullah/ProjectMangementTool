import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiUser, FiShield, FiCopy } from 'react-icons/fi';
import UserCard from './UserCard';
import InviteUserForm from './InviteUserForm';
import Modal from '../common/Modal';
import '../../styles/pages/users.css';

const Users = () => {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOrgAdmin = ['admin', 'super_admin'].includes(currentUser?.role);

  const [users, setUsers] = useState([]);
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, billingRes] = await Promise.all([
        api.get('/users'),
        api.get('/billing/status')
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setBillingStatus(billingRes.data);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const q = searchTerm.toLowerCase();
    return users.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const handleInviteUser = async (userData) => {
    try {
      const response = await api.post('/users/invite', userData);
      await fetchData();
      setShowInviteModal(false);
      if (response.data?.inviteUrl && !response.data?.isActive) {
        setGeneratedInviteUrl(response.data.inviteUrl);
      }
      toast.success(response.data?.message || 'Member added successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add member';
      toast.error(message);
      throw error;
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put('/users/role', { userId, role: newRole });
      setUsers(prev => prev.map(u => (u._id === userId ? { ...u, role: newRole } : u)));
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      fetchData();
      toast.success('Member removed from organization');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove user');
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
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Team Members</h1>
          <p className="text-muted">
            {users.filter(u => u.isActive).length} active members • {users.length} total
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn primary-btn"
            onClick={() => setShowInviteModal(true)}
            disabled={billingStatus && !billingStatus.canAddUsers}
          >
            <FiPlus size={16} />
            Add / Invite Member
          </button>
        </div>
      </div>

      {generatedInviteUrl && (
        <div className="alert alert-success">
          <div className="alert-content">
            <div className="alert-title">Invitation Link Ready</div>
            <div className="alert-message">
              Share this activation link with your team member: <code>{generatedInviteUrl}</code>
            </div>
          </div>
          <button
            type="button"
            className="btn secondary-btn btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(generatedInviteUrl);
              toast.success('Activation link copied!');
            }}
          >
            <FiCopy size={14} /> Copy Link
          </button>
        </div>
      )}

      {billingStatus && (
        <div className="limit-progress">
          <div className="progress-header">
            <span>Organization Seat Usage</span>
            <span className="tabular-nums">
              {billingStatus.currentUsers} / {billingStatus.userLimit} active seats
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (billingStatus.currentUsers / billingStatus.userLimit) * 100)}%`,
                backgroundColor: billingStatus.currentUsers >= billingStatus.userLimit
                  ? 'var(--danger-color)'
                  : 'var(--primary-color)'
              }}
            />
          </div>
          {!billingStatus.canAddUsers && isOrgAdmin && (
            <div className="progress-warning">
              <Link to="/billing" className="upgrade-link">
                <FiShield size={14} />
                Upgrade Seat Limit
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <FiUser className="empty-state-icon" />
          <h3>No members found</h3>
          <p>Add team members so you can assign tasks across projects.</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(member => (
            <UserCard
              key={member._id}
              user={member}
              currentUserId={currentUserId}
              onUpdateRole={isOrgAdmin ? handleUpdateRole : null}
              onDelete={isOrgAdmin ? handleDeleteUser : null}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Add or Invite Team Member"
      >
        <InviteUserForm
          onSubmit={handleInviteUser}
          onCancel={() => setShowInviteModal(false)}
          currentUsers={billingStatus?.currentUsers || 0}
          userLimit={billingStatus?.userLimit || 5}
          canAssignAdmin={isOrgAdmin}
        />
      </Modal>
    </div>
  );
};

export default Users;
