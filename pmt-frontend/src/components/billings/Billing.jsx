import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import { 
  FiCreditCard, 
  FiUsers, 
  FiCheckCircle, 
  FiAlertCircle,
  FiArrowUpRight,
  FiShield
} from 'react-icons/fi';
import PlanCard from './PlanCard';
// const stripePromise = loadStripe(import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe('pk_test_51SfPK2HznAEQAbqoQh7LhtdxxZioMJQSleH6MAxdCjCuhDRcvllFoaSETUIFGBc92PGMIsgtDnh9mfbgg0DFpg6x004yCIv5HL');


const Billing = () => {
  const { user } = useAuth();
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [statusRes] = await Promise.all([
        api.get('/billing/status')
      ]);
      
      setBillingStatus(statusRes.data);
      
      // Simulate payment history (in real app, you'd fetch from API)
      setPaymentHistory([
        {
          id: 1,
          date: '2024-01-15',
          description: 'User Pack (5 users)',
          amount: 5.00,
          status: 'completed'
        },
        {
          id: 2,
          date: '2023-12-01',
          description: 'Initial Setup',
          amount: 0.00,
          status: 'completed'
        }
      ]);
    } catch (error) {
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (processingPayment) return;
    
    setProcessingPayment(true);
    
    try {
      const response = await api.post('/billing/create-checkout-session');
      const { url } = response.data;
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create checkout session');
      setProcessingPayment(false);
    }
  };

  const handleManageSubscription = async () => {
    toast('Billing portal integration coming soon!', { icon: '🛠️' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const plans = [
    {
      name: 'Free',
      price: 0,
      userLimit: 5,
      features: [
        'Up to 5 users',
        'Unlimited projects',
        'Basic task management',
        'Email support',
        '1GB storage'
      ],
      current: !billingStatus?.stripeCustomerId
    },
    {
      name: 'Growth',
      price: 5,
      userLimit: 'Additional 5 users',
      features: [
        'Add 5 more users ($5 per pack)',
        'All Free features',
        'Priority support',
        'Advanced reporting',
        '5GB storage'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      userLimit: 'Unlimited',
      features: [
        'Unlimited users',
        'Custom integrations',
        'Dedicated support',
        'Advanced security',
        'Custom storage limits',
        'SLA guarantee'
      ]
    }
  ];

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <h1>Billing & Plans</h1>
          <p className="text-muted">
            Manage your subscription and user limits
          </p>
        </div>
        
        <div className="header-actions">
          {billingStatus?.stripeCustomerId && (
            <button 
              className="btn secondary-btn"
              onClick={handleManageSubscription}
            >
              <FiCreditCard />
              Manage Subscription
            </button>
          )}
        </div>
      </div>

      {/* Current Usage */}
      <div className="usage-section">
        <div className="usage-card">
          <div className="usage-header">
            <h3>
              <FiUsers />
              Current Usage
            </h3>
            {!billingStatus?.canAddUsers && (
              <span className="limit-reached">
                <FiAlertCircle />
                Limit Reached
              </span>
            )}
          </div>
          
          <div className="usage-progress">
            <div className="progress-info">
              <span className="progress-label">User Limit</span>
              <span className="progress-value">
                {billingStatus?.currentUsers || 0}/{billingStatus?.userLimit || 5} users
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${((billingStatus?.currentUsers || 0) / (billingStatus?.userLimit || 5)) * 100}%`,
                  backgroundColor: billingStatus?.canAddUsers ? 'var(--primary-color)' : 'var(--danger-color)'
                }}
              />
            </div>
          </div>
          
          <div className="usage-actions">
            {billingStatus?.canAddUsers ? (
              <div className="can-add-users">
                <FiCheckCircle className="success-icon" />
                <span>You can add {billingStatus.userLimit - billingStatus.currentUsers} more users</span>
              </div>
            ) : (
              <div className="cannot-add-users">
                <FiAlertCircle className="warning-icon" />
                <span>User limit reached. Upgrade to add more users.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="plans-section">
        <h2>Available Plans</h2>
        <p className="section-subtitle">Choose the plan that fits your team's needs</p>
        
        <div className="plans-grid">
          {plans.map((plan, index) => (
            <PlanCard
              key={index}
              plan={plan}
              onUpgrade={handleUpgrade}
              isProcessing={processingPayment}
              currentUserLimit={billingStatus?.userLimit || 5}
            />
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="payment-history">
        <h2>Payment History</h2>
        
        {paymentHistory.length === 0 ? (
          <div className="empty-history">
            <p>No payment history available</p>
          </div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.date}</td>
                    <td>{payment.description}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-list">
          <div className="faq-item">
            <h4>How does billing work?</h4>
            <p>
              You can invite up to 5 users for free. Need more users? 
              Purchase User Packs at $5 for each additional 5 users. 
              One-time payment, no subscription required.
            </p>
          </div>
          
          <div className="faq-item">
            <h4>Can I upgrade or downgrade anytime?</h4>
            <p>
              Yes! You can purchase additional User Packs anytime. 
              There are no long-term contracts.
            </p>
          </div>
          
          <div className="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>
              We accept all major credit cards through Stripe. 
              All payments are securely processed.
            </p>
          </div>
          
          <div className="faq-item">
            <h4>Is there a free trial?</h4>
            <p>
              The free plan includes 5 users indefinitely. 
              You only pay when you need more users.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <FiShield className="security-icon" />
        <div className="security-content">
          <h4>Secure Payment Processing</h4>
          <p>
            All payments are processed securely by Stripe. 
            We never store your credit card information on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Billing;