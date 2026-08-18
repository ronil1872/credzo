import React from 'react';
import './Badge.css';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
