import React, { useState } from 'react';

interface LocationSectionProps {
  onCheckCityOptions: () => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  onCheckCityOptions,
}) => {
  const [activeTab, setActiveTab] = useState<'eligibility' | 'documents' | 'process' | 'local'>('eligibility');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const cityFaqs = [
    {
      q: 'What are the typical Stamp Duty & Registration charges for property purchase?',
      a: 'Stamp duty and registration fees generally range between 5%–7% of property market value, depending on the state and municipal jurisdiction. Many states offer concessions on basic stamp duty for women primary buyers.',
    },
    {
      q: 'Are properties with local municipal approvals eligible for bank home loans?',
      a: 'Yes, residential properties with clear municipal development authority plan sanctions, town planning scheme approvals, and valid RERA project registration are readily financed by major partner lenders.',
    },
    {
      q: 'How fast can a home loan get sanctioned?',
      a: 'With complete property title documents and verified financial records, in-principle sanction typically takes 3–5 working days, followed by technical and legal property valuation.',
    },
  ];

  return (
    <section className="cz-section cz-location-section" id="location-guide">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Local Property Expertise</span>
          <h2 className="cz-section-title">Looking for a Home Loan in Your City?</h2>
          <p className="cz-section-subtitle">
            Local insights, property guidelines, and step-by-step assistance in your area.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="cz-location-tabs">
          <button
            type="button"
            className={`cz-loc-tab-btn ${activeTab === 'eligibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('eligibility')}
          >
            📋 Eligibility
          </button>
          <button
            type="button"
            className={`cz-loc-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📄 Documents
          </button>
          <button
            type="button"
            className={`cz-loc-tab-btn ${activeTab === 'process' ? 'active' : ''}`}
            onClick={() => setActiveTab('process')}
          >
            🔄 4-Step Process
          </button>
          <button
            type="button"
            className={`cz-loc-tab-btn ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
          >
            🏛️ Property Guidelines
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="cz-location-tab-content">
          {activeTab === 'eligibility' && (
            <div className="cz-tab-pane">
              <h3 className="cz-pane-title">Eligibility Criteria for Home Loan Borrowers</h3>
              <div className="cz-loc-grid-2">
                <div className="cz-loc-card">
                  <div className="cz-loc-card-badge">Salaried Professionals</div>
                  <ul className="cz-loc-list">
                    <li><strong>Age:</strong> 21 to 60 years at loan maturity</li>
                    <li><strong>Monthly Income:</strong> Minimum ₹25,000/month in-hand</li>
                    <li><strong>Work Experience:</strong> Minimum 1 year total, 6 months in current organization</li>
                    <li><strong>CIBIL Score:</strong> 700+ preferred for competitive interest rates</li>
                  </ul>
                </div>
                <div className="cz-loc-card">
                  <div className="cz-loc-card-badge">Self-Employed / Business</div>
                  <ul className="cz-loc-list">
                    <li><strong>Age:</strong> 23 to 65 years at loan maturity</li>
                    <li><strong>Business Continuity:</strong> Minimum 2–3 years filed ITR</li>
                    <li><strong>Financial Track:</strong> Consistent profitability & healthy banking transactions</li>
                    <li><strong>CIBIL Score:</strong> 700+ with clean repayment history</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="cz-tab-pane">
              <h3 className="cz-pane-title">Checklist of Required Documents</h3>
              <div className="cz-loc-grid-3">
                <div className="cz-loc-card">
                  <h4>1. KYC & Identity</h4>
                  <ul className="cz-loc-list">
                    <li>PAN Card (Mandatory)</li>
                    <li>Aadhaar Card / Passport / Voter ID</li>
                    <li>Passport-size photographs</li>
                  </ul>
                </div>
                <div className="cz-loc-card">
                  <h4>2. Income Proofs</h4>
                  <ul className="cz-loc-list">
                    <li>Last 3 months salary slips (Salaried)</li>
                    <li>6 months primary bank account statements</li>
                    <li>Last 2 years ITR with computation</li>
                  </ul>
                </div>
                <div className="cz-loc-card">
                  <h4>3. Property Documents</h4>
                  <ul className="cz-loc-list">
                    <li>Allotment letter / Sale agreement</li>
                    <li>Approved layout plan from local authority</li>
                    <li>RERA registration certificate / Title deed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'process' && (
            <div className="cz-tab-pane">
              <h3 className="cz-pane-title">Simple 4-Step Home Loan Process</h3>
              <div className="cz-process-steps-row">
                <div className="cz-process-box">
                  <span className="cz-step-num">1</span>
                  <h4>Eligibility Check</h4>
                  <p>Share basic details and get an instant eligibility estimate.</p>
                </div>
                <div className="cz-process-box">
                  <span className="cz-step-num">2</span>
                  <h4>Document Pickup</h4>
                  <p>Digital upload or doorstep document collection in your area.</p>
                </div>
                <div className="cz-process-box">
                  <span className="cz-step-num">3</span>
                  <h4>Sanction & Appraisal</h4>
                  <p>In-principle approval followed by legal & technical property valuation.</p>
                </div>
                <div className="cz-process-box">
                  <span className="cz-step-num">4</span>
                  <h4>Disbursal</h4>
                  <p>Loan agreement execution and funds disbursed to builder/seller.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="cz-tab-pane">
              <h3 className="cz-pane-title">Property Guidelines & Clearances</h3>
              <div className="cz-loc-grid-2">
                <div className="cz-loc-card">
                  <h4>Municipal & Development Authority Approvals</h4>
                  <p>
                    Ensure your chosen residential property has verified local development authority plan sanction, Town Planning clearance, and Commenced Certificate (CC) or Building Use (BU) permission.
                  </p>
                </div>
                <div className="cz-loc-card">
                  <h4>RERA Project Registration</h4>
                  <p>
                    All ongoing builder projects must hold a valid state RERA registration number. Lenders verify project registration before releasing construction-linked disbursals.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local FAQs */}
        <div className="cz-location-faq">
          <h3 className="cz-loc-faq-title">Frequently Asked Questions</h3>
          <div className="cz-faq-list">
            {cityFaqs.map((faq, idx) => (
              <div
                key={idx}
                className={`cz-faq-card ${openFaqIndex === idx ? 'expanded' : ''}`}
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              >
                <div className="cz-faq-question">
                  <span>{faq.q}</span>
                  <span className="cz-faq-icon">{openFaqIndex === idx ? '−' : '+'}</span>
                </div>
                {openFaqIndex === idx && (
                  <div className="cz-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* City CTA */}
        <div className="cz-location-cta-box">
          <div className="cz-loc-cta-text">
            <h3>Ready to finance your property?</h3>
            <p>Speak with our loan specialists for tailored home loan guidance.</p>
          </div>
          <button
            type="button"
            className="cz-btn cz-btn-primary cz-btn-large"
            onClick={onCheckCityOptions}
          >
            Check Home Loan Options &rarr;
          </button>
        </div>
      </div>
    </section>
  );
};
