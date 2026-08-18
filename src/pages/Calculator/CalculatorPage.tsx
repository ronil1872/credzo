import React from 'react';
import { Link } from 'react-router-dom';

export const CalculatorPage: React.FC = () => {
  return (
    <div className="placeholder-page">
      <span className="placeholder-badge">Stage 1 Foundation</span>
      <h1 className="placeholder-title">Loan Calculator</h1>
      <p className="placeholder-desc">
        Calculate your estimated EMI transparently using reducing-balance formula.
      </p>
      <div className="placeholder-box">
        <p><strong>Route:</strong> <code>/calculator</code></p>
        <p><strong>Status:</strong> Route placeholder verified. Ready for Stage 3 interactive calculation engine.</p>
        <div style={{ marginTop: '1rem' }}>
          <Link to="/result" style={{ fontWeight: 600 }}>&rarr; Preview Result Page</Link>
        </div>
      </div>
    </div>
  );
};
