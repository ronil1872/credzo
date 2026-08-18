import React from 'react';

export const FollowUpsPage: React.FC = () => {
  return (
    <div className="placeholder-page" style={{ textAlign: 'left', maxWidth: '100%', padding: 0 }}>
      <span className="placeholder-badge">Stage 1 Routing Placeholder</span>
      <h1 className="placeholder-title" style={{ fontSize: 'var(--font-size-2xl)' }}>Follow-ups Agenda</h1>
      <p className="placeholder-desc" style={{ margin: '0 0 var(--space-4) 0' }}>
        Daily scheduled customer callbacks and priority tasks for human follow-up.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/admin/follow-ups</code></p>
        <p><strong>Status:</strong> Active routing placeholder. Task schedule will be integrated in Stage 7.</p>
      </div>
    </div>
  );
};
