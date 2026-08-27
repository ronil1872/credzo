import React from 'react';

interface MobileStickyCtaProps {
  onTalkToExpert: () => void;
}

export const MobileStickyCta: React.FC<MobileStickyCtaProps> = ({ onTalkToExpert }) => {
  return (
    <div className="cz-mobile-sticky-bar" aria-label="Quick Action">
      <div className="cz-sticky-inner">
        <button
          type="button"
          className="cz-btn cz-btn-primary cz-sticky-btn"
          onClick={onTalkToExpert}
        >
          <span className="cz-sticky-icon">📞</span>
          <span>Talk to a Loan Expert</span>
          <span className="cz-sticky-arrow">&rarr;</span>
        </button>
      </div>
    </div>
  );
};
