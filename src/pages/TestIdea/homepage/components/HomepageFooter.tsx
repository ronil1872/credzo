import React from 'react';

interface HomepageFooterProps {
  onSelectSection: (sectionId: string) => void;
  onRequestCall: () => void;
}

export const HomepageFooter: React.FC<HomepageFooterProps> = ({
  onSelectSection,
  onRequestCall,
}) => {
  return (
    <footer className="cz-home-footer">
      <div className="cz-footer-container">
        <div className="cz-footer-main-row">
          {/* Brand Col */}
          <div className="cz-footer-brand-col">
            <div className="cz-brand-wrapper" onClick={() => onSelectSection('top')}>
              <img
                src="/images/credzo-icon.png"
                alt="Credzo Finance"
                className="cz-brand-icon"
                width="32"
                height="32"
              />
              <div className="cz-brand-text">
                <div className="cz-brand-name">
                  <span className="cz-brand-credzo">CREDZO</span>
                  <span className="cz-brand-finance">FINANCE</span>
                </div>
                <span className="cz-brand-subtag">Simplifying Loans, Amplifying Dreams</span>
              </div>
            </div>
            <p className="cz-footer-about">
              Credzo Finance provides loan advisory and eligibility assistance to help individuals and businesses find suitable financing solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="cz-footer-links-col">
            <h4 className="cz-footer-col-title">Navigation</h4>
            <div className="cz-footer-links-grid">
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('loans')}
              >
                Loans
              </button>
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('calculators')}
              >
                Calculator
              </button>
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('education-loan')}
              >
                Education Loan
              </button>
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('location-guide')}
              >
                Location Guide
              </button>
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('how-it-works')}
              >
                How It Works
              </button>
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('why-credzo')}
              >
                Why Choose Us
              </button>
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('faq')}
              >
                FAQs
              </button>
              <button
                type="button"
                className="cz-footer-link"
                onClick={() => onSelectSection('contact')}
              >
                Contact
              </button>
            </div>
          </div>

          {/* Direct CTA */}
          <div className="cz-footer-action-col">
            <h4 className="cz-footer-col-title">Need Loan Advice?</h4>
            <p className="cz-footer-action-text">
              Speak directly with our loan specialists to evaluate your profile.
            </p>
            <button
              type="button"
              className="cz-btn cz-btn-primary cz-btn-block"
              onClick={onRequestCall}
            >
              Request a Call
            </button>
          </div>
        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="cz-footer-bottom">
          <div className="cz-footer-disclaimer">
            <p>
              <strong>Disclaimer:</strong> Credzo Finance acts as an independent loan advisory platform. Loan approval, sanctioned amount, applicable interest rates, and loan terms are at the sole discretion of partner banks and Non-Banking Financial Companies (NBFCs). Calculations and eligibility results provided on this website are indicative estimates only.
            </p>
          </div>

          <div className="cz-footer-copyright-row">
            <span>&copy; {new Date().getFullYear()} Credzo Finance. All rights reserved.</span>
            <div className="cz-footer-legal-links">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
