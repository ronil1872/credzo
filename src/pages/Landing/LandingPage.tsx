import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="placeholder-page">
      <span className="placeholder-badge">Stage 1 Foundation</span>
      <h1 className="placeholder-title">LoanCheck Landing Page</h1>
      <p className="placeholder-desc">
        Need a Loan? Check your estimated EMI in 60 seconds — FREE. Free estimate. No obligation.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/</code></p>
        <p><strong>Status:</strong> Route placeholder verified. Ready for Stage 2 UI implementation.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/calculator" style={{ fontWeight: 600 }}>&rarr; Go to Calculator</Link>
        </div>
      </div>
    </div>
  );
};
