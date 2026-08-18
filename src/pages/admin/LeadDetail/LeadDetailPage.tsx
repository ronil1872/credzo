import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="placeholder-page" style={{ textAlign: 'left', maxWidth: '100%', padding: 0 }}>
      <span className="placeholder-badge">Stage 1 Routing Placeholder</span>
      <h1 className="placeholder-title" style={{ fontSize: 'var(--font-size-2xl)' }}>
        Lead Profile Details
      </h1>
      <p className="placeholder-desc" style={{ margin: '0 0 var(--space-4) 0' }}>
        Detailed lead snapshot, calculator results, status workflow, chronological notes, and follow-ups.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/admin/leads/:id</code></p>
        <p><strong>Captured Route Parameter (ID):</strong> <code>{id || 'none'}</code></p>
        <p><strong>Status:</strong> Active routing placeholder. Full lead profile will be built in Stage 7.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/admin/leads">&larr; Back to Leads List</Link>
        </div>
      </div>
    </div>
  );
};
