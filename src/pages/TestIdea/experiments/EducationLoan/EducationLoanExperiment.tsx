import React from 'react';

export const EducationLoanExperiment: React.FC = () => {
  return (
    <div className="experiment-scaffold-placeholder">
      <div className="experiment-scaffold-icon">🎓</div>
      <h3 className="experiment-scaffold-title">Education Loan Planner</h3>
      <p className="experiment-scaffold-desc">
        This experiment is reserved for prototyping a specialized student financing planner supporting study abroad programs, domestic universities, moratorium grace periods, and simple/compound interest toggles.
      </p>

      <div className="experiment-scaffold-notice">
        <p><strong>🔒 Prototype Mode Rules:</strong></p>
        <ul>
          <li>All inputs & results use local React state.</li>
          <li>Uses mock loan amortization with course moratorium calculations.</li>
          <li>No production Supabase writes or customer lead creation.</li>
        </ul>
      </div>
    </div>
  );
};
