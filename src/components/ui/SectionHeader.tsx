import React from 'react';
import './SectionHeader.css';

export interface SectionHeaderProps {
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'neutral';
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  badgeVariant = 'primary',
  title,
  subtitle,
  centered = true,
  className = '',
}) => {
  return (
    <div className={`section-header ${centered ? 'text-center' : 'text-left'} ${className}`}>
      {badge && (
        <span className={`section-header-badge badge-${badgeVariant}`}>
          {badge}
        </span>
      )}
      <h2 className="section-header-title">{title}</h2>
      {subtitle && <p className="section-header-subtitle">{subtitle}</p>}
    </div>
  );
};
