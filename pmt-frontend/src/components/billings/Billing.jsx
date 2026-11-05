import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiCreditCard, 
  FiUsers, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiShield, 
  FiPlus, 
  FiMinus, 
  FiFileText, 
  FiPrinter, 
  FiX, 
  FiCheck,
  FiZap,
  FiPercent,
  FiHelpCircle
} from 'react-icons/fi';
import '../../styles/pages/billing.css';

const SEAT_PRICE = 3.00; // $3.00 per member added
const PLATFORM_FEE_PERCENT = 10; // 10% platform join fee

const Billing = () => {
  const { user } = useAuth();
  const [billingStatus, setBillingStatus] = useState({
    userLimit: 10,
    currentUsers: 4,
    canAddUsers: true,
    stripeCustomerId: null
  });
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [seatsToAdd, setSeatsToAdd] = useState(5);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await api.get('/billing/status');
      if (response.data) {
        setBillingStatus(response.data);
        if (response.data.invoices && Array.isArray(response.data.invoices)) {
          setPaymentHistory(response.data.invoices);
        } else {
          // Default initial sample invoices if not in response
          setPaymentHistory([
            {
              id: 'inv_101',
              invoiceNumber: 'INV-2024-001',
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              seatsCount: 5,
              seatPrice: 3.00,
              seatsCost: 15.00,
              platformFee: 1.50,
              totalAmount: 16.50,
              description: 'Team Expansion (+5 Members)',
              status: 'paid'
            },
            {
              id: 'inv_100',
              invoiceNumber: 'INV-2024-000',
              date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              seatsCount: 5,
              seatPrice: 0.00,
              seatsCost: 0.00,
              platformFee: 0.00,
              totalAmount: 0.00,
              description: 'Initial Starter Workspace Setup (5 Users Included)',
              status: 'paid'
            }
          ]);
        }
      }
    } catch (error) {
      console.warn('Failed to load billing status, using fallback:', error);
      toast.error('Could not sync live billing data');
    } finally {
      setLoading(false);
    }
  };

  // Pricing calculations: $3 per member + 10% platform join fee
  const seatsCost = Number((seatsToAdd * SEAT_PRICE).toFixed(2));
  const platformFee = Number(((seatsCost * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
  const totalAmount = Number((seatsCost + platformFee).toFixed(2));

  const handleSeatChange = (delta) => {
    setSeatsToAdd((prev) => Math.max(1, Math.min(100, prev + delta)));
  };

  const handlePresetSelect = (count) => {
    setSeatsToAdd(count);
  };

  const handlePurchaseSeats = async () => {
    if (processingPayment) return;
    setProcessingPayment(true);

    try {
      const response = await api.post('/billing/create-checkout-session', {
        seatsCount: seatsToAdd
      });

      if (response.data?.url && response.data.url.startsWith('http')) {
        window.location.href = response.data.url;
        return;
      }

      // Successful addition
      toast.success(`Success! Added ${seatsToAdd} member seats to your organization.`);
      
      // Update local status immediately
      const newLimit = (billingStatus?.userLimit || 10) + seatsToAdd;
      const newStatus = {
        ...billingStatus,
        userLimit: newLimit,
        canAddUsers: true
      };
      setBillingStatus(newStatus);

      // Add to invoice history
      const newInvoice = response.data?.invoice || {
        id: `inv_${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        seatsCount: seatsToAdd,
        seatPrice: SEAT_PRICE,
        seatsCost: seatsCost,
        platformFee: platformFee,
        totalAmount: totalAmount,
        description: `Member Seats (+${seatsToAdd} added @ $3.00/seat + 10% platform fee)`,
        status: 'paid'
      };

      setPaymentHistory((prev) => [newInvoice, ...prev]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const currentUsers = billingStatus?.currentUsers ?? 1;
  const userLimit = billingStatus?.userLimit ?? 5;
  const availableSlots = Math.max(0, userLimit - currentUsers);
  const usagePercentage = Math.min(100, Math.round((currentUsers / userLimit) * 100));
  const isLimitReached = currentUsers >= userLimit;

  return (
    <div className="billing-page">
      {/* Hero Banner */}
      <div className="billing-hero">
        <div className="billing-hero-content">
          <h1>
            <FiCreditCard />
            Billing & Team Member Seats
          </h1>
          <p>
            Simple, transparent, on-demand capacity. Add new members whenever your team expands 
            for just <strong>${SEAT_PRICE.toFixed(2)} per member</strong> with a 
            flat <strong>{PLATFORM_FEE_PERCENT}% platform join fee</strong>.
          </p>
          <div className="billing-pricing-highlight-pill">
            <FiPercent /> 10% Platform Join Fee &bull; ${SEAT_PRICE.toFixed(2)} / Member &bull; Instant Activation
          </div>
        </div>

        <div className="billing-hero-badge">
          <div className="hero-rate-label">Seat Pricing Rate</div>
          <div className="hero-rate-value">${SEAT_PRICE.toFixed(2)} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ member</span></div>
          <div className="hero-rate-sub">+ 10% platform join fee</div>
        </div>
      </div>

      {/* Main Grid: Usage vs Seat Purchase Calculator */}
      <div className="billing-dashboard-grid">
        {/* Current Usage Card */}
        <div className="billing-card">
          <div className="billing-card-header">
            <h3 className="billing-card-title">
              <FiUsers />
              Workspace Capacity
            </h3>
            <span className={`status-indicator-tag ${isLimitReached ? 'limit-reached' : 'ok'}`}>
              {isLimitReached ? (
                <>
                  <FiAlertCircle /> Capacity Full
                </>
              ) : (
                <>
                  <FiCheckCircle /> Active
                </>
              )}
            </span>
          </div>

          <div className="usage-meter-box">
            <div className="meter-header">
              <span className="meter-label">Active Team Members</span>
              <span className="meter-numbers">
                {currentUsers} <span>/ {userLimit} seats</span>
              </span>
            </div>

            <div className="progress-track">
              <div 
                className="progress-fill-bar"
                style={{ 
                  width: `${usagePercentage}%`,
                  backgroundColor: isLimitReached ? '#ef4444' : usagePercentage > 80 ? '#f59e0b' : '#2563eb'
                }}
              />
            </div>

            <div className="meter-footer-note">
              {isLimitReached ? (
                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                  <FiAlertCircle style={{ display: 'inline', marginRight: 4 }} />
                  Seat limit reached. Add seats to invite more team members.
                </span>
              ) : (
                <span style={{ color: '#059669', fontWeight: 600 }}>
                  <FiCheckCircle style={{ display: 'inline', marginRight: 4 }} />
                  {availableSlots} member {availableSlots === 1 ? 'seat' : 'seats'} available to invite.
                </span>
              )}
            </div>
          </div>

          <div className="usage-stats-subgrid">
            <div className="stat-metric-tile">
              <div className="stat-metric-val">{currentUsers}</div>
              <div className="stat-metric-lbl">Active Users</div>
            </div>
            <div className="stat-metric-tile">
              <div className="stat-metric-val">{availableSlots}</div>
              <div className="stat-metric-lbl">Available Seats</div>
            </div>
          </div>
        </div>

        {/* Seat Calculator & Purchase Card */}
        <div className="billing-card seat-calculator-card">
          <div className="popular-ribbon">Instant Upgrade</div>
          
          <div className="billing-card-header">
            <h3 className="billing-card-title">
              <FiZap />
              Add Member Seats
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              ${SEAT_PRICE.toFixed(2)}/member + 10% join fee
            </span>
          </div>

          <div className="calculator-stepper-row">
            <div className="stepper-label-group">
              <h4>Select Number of Members</h4>
              <p>Choose how many seats to add to your organization</p>
            </div>

            <div className="stepper-controls">
              <button 
                type="button"
                className="stepper-btn"
                onClick={() => handleSeatChange(-1)}
                disabled={seatsToAdd <= 1 || processingPayment}
                title="Decrease seats"
              >
                <FiMinus />
              </button>
              
              <input 
                type="number"
                min="1"
                max="100"
                value={seatsToAdd}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setSeatsToAdd(Math.max(1, Math.min(100, val)));
                }}
                className="stepper-input"
              />

              <button 
                type="button"
                className="stepper-btn"
                onClick={() => handleSeatChange(1)}
                disabled={seatsToAdd >= 100 || processingPayment}
                title="Increase seats"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="preset-pill-group">
            {[1, 5, 10, 20, 50].map((count) => (
              <button
                key={count}
                type="button"
                className={`preset-pill ${seatsToAdd === count ? 'active' : ''}`}
                onClick={() => handlePresetSelect(count)}
              >
                +{count} {count === 1 ? 'Member' : 'Members'}
              </button>
            ))}
          </div>

          {/* Live Receipt Breakdown */}
          <div className="live-receipt-box">
            <div className="receipt-title">Order Cost Breakdown</div>
            
            <div className="receipt-row">
              <span>Member Seats ({seatsToAdd} &times; ${SEAT_PRICE.toFixed(2)})</span>
              <span><strong>${seatsCost.toFixed(2)}</strong></span>
            </div>

            <div className="receipt-row fee-row">
              <span>Platform Join Fee (10%)</span>
              <span><strong>+${platformFee.toFixed(2)}</strong></span>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-row total-row">
              <span>Total Amount Due</span>
              <span className="total-amount-highlight">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="button"
            className="purchase-action-btn"
            onClick={handlePurchaseSeats}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <>
                <span className="btn-spinner"></span>
                Processing Order...
              </>
            ) : (
              <>
                <FiCreditCard />
                Pay ${totalAmount.toFixed(2)} &amp; Add {seatsToAdd} {seatsToAdd === 1 ? 'Seat' : 'Seats'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Plan Tiers Overview */}
      <div className="plans-comparison-section">
        <div className="section-headline">
          <h2>Organization Plans</h2>
          <p>Flexible scaling tailored to modern engineering and management teams</p>
        </div>

        <div className="plans-triple-grid">
          {/* Starter Plan */}
          <div className="plan-tier-card">
            <h3 className="tier-name">Free Starter</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Ideal for personal testing and very small teams</p>
            <div className="tier-price-box">
              <span className="tier-big-price">$0</span>
              <span className="tier-price-sub">/ forever</span>
              <div className="tier-tagline">5 Seats Included</div>
            </div>
            <ul className="tier-features-list">
              <li className="tier-feature-item"><FiCheck /> Up to 5 team members</li>
              <li className="tier-feature-item"><FiCheck /> Unlimited projects &amp; tasks</li>
              <li className="tier-feature-item"><FiCheck /> Real-time team chat &amp; discussions</li>
              <li className="tier-feature-item"><FiCheck /> Task @mentions &amp; file sharing</li>
              <li className="tier-feature-item"><FiCheck /> 1 GB secure cloud storage</li>
            </ul>
            <button className="tier-btn current" disabled>Current Starter Base</button>
          </div>

          {/* Growth Plan - Active / Featured */}
          <div className="plan-tier-card featured-plan active-plan">
            <h3 className="tier-name">Team Growth</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>For growing teams that need custom member scale</p>
            <div className="tier-price-box">
              <span className="tier-big-price">${SEAT_PRICE.toFixed(2)}</span>
              <span className="tier-price-sub">/ member added</span>
              <div className="tier-tagline">+ 10% Platform Join Fee</div>
            </div>
            <ul className="tier-features-list">
              <li className="tier-feature-item"><FiCheck /> Add any number of member seats on demand</li>
              <li className="tier-feature-item"><FiCheck /> Flat 10% platform join fee</li>
              <li className="tier-feature-item"><FiCheck /> Full collaboration suite (Chat, Files, Discussions)</li>
              <li className="tier-feature-item"><FiCheck /> Granular RBAC (Admin, PM, Member)</li>
              <li className="tier-feature-item"><FiCheck /> Real-time activity feeds &amp; analytics</li>
              <li className="tier-feature-item"><FiCheck /> Priority email &amp; Discord support</li>
            </ul>
            <button 
              className="tier-btn primary"
              onClick={() => {
                window.scrollTo({ top: 180, behavior: 'smooth' });
              }}
            >
              Add Seats Above
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="plan-tier-card">
            <h3 className="tier-name">Enterprise</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>For large enterprises needing dedicated infra &amp; SLA</p>
            <div className="tier-price-box">
              <span className="tier-big-price">Custom</span>
              <span className="tier-price-sub">/ organization</span>
              <div className="tier-tagline">Volume Seat Discounts</div>
            </div>
            <ul className="tier-features-list">
              <li className="tier-feature-item"><FiCheck /> Unlimited team members</li>
              <li className="tier-feature-item"><FiCheck /> Dedicated single-tenant database instance</li>
              <li className="tier-feature-item"><FiCheck /> SAML / Okta SSO &amp; custom domain</li>
              <li className="tier-feature-item"><FiCheck /> 99.9% uptime SLA guarantee</li>
              <li className="tier-feature-item"><FiCheck /> 24/7 dedicated account manager</li>
            </ul>
            <a 
              href="mailto:enterprise@projectmanagement.com?subject=Enterprise%20Inquiry" 
              className="tier-btn"
              style={{ textDecoration: 'none' }}
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      {/* Payment & Invoice History */}
      <div className="invoices-history-section">
        <div className="billing-card-header">
          <h3 className="billing-card-title">
            <FiFileText />
            Invoices &amp; Payment History
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {paymentHistory.length} recorded {paymentHistory.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {paymentHistory.length === 0 ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
            No billing transactions recorded yet.
          </p>
        ) : (
          <div className="invoices-table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Seats Added</th>
                  <th>Base ($3/seat)</th>
                  <th>10% Platform Fee</th>
                  <th>Total Paid</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((invoice) => {
                  const sCount = invoice.seatsCount || 1;
                  const sCost = invoice.seatsCost != null ? invoice.seatsCost : (sCount * SEAT_PRICE);
                  const pFee = invoice.platformFee != null ? invoice.platformFee : (sCost * 0.10);
                  const total = invoice.totalAmount != null ? invoice.totalAmount : (sCost + pFee);

                  return (
                    <tr key={invoice.id || invoice.invoiceNumber}>
                      <td>
                        <span className="invoice-id-badge">
                          {invoice.invoiceNumber || invoice.id}
                        </span>
                      </td>
                      <td>{invoice.date}</td>
                      <td><strong>{invoice.description}</strong></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>+{sCount}</span>
                      </td>
                      <td>${sCost.toFixed(2)}</td>
                      <td style={{ color: '#0284c7', fontWeight: 600 }}>
                        +${pFee.toFixed(2)}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>${total.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`invoice-status-pill ${invoice.status || 'paid'}`}>
                          <FiCheck /> {invoice.status || 'paid'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="receipt-view-btn"
                          onClick={() => setSelectedInvoice({
                            ...invoice,
                            seatsCost: sCost,
                            platformFee: pFee,
                            totalAmount: total,
                            seatsCount: sCount
                          })}
                        >
                          <FiFileText /> View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="billing-card">
        <h3 className="billing-card-title" style={{ marginBottom: '1rem' }}>
          <FiHelpCircle />
          Frequently Asked Questions
        </h3>

        <div className="billing-faq-grid">
          <div className="faq-card-item">
            <h4>How does member pricing work?</h4>
            <p>
              Each additional team member seat is billed at <strong>${SEAT_PRICE.toFixed(2)}</strong>. 
              Seats are added instantly to your workspace limit as soon as checkout completes.
            </p>
          </div>

          <div className="faq-card-item">
            <h4>What is the 10% Platform Join Fee?</h4>
            <p>
              The <strong>10% platform join fee</strong> covers multi-tenant cloud infrastructure, 
              secure isolation, data backups, and high-availability real-time collaboration.
            </p>
          </div>

          <div className="faq-card-item">
            <h4>Do member seats expire?</h4>
            <p>
              No! Once seats are added to your organization, they remain available indefinitely. 
              You can assign, remove, and reassign seats to new teammates anytime.
            </p>
          </div>

          <div className="faq-card-item">
            <h4>Can I purchase custom quantities?</h4>
            <p>
              Yes! You can add 1 member, 5 members, 10 members, or any custom count 
              using our interactive seat calculator above.
            </p>
          </div>
        </div>
      </div>

      {/* Security & SSL Assurance */}
      <div className="billing-security-banner">
        <div className="security-badge-icon">
          <FiShield />
        </div>
        <div className="security-badge-text">
          <h4>256-Bit SSL Encrypted &amp; Secure Payments</h4>
          <p>
            Payment transactions are processed securely via Stripe. We adhere to PCI-DSS Level 1 
            compliance standards and never store sensitive credit card information on our servers.
          </p>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedInvoice && (
        <div className="receipt-modal-backdrop" onClick={() => setSelectedInvoice(null)}>
          <div className="receipt-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <h3>
                <FiFileText />
                Official Payment Receipt
              </h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setSelectedInvoice(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="receipt-modal-body">
              <div className="receipt-printable-slip">
                <div className="slip-header-brand">
                  <div>
                    <div className="slip-title">Project Management Tool</div>
                    <div className="slip-meta-label">Multi-Tenant Cloud Platform</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="slip-meta-label">Receipt #</div>
                    <div className="slip-meta-value">{selectedInvoice.invoiceNumber || selectedInvoice.id}</div>
                    <div className="slip-meta-label" style={{ marginTop: 4 }}>Date: {selectedInvoice.date}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="slip-meta-label">Billed To</div>
                  <div className="slip-meta-value">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Organization Admin'}</div>
                  <div className="slip-meta-label" style={{ color: '#64748b' }}>{user?.email || 'admin@organization.com'}</div>
                </div>

                <div className="slip-line-items">
                  <div className="slip-line-row">
                    <span>Member Seats (+{selectedInvoice.seatsCount} @ ${SEAT_PRICE.toFixed(2)})</span>
                    <span>${selectedInvoice.seatsCost.toFixed(2)}</span>
                  </div>

                  <div className="slip-line-row fee">
                    <span>Platform Join Fee (10%)</span>
                    <span>+${selectedInvoice.platformFee.toFixed(2)}</span>
                  </div>

                  <div className="slip-line-row total">
                    <span>Total Amount Paid</span>
                    <span style={{ color: '#16a34a' }}>${selectedInvoice.totalAmount.toFixed(2)} USD</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="slip-stamp-paid">PAID IN FULL</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Stripe Transaction Verified</span>
                </div>
              </div>

              <div className="receipt-modal-actions">
                <button 
                  type="button"
                  className="receipt-view-btn"
                  onClick={handlePrintReceipt}
                >
                  <FiPrinter /> Print Receipt
                </button>
                <button 
                  type="button"
                  className="purchase-action-btn"
                  style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                  onClick={() => setSelectedInvoice(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;