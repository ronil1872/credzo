import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui';
import { RequestCallModal } from '../../components/RequestCallModal/RequestCallModal';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRequestCallOpen, setIsRequestCallOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInsuranceRoute = location.pathname.startsWith('/insurance');

  // Read calculator snapshot if user has previously computed or interacted with calculator
  let calcSnapshot: {
    result?: { principal: number; tenureMonths: number; monthlyEmi: number };
    loanType?: string;
    monthlyIncome?: string;
    existingEmi?: string;
  } | null = null;

  try {
    const stored = sessionStorage.getItem('credzo_calculation_snapshot');
    if (stored) {
      calcSnapshot = JSON.parse(stored);
    }
  } catch {
    // Ignore sessionStorage issues
  }

  // Smooth scroll to top or targeted hash anchor on route changes
  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className={`public-layout ${isAdminRoute ? 'is-admin-view' : ''}`}>
      {/* Top Header */}
      <header className="public-header">
        <div className="container public-header-inner">
          <Link to="/" className="public-brand" onClick={closeMobileMenu} aria-label="Credzo Finance Home">
            <img
              src="/images/credzo-finance-logo.png"
              alt="Credzo Finance"
              className="brand-logo-img"
              width="160"
              height="38"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="public-nav desktop-nav" aria-label="Primary navigation">
            <Link 
              to="/calculator" 
              className={`nav-link ${location.pathname === '/calculator' ? 'active' : ''}`}
            >
              Calculator
            </Link>
            <Link 
              to="/insurance" 
              className={`nav-link ${location.pathname === '/insurance' ? 'active' : ''}`}
            >
              Insurance
            </Link>
            <Link 
              to="/#how-it-works" 
              className="nav-link"
            >
              How It Works
            </Link>
            <Link 
              to="/contact" 
              className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Right Actions */}
          <div className="header-actions desktop-nav">
            <button
              type="button"
              className="nav-request-call-btn"
              onClick={() => setIsRequestCallOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-call-icon">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Request a Call
            </button>
            <Button to="/calculator" variant="primary" size="sm">
              Calculate Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            type="button"
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
          </button>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-nav-menu">
            <div className="container mobile-nav-inner">
              <Link 
                to="/calculator" 
                className={`mobile-nav-link ${location.pathname === '/calculator' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Calculator
              </Link>
              <Link 
                to="/insurance" 
                className={`mobile-nav-link ${location.pathname === '/insurance' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Insurance
              </Link>
              <Link 
                to="/#how-it-works" 
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                How It Works
              </Link>
              <Link 
                to="/contact" 
                className={`mobile-nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
              <div className="mobile-nav-cta">
                <button
                  type="button"
                  className="mobile-drawer-call-btn"
                  onClick={() => {
                    closeMobileMenu();
                    setIsRequestCallOpen(true);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-call-icon">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Request a Call From Our Team
                </button>
                <Button 
                  to="/calculator" 
                  variant="primary" 
                  size="md" 
                  fullWidth 
                  onClick={closeMobileMenu}
                >
                  Calculate Loan EMI &rarr;
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="public-main" id="main-content" role="main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="container public-footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <Link to="/" className="public-brand footer-logo" aria-label="Credzo Finance Home">
                <img
                  src="/images/credzo-finance-logo.png"
                  alt="Credzo Finance"
                  className="brand-logo-img footer-logo-img"
                  width="180"
                  height="42"
                />
              </Link>
              <p className="footer-tagline">
                Fast, transparent, illustrative loan estimations &amp; comprehensive insurance facilitation.
              </p>
            </div>

            <div className="footer-links-col">
              <h4 className="footer-heading">Services</h4>
              <ul className="footer-nav">
                <li><Link to="/calculator">Loan Calculator</Link></li>
                <li><Link to="/insurance">Insurance Plans</Link></li>
                <li>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => setIsRequestCallOpen(true)}
                  >
                    Request a Call
                  </button>
                </li>
                <li><Link to="/#how-it-works">How It Works</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4 className="footer-heading">Company &amp; Legal</h4>
              <ul className="footer-nav">
                <li><Link to="/contact">Contact Support</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/admin/login">Staff Portal</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-disclaimer-box">
            <p>
              <strong>Disclaimer:</strong> Credzo Finance is an independent financial technology and facilitation platform. Calculations and quotes provided are illustrative estimates. Final loan terms, interest rates, insurance underwriting, and policy sanctions are exclusively determined by the respective participating lending institutions and insurance carriers.
            </p>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} Credzo Finance. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Persistent Bottom "Request a Call" CTA */}
      {!isAdminRoute && !isRequestCallOpen && (
        <div className="mobile-fixed-call-bar" role="region" aria-label="Quick callback assistance">
          <div className="container mobile-fixed-call-inner">
            <button
              type="button"
              className="mobile-fixed-call-btn"
              id="mobile-fixed-request-call-btn"
              onClick={() => setIsRequestCallOpen(true)}
            >
              <div className="fixed-call-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="fixed-call-icon">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="fixed-call-text-group">
                <span className="fixed-call-main-text">Request a Call</span>
                <span className="fixed-call-sub-text">100% Free • Talk to our team</span>
              </div>
              <div className="fixed-call-arrow">
                <span>&rarr;</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Global Header & Mobile Fixed Bar Request a Call Modal */}
      <RequestCallModal
        isOpen={isRequestCallOpen}
        onClose={() => setIsRequestCallOpen(false)}
        initialService={isInsuranceRoute ? 'insurance' : 'loan'}
        initialLoanType={calcSnapshot?.loanType || 'personal'}
        initialRequestedAmount={calcSnapshot?.result?.principal}
        initialTenureMonths={calcSnapshot?.result?.tenureMonths}
        initialMonthlyIncome={calcSnapshot?.monthlyIncome || ''}
        initialExistingEmi={calcSnapshot?.existingEmi || ''}
        calculatedEmi={calcSnapshot?.result?.monthlyEmi}
        title={isInsuranceRoute ? 'Request an Insurance Callback' : 'Get a Call From Our Team'}
        subtitle={isInsuranceRoute ? 'Our insurance advisory specialists will connect with you to review tailored policies.' : 'Our advisors are here to help you choose the best loan or insurance option.'}
      />
    </div>
  );
};
