import React from 'react';
import { FiCheck, FiZap, FiStar } from 'react-icons/fi';

const PlanCard = ({ plan, onUpgrade, isProcessing, currentUserLimit }) => {
  const isCurrentPlan = plan.current;
  const isGrowthPlan = plan.name === 'Growth' || plan.name === 'Team Growth';

  const handleClick = () => {
    if (isGrowthPlan) {
      onUpgrade();
    } else if (plan.name === 'Enterprise') {
      window.location.href = 'mailto:sales@projectmanagement.com';
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
              <span className="price-amount">${plan.price.toFixed(2)}</span>
              {plan.price > 0 && <span className="price-period"> / member</span>}
            </>
          ) : (
            <span className="price-amount">{plan.price}</span>
          )}
        </div>
        <div className="plan-user-limit">
          <FiZap />
          <span>{plan.userLimit}</span>
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
              'Upgrade Seats'
            )}
          </button>
        )}
      </div>

      {isGrowthPlan && (
        <div className="plan-note">
          <p>$3.00/member + 10% platform join fee</p>
        </div>
      )}
    </div>
  );
};

export default PlanCard;