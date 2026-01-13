import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiPlus, 
  FiSearch, 
  FiUsers, 
  FiEdit, 
  FiTrash2,
  FiChevronRight,
  FiAlertCircle
} from 'react-icons/fi';
import OrganizationForm from './OrganizationForm';
import Modal from '../common/Modal';

const Organizations = () => {
  const { user, isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrg, setEditingOrg] = useState(null);

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchOrganizations();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchTerm]);

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data);
    } catch (error) {
      toast.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = [...organizations];

    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrgs(filtered);
  };

  const handleCreateOrganization = async (orgData) => {
    try {
      const response = await api.post('/organizations', orgData);
      setOrganizations([response.data, ...organizations]);
      setShowCreateModal(false);
      toast.success('Organization created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    }
  };

  const handleUpdateOrganization = async (orgId, updates) => {
    try {
      const response = await api.patch(`/organizations/${orgId}`, updates);
      setOrganizations(organizations.map(org =>
        org._id === orgId ? response.data : org
      ));
      setEditingOrg(null);
      toast.success('Organization updated successfully!');
    } catch (error) {
      toast.error('Failed to update organization');
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This will delete all associated data.')) {
      return;
    }

    try {
      await api.delete(`/organizations/${orgId}`);
      setOrganizations(organizations.filter(org => org._id !== orgId));
      toast.success('Organization deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete organization');
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="access-denied">
        <FiAlertCircle className="denied-icon" />
        <h2>Access Denied</h2>
        <p>You need super admin privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="organizations-page">
      <div className="page-header">
        <div>
          <h1>Organizations</h1>
          <p className="text-muted">
            {organizations.length} organizations • Manage all organizations
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn primary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus size={16} />
            New Organization
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Organizations List */}
      {filteredOrgs.length === 0 ? (
        <div className="empty-state">
          <FiUsers className="empty-state-icon" />
          <h3>No organizations found</h3>
          <p>Create your first organization to get started</p>
          <button 
            className="btn primary-btn mt-md"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus size={16} />
            Create Organization
          </button>
        </div>
      ) : (
        <div className="organizations-list">
          {filteredOrgs.map(org => (
            <div key={org._id} className="organization-card">
              <div className="org-header">
                <div className="org-info">
                  <h3 className="org-name">{org.name}</h3>
                  {org.subdomain && (
                    <div className="org-subdomain">
                      {org.subdomain}.yourdomain.com
                    </div>
                  )}
                </div>
                
                <div className="org-actions">
                  <button 
                    className="btn icon-btn"
                    onClick={() => setEditingOrg(org)}
                  >
                    <FiEdit />
                  </button>
                  <button 
                    className="btn icon-btn danger"
                    onClick={() => handleDeleteOrganization(org._id)}
                  >
                    <FiTrash2 />
                  </button>
                  <button className="btn icon-btn">
                    <FiChevronRight />
                  </button>
                </div>
              </div>

              <div className="org-body">
                <div className="org-stats">
                  <div className="stat-item">
                    <FiUsers />
                    <span>
                      {org.currentUsers || 0}/{org.userLimit} users
                    </span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Created:</span>
                    <span className="stat-value">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Status:</span>
                    <span className={`status-badge ${org.currentUsers >= org.userLimit ? 'limit-reached' : 'active'}`}>
                      {org.currentUsers >= org.userLimit ? 'Limit Reached' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="org-progress">
                  <div className="progress-info">
                    <span>User Limit Usage</span>
                    <span>{Math.round((org.currentUsers / org.userLimit) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(org.currentUsers / org.userLimit) * 100}%`,
                        backgroundColor: org.currentUsers >= org.userLimit ? 
                          'var(--danger-color)' : 'var(--primary-color)'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="org-footer">
                <div className="org-id">
                  ID: {org._id}
                </div>
                
                {org.stripeCustomerId && (
                  <div className="stripe-info">
                    {/* <FiCreditCard size={12} /> */}
                    <span>Stripe: {org.stripeCustomerId.substring(0, 12)}...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Organization"
      >
        <OrganizationForm
          onSubmit={handleCreateOrganization}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={!!editingOrg}
        onClose={() => setEditingOrg(null)}
        title="Edit Organization"
      >
        <OrganizationForm
          organization={editingOrg}
          onSubmit={(data) => handleUpdateOrganization(editingOrg._id, data)}
          onCancel={() => setEditingOrg(null)}
          mode="edit"
        />
      </Modal>
    </div>
  );
};

export default Organizations;