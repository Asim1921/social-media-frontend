'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className = '' 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4 border-2';
      case 'large':
        return 'w-8 h-8 border-4';
      default:
        return 'w-6 h-6 border-2';
    }
  };

  return (
    <div className={`loading-spinner ${getSizeClasses()} ${className}`}></div>
  );
};

export default LoadingSpinner;