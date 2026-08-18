import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="container public-header-inner">
          <Link to="/" className="public-brand">
            <span className="brand-primary">Loan</span>
            <span className="brand-accent">Check</span>
          </Link>
          <nav className="public-nav">
            <Link to="/calculator" className={`nav-link ${location.pathname === '/calculator' ? 'active' : ''}`}>
              Calculator
            </Link>
            <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
              Contact
            </Link>
            <Link to="/admin/login" className="nav-link admin-link">
              Staff Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="container public-footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="public-brand footer-logo">
                <span className="brand-primary">Loan</span>
                <span className="brand-accent">Check</span>
              </div>
              <p className="footer-desc">
                Free illustrative loan EMI calculations and voluntary callback enquiries.
              </p>
            </div>
            <div className="footer-links-col">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/calculator">Loan Calculator</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4>Legal & Transparency</h4>
              <ul>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-disclaimer">
            <p>
              <strong>Disclaimer:</strong> LoanCheck is a free customer acquisition and lead-generation platform. We are not a bank, NBFC, or official lender. We do not issue loans, approve credit, or guarantee approval. All calculations provided are strictly illustrative estimates.
            </p>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} LoanCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
