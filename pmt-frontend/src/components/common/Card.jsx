import React from 'react';
import '../../styles/components/cards.css';

const Card = ({ 
  children, 
  className = '', 
  padding = 'medium',
  hoverable = false,
  bordered = true,
  shadow = 'medium',
  onClick
}) => {
  const paddingClass = {
    none: 'p-none',
    small: 'p-sm',
    medium: 'p-md',
    large: 'p-lg',
    xlarge: 'p-xl'
  }[padding];

  const shadowClass = {
    none: 'shadow-none',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg'
  }[shadow];

  const cardClasses = [
    'card',
    paddingClass,
    shadowClass,
    hoverable ? 'hoverable' : '',
    bordered ? 'bordered' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  );
};

export default Card;