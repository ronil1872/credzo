import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  to?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  to,
  icon,
  iconPosition = 'right',
  children,
  className = '',
  ...props
}) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="btn-icon btn-icon-left">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="btn-icon btn-icon-right">{icon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classNames} aria-label={typeof children === 'string' ? children : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classNames} {...props}>
      {content}
    </button>
  );
};
