import React from 'react';
import { FiCheck, FiZap, FiStar } from 'react-icons/fi';

const PlanCard = ({ plan, onUpgrade, isProcessing, currentUserLimit }) => {
  const isCurrentPlan = plan.current;
  const isGrowthPlan = plan.name === 'Growth';
  const needsUpgrade = isGrowthPlan && currentUserLimit <= 5;

  const handleClick = () => {
    if (isGrowthPlan && needsUpgrade) {
      onUpgrade();
    } else if (plan.name === 'Enterprise') {
      // Handle enterprise contact
      window.location.href = 'mailto:sales@example.com';
    }
  };

  return (
    <div className={`plan-card ${isCurrentPlan ? 'current' : ''} ${plan.popular ? 'popular' : ''}`}>
      {plan.popular && (
        <div className="popular-badge">
          <FiStar />
          <span>Most Popular</span>
        </div>
      )}
      
      <div className="plan-header">
        <h3 className="plan-name">{plan.name}</h3>
        <div className="plan-price">
          {typeof plan.price === 'number' ? (
            <>
              <span className="price-amount">${plan.price}</span>
              {plan.price > 0 && <span className="price-period"> / one-time</span>}
            </>
          ) : (
            <span className="price-amount">{plan.price}</span>
          )}
        </div>
        <div className="plan-user-limit">
          <FiZap />
          <span>{plan.userLimit} users</span>
        </div>
      </div>

      <div className="plan-features">
        <ul>
          {plan.features.map((feature, index) => (
            <li key={index} className="feature-item">
              <FiCheck className="feature-icon" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="plan-actions">
        {isCurrentPlan ? (
          <button className="btn secondary-btn" disabled>
            Current Plan
          </button>
        ) : (
          <button
            className={`btn ${plan.popular ? 'primary-btn' : 'secondary-btn'}`}
            onClick={handleClick}
            disabled={isProcessing && isGrowthPlan}
          >
            {isProcessing && isGrowthPlan ? (
              <>
                <span className="btn-spinner"></span>
                Processing...
              </>
            ) : plan.name === 'Enterprise' ? (
              'Contact Sales'
            ) : (
              'Upgrade Now'
            )}
          </button>
        )}
      </div>

      {isGrowthPlan && (
        <div className="plan-note">
          <p>Adds 5 user slots to your current limit</p>
        </div>
      )}
    </div>
  );
};

export default PlanCard;