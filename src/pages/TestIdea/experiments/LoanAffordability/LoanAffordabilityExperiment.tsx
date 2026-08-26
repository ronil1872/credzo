import React from 'react';

export const LoanAffordabilityExperiment: React.FC = () => {
  return (
    <div className="experiment-scaffold-placeholder">
      <div className="experiment-scaffold-icon">💰</div>
      <h3 className="experiment-scaffold-title">Loan Affordability & Budget Planner</h3>
      <p className="experiment-scaffold-desc">
        This experiment is reserved for prototyping a dynamic affordability calculator analyzing disposable income, household expense profiles, and stress-tested interest rate variations.
      </p>

      <div className="experiment-scaffold-notice">
        <p><strong>🔒 Prototype Mode Rules:</strong></p>
        <ul>
          <li>All inputs & results use local React state.</li>
          <li>Uses mock affordability calculation algorithms.</li>
          <li>No production Supabase writes or customer lead creation.</li>
        </ul>
      </div>
    </div>
  );
};
