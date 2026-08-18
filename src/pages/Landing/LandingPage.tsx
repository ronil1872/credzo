import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, SectionHeader } from '../../components/ui';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const loanTypes = [
    {
      id: 'personal',
      title: 'Personal Loan',
      description: 'Quick calculation for medical, travel, wedding, or emergency personal expenses.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'business',
      title: 'Business Loan',
      description: 'Estimate working capital and expansion finance for growing enterprises.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      id: 'home',
      title: 'Home Loan',
      description: 'Calculate long-term EMIs for purchasing, building, or renovating residential property.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'lap',
      title: 'Loan Against Property',
      description: 'Unlock high-value funding against residential or commercial property equity.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
    },
    {
      id: 'gold',
      title: 'Gold Loan',
      description: 'Fast, illustrative calculations for short-term liquidity against gold assets.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
        </svg>
      ),
    },
    {
      id: 'other',
      title: 'Other Loans',
      description: 'Flexible illustrative estimations for vehicle, education, or specialized funding.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Enter your details',
      description: 'Choose your loan type and enter basic information such as amount, tenure, and income.',
    },
    {
      number: '02',
      title: 'See your estimate',
      description: 'Get an instant, transparent breakdown of your estimated monthly EMI and total interest.',
    },
    {
      number: '03',
      title: 'Request a callback',
      description: 'If you want to discuss loan options with a specialist, voluntarily request a free callback.',
    },
  ];

  const benefits = [
    {
      title: 'Free',
      description: 'Zero fee and zero charges to check illustrative loan estimates anytime.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: 'Simple',
      description: 'No complicated paperwork or cumbersome signups just to calculate an EMI.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: 'Transparent',
      description: 'Standard reducing-balance mathematical calculations with clear breakdowns.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h20" />
          <path d="M20 12v8H4v-8" />
          <path d="m4 4 16 0" />
          <path d="M12 4v16" />
        </svg>
      ),
    },
    {
      title: 'No Obligation',
      description: 'Calculating an estimate never commits you to applying for or taking any loan.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
  ];

  const trustDisclosures = [
    {
      title: 'Illustrative Estimates Only',
      text: 'All calculations provided on Credzo Finance are mathematical simulations based on user inputs. They are provided solely for financial planning and illustrative comparison.',
    },
    {
      title: 'Lender Determination',
      text: 'Final interest rates, processing fees, loan tenure, and eligibility criteria are determined exclusively by the respective lending institutions.',
    },
    {
      title: 'Verification & Documentation',
      text: 'Formal loan approval and disbursement depend on direct verification of financial and identity documents according to lender credit policies.',
    },
    {
      title: 'Voluntary Enquiries',
      text: 'Submitting a callback request on this platform does not guarantee loan eligibility, pre-approval, or final sanction by any lender.',
    },
  ];

  return (
    <div className="landing-page">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <Badge variant="primary" size="md" className="hero-badge">
              <span>Free • 60-Second Estimate • No Obligation</span>
            </Badge>

            <h1 className="hero-headline">
              Need a <span className="headline-highlight">Loan?</span>
            </h1>

            <p className="hero-subheadline">
              Check your estimated EMI in 60 seconds — <strong>FREE.</strong>
            </p>

            <p className="hero-text">
              Get a quick illustrative EMI estimate with no obligation.
            </p>

            <div className="hero-cta-group">
              <Button to="/calculator" variant="primary" size="lg" className="hero-btn">
                Calculate Now &rarr;
              </Button>
              <span className="hero-cta-note">
                Free estimate. No obligation.
              </span>
            </div>
          </div>

          {/* Minimalist Preview Teaser Box */}
          <div className="hero-preview-wrapper">
            <div className="hero-preview-card">
              <div className="preview-header">
                <span className="preview-label">Illustrative Calculation Preview</span>
                <span className="preview-tag">Personal Loan</span>
              </div>
              <div className="preview-body">
                <div className="preview-metric">
                  <span className="preview-metric-label">Estimated Monthly EMI</span>
                  <div className="preview-metric-value">
                    ₹16,134<span className="preview-metric-unit">/month</span>
                  </div>
                </div>
                <div className="preview-grid">
                  <div className="preview-subitem">
                    <span className="subitem-label">Loan Amount</span>
                    <span className="subitem-val">₹5,00,000</span>
                  </div>
                  <div className="preview-subitem">
                    <span className="subitem-label">Tenure</span>
                    <span className="subitem-val">36 Months</span>
                  </div>
                  <div className="preview-subitem">
                    <span className="subitem-label">Est. Total Interest</span>
                    <span className="subitem-val">₹80,824</span>
                  </div>
                </div>
                <div className="preview-footer">
                  <Link to="/calculator" className="preview-action-link">
                    Customize your loan parameters &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Loan Types Section */}
      <section className="section loan-types-section" id="loan-types">
        <div className="container">
          <SectionHeader
            badge="Versatile Planning"
            title="Calculate for the loan you need."
            subtitle="Choose your preferred loan category to see estimated installments and repayment breakdowns."
          />

          <div className="loan-types-grid">
            {loanTypes.map((type) => (
              <Link to="/calculator" key={type.id} className="loan-type-card">
                <div className="loan-type-icon">{type.icon}</div>
                <h3 className="loan-type-title">{type.title}</h3>
                <p className="loan-type-desc">{type.description}</p>
                <div className="loan-type-cta">
                  <span>Calculate EMI &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section className="section how-it-works-section" id="how-it-works">
        <div className="container">
          <SectionHeader
            badge="Simple 3-Step Process"
            title="How It Works"
            subtitle="Calculate your loan estimates and enquire in three straightforward steps."
          />

          <div className="steps-grid">
            {steps.map((step) => (
              <div key={step.number} className="step-card">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Value Proposition / Benefits */}
      <section className="section benefits-section">
        <div className="container">
          <SectionHeader
            badge="Why Credzo Finance"
            title="Built for clarity and confidence"
            subtitle="We believe loan estimation should be transparent, accessible, and completely pressure-free."
          />

          <div className="benefits-grid">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="benefit-card">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-desc">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Trust / Important Information / Disclaimers */}
      <section className="section trust-section">
        <div className="container">
          <div className="trust-box">
            <div className="trust-header">
              <span className="trust-badge">Transparency First</span>
              <h2 className="trust-title">Important information</h2>
              <p className="trust-subtitle">
                Please review these core principles regarding our illustrative estimation service.
              </p>
            </div>

            <div className="trust-grid">
              {trustDisclosures.map((item) => (
                <div key={item.title} className="trust-item">
                  <div className="trust-item-bullet" />
                  <div>
                    <h4 className="trust-item-title">{item.title}</h4>
                    <p className="trust-item-text">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Primary CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">
              Know your estimated EMI before you decide.
            </h2>
            <p className="cta-subtitle">
              It takes about 60 seconds. Free estimate. No obligation.
            </p>
            <div className="cta-action">
              <Button to="/calculator" variant="primary" size="lg" className="cta-btn">
                Calculate My EMI &rarr;
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
