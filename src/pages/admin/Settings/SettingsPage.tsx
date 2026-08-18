import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="placeholder-page" style={{ textAlign: 'left', maxWidth: '100%', padding: 0 }}>
      <span className="placeholder-badge">Stage 1 Routing Placeholder</span>
      <h1 className="placeholder-title" style={{ fontSize: 'var(--font-size-2xl)' }}>CRM Settings</h1>
      <p className="placeholder-desc" style={{ margin: '0 0 var(--space-4) 0' }}>
        System configurations, illustrative interest rates, and user profile management.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/admin/settings</code></p>
        <p><strong>Status:</strong> Active routing placeholder. Rate settings and preferences will be configured in Stage 7.</p>
      </div>
    </div>
  );
};
