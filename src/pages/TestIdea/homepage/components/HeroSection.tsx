import React from 'react';

interface HeroSectionProps {
  onCheckEligibility: () => void;
  onTalkToExpert: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCheckEligibility,
  onTalkToExpert,
}) => {
  return (
    <section className="cz-hero-section" id="top">
      <div className="cz-hero-container">
        <div className="cz-hero-content">
          {/* Tagline Badge */}
          <div className="cz-hero-badge">
            <span className="cz-badge-dot"></span>
            <span>Simplified Loan Advisory & Assistance</span>
          </div>

          {/* Main Headline */}
          <h1 className="cz-hero-title">
            Find the Right Loan for Your Needs
          </h1>

          {/* Subheadline */}
          <p className="cz-hero-subtitle">
            Compare your options, check your estimated eligibility, and get help from our loan experts.
          </p>

          {/* Action CTAs */}
          <div className="cz-hero-actions">
            <button
              type="button"
              className="cz-btn cz-btn-primary cz-btn-hero"
              onClick={onCheckEligibility}
            >
              Check My Eligibility
              <span className="cz-btn-arrow">&rarr;</span>
            </button>

            <button
              type="button"
              className="cz-btn cz-btn-secondary cz-btn-hero"
              onClick={onTalkToExpert}
            >
              Talk to a Loan Expert
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="cz-hero-highlights">
            <div className="cz-highlight-item">
              <span className="cz-highlight-icon">⚡</span>
              <span>100% Free Initial Assessment</span>
            </div>
            <div className="cz-highlight-item">
              <span className="cz-highlight-icon">🔒</span>
              <span>No Impact on CIBIL Score</span>
            </div>
            <div className="cz-highlight-item">
              <span className="cz-highlight-icon">🤝</span>
              <span>Personal Advisory</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="cz-hero-visual">
          <div className="cz-hero-card">
            <div className="cz-hero-card-header">
              <div className="cz-hero-card-badge">Fast Track</div>
              <span className="cz-hero-card-time">2 Min Process</span>
            </div>
            
            <h2 className="cz-hero-card-title">Explore Suitable Loan Options</h2>
            <p className="cz-hero-card-text">
              Share a few basic details and our advisory team will help evaluate suitable loan options for you.
            </p>

            <div className="cz-hero-options-preview">
              <div className="cz-preview-pill">🏠 Home Loan</div>
              <div className="cz-preview-pill">🎓 Education Loan</div>
              <div className="cz-preview-pill">💰 Personal Loan</div>
              <div className="cz-preview-pill">🏢 Business Loan</div>
              <div className="cz-preview-pill">🏦 Loan Against Property</div>
            </div>

            <button
              type="button"
              className="cz-btn cz-btn-primary cz-btn-block"
              onClick={onCheckEligibility}
            >
              Start Free Eligibility Check &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
