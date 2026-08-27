import React from 'react';

interface MidLeadCtaProps {
  onTalkToExpert: () => void;
}

export const MidLeadCta: React.FC<MidLeadCtaProps> = ({ onTalkToExpert }) => {
  return (
    <section className="cz-mid-cta-section">
      <div className="cz-mid-cta-container">
        <div className="cz-mid-cta-card">
          <div className="cz-mid-cta-content">
            <span className="cz-mid-cta-badge">Free Personal Consultation</span>
            <h2 className="cz-mid-cta-title">Not sure which loan is right for you?</h2>
            <p className="cz-mid-cta-desc">
              Tell us what you need. We'll help you understand your options without complicated jargon or obligations.
            </p>
          </div>

          <div className="cz-mid-cta-action">
            <button
              type="button"
              className="cz-btn cz-btn-light cz-btn-large"
              onClick={onTalkToExpert}
            >
              <span>Talk to a Loan Expert</span>
              <span className="cz-btn-arrow">&rarr;</span>
            </button>
            <span className="cz-mid-cta-subtext">Takes under 60 seconds • No credit check</span>
          </div>
        </div>
      </div>
    </section>
  );
};
