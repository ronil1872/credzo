import React from 'react';
import { Link } from 'react-router-dom';

export const LeadsPage: React.FC = () => {
  return (
    <div className="placeholder-page" style={{ textAlign: 'left', maxWidth: '100%', padding: 0 }}>
      <span className="placeholder-badge">Stage 1 Routing Placeholder</span>
      <h1 className="placeholder-title" style={{ fontSize: 'var(--font-size-2xl)' }}>Leads Management</h1>
      <p className="placeholder-desc" style={{ margin: '0 0 var(--space-4) 0' }}>
        Filterable and searchable customer enquiries, lead scoring, and temperature classification.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/admin/leads</code></p>
        <p><strong>Status:</strong> Active routing placeholder. Leads list and filters will be implemented in Stage 7.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/admin/leads/sample-lead-id">&rarr; Test Lead Detail Route (/admin/leads/:id)</Link>
        </div>
      </div>
    </div>
  );
};
