import React from 'react';

export const CampaignsPage: React.FC = () => {
  return (
    <div className="placeholder-page" style={{ textAlign: 'left', maxWidth: '100%', padding: 0 }}>
      <span className="placeholder-badge">Stage 1 Routing Placeholder</span>
      <h1 className="placeholder-title" style={{ fontSize: 'var(--font-size-2xl)' }}>Campaign Analytics</h1>
      <p className="placeholder-desc" style={{ margin: '0 0 var(--space-4) 0' }}>
        UTM marketing source attribution and conversion performance based on real leads data.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/admin/campaigns</code></p>
        <p><strong>Status:</strong> Active routing placeholder. Attribution analytics will be built in Stage 8.</p>
      </div>
    </div>
  );
};
