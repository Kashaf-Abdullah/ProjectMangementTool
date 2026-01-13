import React from 'react';
import '../../styles/components/common.css';

const LoadingSpinner = ({ size = 'medium', color = 'primary', fullScreen = false }) => {
  const sizeClass = {
    small: 'spinner-sm',
    medium: 'spinner-md',
    large: 'spinner-lg'
  }[size];

  const colorClass = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    light: 'spinner-light',
    dark: 'spinner-dark'
  }[color];

  if (fullScreen) {
    return (
      <div className="fullscreen-spinner">
        <div className={`spinner ${sizeClass} ${colorClass}`}></div>
      </div>
    );
  }

  return (
    <div className={`spinner ${sizeClass} ${colorClass}`}></div>
  );
};

export default LoadingSpinner;