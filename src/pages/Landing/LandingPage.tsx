import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge, SectionHeader } from '../../components/ui';
import { LoanCalculator } from '../../components/LoanCalculator/LoanCalculator';
import { RequestCallModal } from '../../components/RequestCallModal/RequestCallModal';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestService, setRequestService] = useState<'loan' | 'insurance'>('loan');

  const openRequestCall = (svc: 'loan' | 'insurance' = 'loan') => {
    setRequestService(svc);
    setIsRequestModalOpen(true);
  };

  const loanTypes = [
    {
      id: 'personal',
      title: 'Personal Loan',
      rate: '12.00% p.a.',
      description: 'Flexible funding for medical, travel, home renovation, or emergency personal expenses.',
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
      rate: '14.00% p.a.',
      description: 'Fuel business growth, working capital requirements, and equipment acquisition.',
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
      rate: '9.00% p.a.',
      description: 'Competitive home financing for buying, constructing, or extending your dream residence.',
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
      rate: '10.00% p.a.',
      description: 'Unlock substantial long-term funding by pledging residential or commercial property.',
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
      rate: '12.00% p.a.',
      description: 'Instant liquidity with minimal documentation against gold jewelry and assets.',
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
      rate: 'Custom',
      description: 'Specialized vehicle, education, machinery, or customized credit requirements.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  const insuranceCategories = [
    {
      id: 'health',
      title: 'Health Insurance',
      tag: 'Cashless Hospitalization',
      description: 'Comprehensive medical and hospitalization coverage for you and your family across top hospitals.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      id: 'life',
      title: 'Life & Savings Insurance',
      tag: 'Family Wealth Security',
      description: 'Guaranteed protection and wealth accumulation plans ensuring long-term financial freedom for your loved ones.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: 'term',
      title: 'Term Insurance',
      tag: 'High Cover • Low Premium',
      description: 'Pure risk life cover providing maximum financial safety net for dependents at very affordable premiums.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: 'motor',
      title: 'Motor Insurance',
      tag: 'Instant Digital Quotes',
      description: 'Complete bumper-to-bumper and third-party protection for your two-wheeler or four-wheeler vehicles.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Select Your Requirement',
      description: 'Choose between our wide range of tailored loan options or comprehensive insurance covers.',
    },
    {
      number: '02',
      title: 'Check Estimates & Plans',
      description: 'Calculate your exact loan EMI in real time or review insurance protection options without obligation.',
    },
    {
      number: '03',
      title: 'Get Free Expert Advice',
      description: 'Request a free callback from our certified financial advisors to finalize the best rates and terms.',
    },
  ];

  const benefits = [
    {
      title: '100% Free Consultation',
      description: 'Zero fee and zero hidden charges to calculate estimates and speak with our advisory team.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: 'Multi-Partner Network',
      description: 'We connect you with leading banks, NBFCs, and premier insurance providers in India.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      title: 'Transparent & Unbiased',
      description: 'Standard mathematical calculations and objective recommendations with no forced sales.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: 'No Obligation & No Spam',
      description: 'Exploring options and receiving advice never commits you to any loan or insurance product.',
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
      title: 'Partner Determination',
      text: 'Final loan interest rates, insurance premiums, policy terms, and underwriting approvals are determined exclusively by the respective lending and insurance institutions.',
    },
    {
      title: 'Free Voluntary Assistance',
      text: 'Credzo Finance never solicits advance payments, security deposits, or file charges. Requesting a callback is completely voluntary and free of obligation.',
    },
  ];

  return (
    <div className="landing-page">
      {/* 1. HERO SECTION — DUAL PILLAR (LOANS + INSURANCE) */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <Badge variant="primary" size="md" className="hero-badge">
              <span>Loans &amp; Insurance Advisory • 100% Free • No Obligation</span>
            </Badge>

            <h1 className="hero-headline">
              Find the Right <span className="headline-highlight">Financial Solution.</span>
            </h1>

            <p className="hero-subheadline">
              Check your estimated loan EMI in 60 seconds or explore comprehensive insurance plans for your family and business.
            </p>

            <p className="hero-text">
              Transparent comparisons, multi-partner options, and dedicated advisory support — without pressure or advance fees.
            </p>

            <div className="hero-cta-group">
              <Button to="/calculator" variant="primary" size="lg" className="hero-btn">
                Calculate Loan EMI &rarr;
              </Button>
              <Button to="/insurance" variant="secondary" size="lg" className="hero-btn">
                Explore Insurance
              </Button>
            </div>

            <div className="hero-quick-request-link">
              <span>Want personalized guidance?</span>{' '}
              <button
                type="button"
                className="inline-call-link"
                onClick={() => openRequestCall('loan')}
              >
                Request a free call from our team &rarr;
              </button>
            </div>
          </div>

          {/* Hero Dual-Service Showcase Card */}
          <div className="hero-preview-wrapper">
            <div className="hero-services-card">
              <div className="hero-card-header">
                <span className="card-header-title">Credzo Financial Services</span>
                <span className="card-header-tag">Fast &amp; Free</span>
              </div>

              <div className="hero-services-split">
                {/* Loans Pillar Box */}
                <div className="service-pillar-box pillar-loans">
                  <div className="pillar-top">
                    <div className="pillar-icon-wrap icon-loan">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="pillar-title">Loan Advisory</h3>
                      <span className="pillar-badge">From 9.00% p.a.</span>
                    </div>
                  </div>
                  <ul className="pillar-list">
                    <li>Personal, Business &amp; Home Loans</li>
                    <li>Loan Against Property &amp; Gold Loans</li>
                    <li>Instant real-time EMI breakdown</li>
                  </ul>
                  <div className="pillar-cta-row">
                    <Button to="/calculator" variant="primary" size="sm" fullWidth>
                      Calculate Loan EMI &rarr;
                    </Button>
                  </div>
                </div>

                {/* Insurance Pillar Box */}
                <div className="service-pillar-box pillar-insurance">
                  <div className="pillar-top">
                    <div className="pillar-icon-wrap icon-insurance">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="pillar-title">Insurance Plans</h3>
                      <span className="pillar-badge badge-green">100% Cashless</span>
                    </div>
                  </div>
                  <ul className="pillar-list">
                    <li>Health, Life &amp; Term Insurance</li>
                    <li>Motor &amp; Commercial Risk Covers</li>
                    <li>Custom quotes &amp; advisory support</li>
                  </ul>
                  <div className="pillar-cta-row">
                    <Button to="/insurance" variant="secondary" size="sm" fullWidth>
                      Explore Insurance &rarr;
                    </Button>
                  </div>
                </div>
              </div>

              <div className="hero-card-footer">
                <button
                  type="button"
                  className="card-footer-call-btn"
                  onClick={() => openRequestCall('loan')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-call-icon">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Need help choosing? <strong>Request a Call From Our Team</strong></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOANS SECTION */}
      <section className="section loan-types-section" id="loan-types">
        <div className="container">
          <SectionHeader
            badge="Tailored Financing"
            title="Find the right loan for your needs"
            subtitle="Choose a loan category below to calculate your estimated monthly installments and repayments."
          />

          <div className="loan-types-grid">
            {loanTypes.map((type) => (
              <div key={type.id} className="loan-type-card">
                <div className="loan-type-header-row">
                  <div className="loan-type-icon">{type.icon}</div>
                  <span className="loan-rate-pill">{type.rate}</span>
                </div>
                <h3 className="loan-type-title">{type.title}</h3>
                <p className="loan-type-desc">{type.description}</p>
                <div className="loan-card-actions">
                  <Link to="/calculator" className="loan-calc-btn">
                    Calculate EMI &rarr;
                  </Link>
                  <button
                    type="button"
                    className="loan-call-btn"
                    onClick={() => openRequestCall('loan')}
                  >
                    Request Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LOAN CALCULATOR SECTION */}
      <section className="section home-calculator-section" id="calculator-section">
        <div className="container">
          <SectionHeader
            badge="Instant &amp; Free Tool"
            title="Calculate Your Loan EMI"
            subtitle="Adjust loan amount and tenure to view accurate illustrative monthly installments and interest totals."
            centered
          />
          <LoanCalculator />
        </div>
      </section>

      {/* 4. INSURANCE SECTION */}
      <section className="section insurance-showcase-section" id="insurance-section">
        <div className="container">
          <SectionHeader
            badge="Family &amp; Asset Protection"
            title="Protect what matters most to you"
            subtitle="Explore high-benefit insurance solutions designed to secure your health, life, and valuable assets."
          />

          <div className="insurance-cards-grid">
            {insuranceCategories.map((cat) => (
              <div key={cat.id} className="insurance-card">
                <div className="insurance-card-top">
                  <div className="insurance-icon-box">{cat.icon}</div>
                  <span className="insurance-tag">{cat.tag}</span>
                </div>
                <h3 className="insurance-card-title">{cat.title}</h3>
                <p className="insurance-card-desc">{cat.description}</p>
                <div className="insurance-card-footer">
                  <Link to="/insurance" className="insurance-action-link">
                    Explore Plans &rarr;
                  </Link>
                  <button
                    type="button"
                    className="insurance-callback-action"
                    onClick={() => openRequestCall('insurance')}
                  >
                    Request Callback
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="insurance-banner-cta">
            <div className="banner-cta-content">
              <h3>Looking for a personalized insurance recommendation?</h3>
              <p>Speak with an advisor to compare cashless hospital networks, claim settlement ratios, and premium discounts.</p>
            </div>
            <div className="banner-cta-actions">
              <Button to="/insurance" variant="primary" size="md">
                View All Insurance Plans &rarr;
              </Button>
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => openRequestCall('insurance')}
              >
                Request an Insurance Call
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROMINENT "REQUEST A CALL" SECTION */}
      <section className="section prominent-request-call-section" id="request-call-section">
        <div className="container">
          <div className="prominent-call-card">
            <div className="prominent-call-badge">Direct Advisory Support</div>
            <h2 className="prominent-call-title">
              Want Help Choosing the Right Loan or Insurance?
            </h2>
            <p className="prominent-call-subtitle">
              Our financial specialists provide 100% free guidance to help you understand lender eligibility, interest rates, and insurance policy coverage.
            </p>

            <div className="prominent-call-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Zero advance fees or consulting charges</span>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Unbiased comparisons across top banks &amp; insurers</span>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Voluntary, pressure-free callback</span>
              </div>
            </div>

            <div className="prominent-call-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg prominent-cta-btn"
                id="home-request-call-btn"
                onClick={() => openRequestCall('loan')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-call-icon">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Request a Call From Our Team &rarr;
              </button>
            </div>

            <p className="prominent-call-footer-note">
              Free assistance. No advance payments required. No spam.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="section how-it-works-section" id="how-it-works">
        <div className="container">
          <SectionHeader
            badge="Simple 3-Step Process"
            title="How It Works"
            subtitle="Calculate your loan estimates, explore insurance options, and enquire in three straightforward steps."
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

      {/* 7. VALUE PROPOSITION / BENEFITS */}
      <section className="section benefits-section">
        <div className="container">
          <SectionHeader
            badge="Why Credzo Finance"
            title="Built for clarity, transparency, and confidence"
            subtitle="We believe financial planning and decision making should be transparent, accessible, and pressure-free."
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

      {/* 8. TRUST / IMPORTANT INFORMATION / COMPLIANCE DISCLOSURES */}
      <section className="section trust-section">
        <div className="container">
          <div className="trust-box">
            <div className="trust-header">
              <span className="trust-badge">Transparency First</span>
              <h2 className="trust-title">Important Disclosures &amp; Information</h2>
              <p className="trust-subtitle">
                Please review these core principles regarding our illustrative estimation and facilitation service.
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

      {/* Request Call Modal */}
      <RequestCallModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialService={requestService}
        title={requestService === 'loan' ? 'Request a Loan Callback' : 'Request an Insurance Callback'}
        subtitle="Our team will contact you to provide personalized, zero-fee guidance."
      />
    </div>
  );
};
