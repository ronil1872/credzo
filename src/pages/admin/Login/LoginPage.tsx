import React from 'react';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  return (
    <div className="placeholder-page">
      <span className="placeholder-badge">Stage 1 Foundation</span>
      <h1 className="placeholder-title">Staff CRM Login</h1>
      <p className="placeholder-desc">
        Secure authentication portal for authorized loan sales staff.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/admin/login</code></p>
        <p><strong>Status:</strong> Authentication disabled in Stage 1. Direct access enabled for routing testing.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/admin" style={{ fontWeight: 600 }}>&rarr; Enter CRM Dashboard (Routing Test)</Link>
        </div>
      </div>
    </div>
  );
};
