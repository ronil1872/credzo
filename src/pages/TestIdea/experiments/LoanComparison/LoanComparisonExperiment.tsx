import React from 'react';

export const LoanComparisonExperiment: React.FC = () => {
  return (
    <div className="experiment-scaffold-placeholder">
      <div className="experiment-scaffold-icon">🏦</div>
      <h3 className="experiment-scaffold-title">Multi-Bank Loan Comparison Matrix</h3>
      <p className="experiment-scaffold-desc">
        This experiment is reserved for prototyping a side-by-side comparative matrix of bank offers, APR calculation, processing fees, prepayment penalties, and total borrowing costs.
      </p>

      <div className="experiment-scaffold-notice">
        <p><strong>🔒 Prototype Mode Rules:</strong></p>
        <ul>
          <li>All inputs & results use local React state.</li>
          <li>Uses mock sample bank rate tiers.</li>
          <li>No production Supabase writes or customer lead creation.</li>
        </ul>
      </div>
    </div>
  );
};
