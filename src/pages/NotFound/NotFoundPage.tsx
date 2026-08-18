import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="placeholder-page">
      <span className="placeholder-badge" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
        404 Error
      </span>
      <h1 className="placeholder-title">Page Not Found</h1>
      <p className="placeholder-desc">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="placeholder-box" style={{ textAlign: 'center' }}>
        <Link to="/" style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>
          &larr; Return to Home Page
        </Link>
      </div>
    </div>
  );
};
