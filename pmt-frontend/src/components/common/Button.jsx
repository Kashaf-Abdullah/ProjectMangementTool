import React from 'react';
import '../../styles/components/buttons.css';

const Button = ({ 
  children,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info',
    light: 'btn-light',
    dark: 'btn-dark',
    ghost: 'btn-ghost',
    link: 'btn-link'
  }[variant];

  const sizeClass = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg'
  }[size];

  const buttonClasses = [
    'btn',
    variantClass,
    sizeClass,
    fullWidth ? 'btn-full' : '',
    loading ? 'loading' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <span className="btn-spinner">
          <div className="spinner-sm"></div>
        </span>
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <span className="btn-icon-left">
          <Icon />
        </span>
      )}
      <span className="btn-content">{children}</span>
      {Icon && iconPosition === 'right' && !loading && (
        <span className="btn-icon-right">
          <Icon />
        </span>
      )}
    </button>
  );
};

export default Button;