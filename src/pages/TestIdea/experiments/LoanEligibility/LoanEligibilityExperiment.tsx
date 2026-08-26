import React from 'react';

export const LoanEligibilityExperiment: React.FC = () => {
  return (
    <div className="experiment-scaffold-placeholder">
      <div className="experiment-scaffold-icon">🏠</div>
      <h3 className="experiment-scaffold-title">Home Loan Eligibility Checker</h3>
      <p className="experiment-scaffold-desc">
        This experiment is reserved for prototyping a step-by-step home loan eligibility estimation tool with borrower income, liabilities, co-applicant calculations, and bank FOIR policies.
      </p>

      <div className="experiment-scaffold-notice">
        <p><strong>🔒 Prototype Mode Rules:</strong></p>
        <ul>
          <li>All inputs & results use local React state.</li>
          <li>Uses mock loan policy benchmarks (no production Supabase writes).</li>
          <li>No customer lead creation or CRM push.</li>
        </ul>
      </div>
    </div>
  );
};
