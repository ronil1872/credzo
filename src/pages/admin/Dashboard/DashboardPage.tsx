import React from 'react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return (
    <div className="placeholder-page" style={{ textAlign: 'left', maxWidth: '100%', padding: 0 }}>
      <span className="placeholder-badge">Stage 1 Routing Placeholder</span>
      <h1 className="placeholder-title" style={{ fontSize: 'var(--font-size-2xl)' }}>CRM Sales Dashboard</h1>
      <p className="placeholder-desc" style={{ margin: '0 0 var(--space-4) 0' }}>
        Overview of daily enquiries, pipeline status metrics, and potential requested loan value.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/admin</code></p>
        <p><strong>Status:</strong> Active routing placeholder. Metrics and data integration will occur in Stage 7.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link to="/admin/leads">&rarr; View Leads</Link>
          <Link to="/admin/follow-ups">&rarr; View Follow-ups</Link>
          <Link to="/admin/campaigns">&rarr; View Campaigns</Link>
        </div>
      </div>
    </div>
  );
};
