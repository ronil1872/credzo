import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="public-layout">
      {/* Top Header */}
      <header className="public-header">
        <div className="container public-header-inner">
          <Link to="/" className="public-brand" onClick={closeMobileMenu}>
            <span className="brand-name">Credzo</span>
            <span className="brand-accent">Finance</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="public-nav desktop-nav" aria-label="Primary navigation">
            <Link 
              to="/calculator" 
              className={`nav-link ${location.pathname === '/calculator' ? 'active' : ''}`}
            >
              Calculator
            </Link>
            <a href="/#how-it-works" className="nav-link">
              How It Works
            </a>
            <Link 
              to="/contact" 
              className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Right CTA */}
          <div className="header-actions desktop-nav">
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
              <a 
                href="/#how-it-works" 
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                How It Works
              </a>
              <Link 
                to="/contact" 
                className={`mobile-nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
              <div className="mobile-nav-cta">
                <Button 
                  to="/calculator" 
                  variant="primary" 
                  size="md" 
                  fullWidth 
                  onClick={closeMobileMenu}
                >
                  Calculate Now &rarr;
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
              <Link to="/" className="public-brand footer-logo">
                <span className="brand-name">Credzo</span>
                <span className="brand-accent">Finance</span>
              </Link>
              <p className="footer-desc">
                Free illustrative loan calculations and voluntary loan enquiries for informed financial decisions.
              </p>
              <div className="footer-tagline-badge">
                <span>Free estimate • No obligation</span>
              </div>
            </div>

            <div className="footer-links-col">
              <h4>Navigation</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/calculator">Loan Calculator</Link></li>
                <li><a href="/#how-it-works">How It Works</a></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Legal & Disclaimers</h4>
              <ul>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms & Disclaimer</Link></li>
                <li><Link to="/admin/login" className="footer-staff-link">Staff Portal</Link></li>
              </ul>
            </div>
          </div>

          {/* Understated Legal Disclaimer */}
          <div className="footer-disclaimer">
            <p>
              <strong>Important Disclaimer:</strong> Credzo Finance is a customer acquisition and lead-generation platform. We are not a bank, Non-Banking Financial Company (NBFC), or official lending institution. We do not approve loans, determine official credit eligibility, or guarantee loan disbursements. All calculations and estimations provided on this website are strictly illustrative estimates based on user-provided inputs. Final loan terms, interest rates, eligibility, and approval are solely determined by the relevant lending institutions following documentation and verification.
            </p>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Credzo Finance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
