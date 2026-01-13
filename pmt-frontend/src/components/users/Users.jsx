import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiSearch, 
  FiMail, 
  FiUser, 
  FiEdit, 
  FiTrash2,
  FiShield,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import UserCard from './UserCard';
import InviteUserForm from './InviteUserForm';
import Modal from '../common/Modal';
import '../../styles/pages/users.css';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [billingStatus, setBillingStatus] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);
// In Users.jsx - fetchData function
const fetchData = async () => {
  try {
    const [usersRes, billingRes] = await Promise.all([
      api.get('/users'),
      api.get('/billing/status')
    ]);
    
    setUsers(usersRes.data);
    
    // Handle billing status - use defaults if error
    if (billingRes.status === 200) {
      setBillingStatus(billingRes.data);
    } else {
      // Use defaults if billing endpoint fails
      setBillingStatus({
        userLimit: 5,
        currentUsers: usersRes.data.length,
        canAddUsers: usersRes.data.length < 5,
        stripeCustomerId: null
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to fetch data');
    
    // Set default billing status on error
    setBillingStatus({
      userLimit: 5,
      currentUsers: users.length || 0,
      canAddUsers: (users.length || 0) < 5,
      stripeCustomerId: null
    });
  } finally {
    setLoading(false);
  }
};
  // const fetchData = async () => {


  //   try {
  //     const [usersRes, billingRes] = await Promise.all([
  //       api.get('/users'),
  //       api.get('/billing/status')
  //     ]);
      
  //     setUsers(usersRes.data);
  //     setBillingStatus(billingRes.data);
  //   } catch (error) {
  //     toast.error('Failed to fetch data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleInviteUser = async (userData) => {
    try {
      const response = await api.post('/users/invite', userData);
      fetchData(); // Refresh users list
      setShowInviteModal(false);
      toast.success('Invitation sent successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to invite user';
      toast.error(message);
      
      // If user limit reached, show billing modal
      if (error.response?.status === 403 && error.response?.data?.upgradeRequired) {
        // You could redirect to billing page here
      }
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put('/users/role', { userId, role: newRole });
      setUsers(users.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
      toast.success('User role updated!');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) {
      return;
    }

    try {
      // Note: You might want to implement soft delete instead
      await api.delete(`/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      toast.success('User removed!');
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {users.length} members • {billingStatus?.currentUsers || 0}/{billingStatus?.userLimit || 5} slots used
          </p>
          {!billingStatus?.canAddUsers && (
            <div className="alert warning">
              <FiXCircle />
              <span>User limit reached! <a href="/billing">Upgrade plan</a> to add more users.</span>
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            className="btn primary-btn"
            onClick={() => setShowInviteModal(true)}
            disabled={!billingStatus?.canAddUsers}
          >
            <FiPlus size={16} />
            Invite User
          </button>
        </div>
      </div>

      {/* User Limit Progress */}
      {billingStatus && (
        <div className="limit-progress">
          <div className="progress-header">
            <span>User Limit</span>
            <span>{billingStatus.currentUsers}/{billingStatus.userLimit}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(billingStatus.currentUsers / billingStatus.userLimit) * 100}%`,
                backgroundColor: billingStatus.currentUsers >= billingStatus.userLimit 
                  ? 'var(--danger-color)' 
                  : 'var(--primary-color)'
              }}
            />
          </div>
          {!billingStatus.canAddUsers && (
            <div className="progress-warning">
              <a href="/billing" className="upgrade-link">
                <FiShield size={14} />
                Upgrade Plan
              </a>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="search-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <FiUser className="empty-state-icon" />
          <h3>No users found</h3>
          <p>Invite team members to collaborate</p>
          <button 
            className="btn primary-btn mt-md"
            onClick={() => setShowInviteModal(true)}
            disabled={!billingStatus?.canAddUsers}
          >
            <FiPlus size={16} />
            Invite User
          </button>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <UserCard
              key={user._id}
              user={user}
              currentUserId={user?._id}
              onUpdateRole={handleUpdateRole}
              onDelete={handleDeleteUser}
            />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <InviteUserForm
          onSubmit={handleInviteUser}
          onCancel={() => setShowInviteModal(false)}
          currentUsers={billingStatus?.currentUsers || 0}
          userLimit={billingStatus?.userLimit || 5}
        />
      </Modal>
    </div>
  );
};

export default Users;