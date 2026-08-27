import React from 'react';

export const TrustStrip: React.FC = () => {
  return (
    <section className="cz-trust-strip" aria-label="Credzo Commitments">
      <div className="cz-trust-container">
        <div className="cz-trust-item">
          <span className="cz-trust-check">✓</span>
          <span className="cz-trust-label">Free eligibility check</span>
        </div>
        <div className="cz-trust-item">
          <span className="cz-trust-check">✓</span>
          <span className="cz-trust-label">Multiple loan options</span>
        </div>
        <div className="cz-trust-item">
          <span className="cz-trust-check">✓</span>
          <span className="cz-trust-label">Simple application process</span>
        </div>
        <div className="cz-trust-item">
          <span className="cz-trust-check">✓</span>
          <span className="cz-trust-label">Personal assistance</span>
        </div>
      </div>
    </section>
  );
};
