import React from 'react';
import { Link } from 'react-router-dom';

export const ResultPage: React.FC = () => {
  return (
    <div className="placeholder-page">
      <span className="placeholder-badge">Stage 1 Foundation</span>
      <h1 className="placeholder-title">Calculation Result & Callback Enquiry</h1>
      <p className="placeholder-desc">
        Illustrative estimate summary and voluntary callback enquiry form with explicit consent.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/result</code></p>
        <p><strong>Status:</strong> Route placeholder verified. Ready for Stage 5 lead capture integration.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/calculator" style={{ fontWeight: 600 }}>&larr; Back to Calculator</Link>
        </div>
      </div>
    </div>
  );
};
