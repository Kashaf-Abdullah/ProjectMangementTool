import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import '../../styles/components/cards.css';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  trend, 
  trendValue,
  progress,
  link,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="stats-card loading">
        <div className="stats-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-value"></div>
        </div>
      </div>
    );
  }

  const renderContent = (
    <>
      <div className="stats-header">
        <div className="stats-icon" style={{ backgroundColor: `${color}20`, color: color }}>
          {icon}
        </div>
        {trend && (
          <div className={`stats-trend ${trend}`}>
            {trend === 'up' ? <FiArrowUpRight /> : <FiArrowDownRight />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="stats-body">
        <h3 className="stats-title">{title}</h3>
        <div className="stats-value">{value}</div>
      </div>
      
      {typeof progress === 'number' && (
        <div className="stats-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: color
              }}
            />
          </div>
          <div className="progress-label">{progress.toFixed(1)}%</div>
        </div>
      )}
    </>
  );

  const cardClass = `stats-card ${link ? 'clickable' : ''}`;
  
  if (link) {
    return (
      <Link to={link} className={cardClass}>
        {renderContent}
      </Link>
    );
  }

  return (
    <div className={cardClass}>
      {renderContent}
    </div>
  );
};

export default StatsCard;