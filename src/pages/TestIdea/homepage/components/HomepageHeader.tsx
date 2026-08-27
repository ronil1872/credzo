import React, { useState } from 'react';

interface HomepageHeaderProps {
  onRequestCall: () => void;
  onSelectSection: (sectionId: string) => void;
}

export const HomepageHeader: React.FC<HomepageHeaderProps> = ({
  onRequestCall,
  onSelectSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onSelectSection(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="cz-home-header">
      <div className="cz-home-header-container">
        {/* Brand Logo */}
        <div className="cz-brand-wrapper" onClick={() => handleNavClick('top')}>
          <img
            src="/images/credzo-icon.png"
            alt="Credzo Finance"
            className="cz-brand-icon"
            width="34"
            height="34"
          />
          <div className="cz-brand-text">
            <div className="cz-brand-name">
              <span className="cz-brand-credzo">CREDZO</span>
              <span className="cz-brand-finance">FINANCE</span>
            </div>
            <span className="cz-brand-subtag">Simplifying Loans</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="cz-desktop-nav" aria-label="Main Navigation">
          <button
            type="button"
            className="cz-nav-link"
            onClick={() => handleNavClick('top')}
          >
            Home
          </button>
          <button
            type="button"
            className="cz-nav-link"
            onClick={() => handleNavClick('loans')}
          >
            Loans
          </button>
          <button
            type="button"
            className="cz-nav-link"
            onClick={() => handleNavClick('calculators')}
          >
            Calculator
          </button>
          <button
            type="button"
            className="cz-nav-link"
            onClick={() => handleNavClick('education-loan')}
          >
            Education
          </button>
          <button
            type="button"
            className="cz-nav-link"
            onClick={() => handleNavClick('how-it-works')}
          >
            How It Works
          </button>
          <button
            type="button"
            className="cz-nav-link"
            onClick={() => handleNavClick('contact')}
          >
            Contact
          </button>
        </nav>

        {/* Desktop Header Action */}
        <div className="cz-header-actions">
          <button
            type="button"
            className="cz-btn cz-btn-primary cz-header-cta"
            onClick={onRequestCall}
          >
            Request a Call
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="cz-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <span className="cz-icon-close">✕</span>
            ) : (
              <span className="cz-icon-hamburger">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="cz-mobile-drawer" role="dialog" aria-label="Mobile Navigation">
          <div className="cz-mobile-drawer-links">
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('top')}
            >
              🏠 Home
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('loans')}
            >
              💳 Loan Types
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('calculators')}
            >
              💰 EMI & Savings Calculator
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('education-loan')}
            >
              🎓 Education Loan
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('location-guide')}
            >
              📍 Location Guide
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('how-it-works')}
            >
              ✨ How It Works
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('why-credzo')}
            >
              🛡️ Why Choose Credzo
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('faq')}
            >
              ❓ FAQs
            </button>
            <button
              type="button"
              className="cz-mobile-nav-link"
              onClick={() => handleNavClick('contact')}
            >
              📞 Contact Us
            </button>
          </div>

          <div className="cz-mobile-drawer-footer">
            <button
              type="button"
              className="cz-btn cz-btn-primary cz-btn-block"
              onClick={() => {
                setMobileMenuOpen(false);
                onRequestCall();
              }}
            >
              Request a Call
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
