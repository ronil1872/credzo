import React, { useState } from 'react';
import './LocationLanding.css';

export interface LocationLandingConfig {
  tagline: string;
  heroHighlight: string;
  lowestRate: string;
  stampDutyNote: string;
  regulatoryAuthority: string;
  propertyPresets: {
    propertyType: string;
    price: number;
    typicalLoan: number;
    estimatedEmi: number;
  }[];
  localConsiderations: {
    title: string;
    desc: string;
  }[];
  faqs: {
    q: string;
    a: string;
  }[];
}

const GENERIC_LOCATION_CONFIG: LocationLandingConfig = {
  tagline: 'Looking for a Home Loan in Your City?',
  heroHighlight: 'From ₹15 Lakhs to ₹10 Crores • Instant In-Principle Eligibility Check',
  lowestRate: '8.40%',
  stampDutyNote: 'Standard stamp duty and registration fees generally range between 5%–7% depending on the state and municipal jurisdiction. Many states offer concessions on basic stamp duty for women primary buyers.',
  regulatoryAuthority: 'RERA & Local Authority',
  propertyPresets: [
    {
      propertyType: '2 BHK Compact Apartment',
      price: 4500000,
      typicalLoan: 3600000,
      estimatedEmi: 31050,
    },
    {
      propertyType: '3 BHK Premium Residence',
      price: 7500000,
      typicalLoan: 6000000,
      estimatedEmi: 51750,
    },
    {
      propertyType: '4 BHK Luxury Home / Villa',
      price: 15000000,
      typicalLoan: 12000000,
      estimatedEmi: 103500,
    },
  ],
  localConsiderations: [
    {
      title: 'Municipal & Development Authority Approvals',
      desc: 'Ensure your chosen residential project possesses verified Town Planning scheme clearance, Commencement Certificate (CC), and Building Use (BU) permissions from the local municipal corporation or development authority.',
    },
    {
      title: 'State RERA Registration Compliance',
      desc: 'All ongoing builder projects must be registered with their respective State RERA authority. Lenders verify the project RERA registration number before releasing construction-linked loan disbursements.',
    },
    {
      title: 'Title Clearance & 30-Year Search Report',
      desc: 'For independent houses, plots, or societies undergoing redevelopment, lenders require a certified 30-year title search certificate from an empanelled legal advocate to confirm unencumbered ownership.',
    },
    {
      title: 'Encumbrance Certificate & Property Tax Receipts',
      desc: 'Confirm the seller holds a Nil Encumbrance Certificate (EC) and up-to-date municipal property tax paid receipts to guarantee no pending legal dues or prior undisclosed mortgages on the property.',
    },
  ],
  faqs: [
    {
      q: 'What is the minimum salary required for a home loan?',
      a: 'Most partner lenders require a minimum net monthly in-hand salary of ₹25,000 for salaried applicants. Self-employed business owners should show a minimum annual net profit of ₹3,00,000 via audited ITRs.',
    },
    {
      q: 'How much funding (LTV) can I get for a property purchase?',
      a: 'Per RBI guidelines, borrowers can obtain up to 90% loan-to-value for loans up to ₹30 Lakhs, up to 80% for loans between ₹30 Lakhs to ₹75 Lakhs, and up to 75% for loans above ₹75 Lakhs.',
    },
    {
      q: 'Are under-construction properties eligible for bank home loans?',
      a: 'Yes, under-construction residential properties with verified state RERA registrations and lender-approved project sanctions are eligible for construction-linked disbursement home loans.',
    },
    {
      q: 'How fast does home loan sanction and disbursal take?',
      a: 'With complete KYC, income records, and clear property title documents, in-principle sanction typically takes 3 to 5 business days, followed by technical valuation and final disbursal.',
    },
  ],
};

export const LocationLandingExperiment: React.FC = () => {
  const [config] = useState<LocationLandingConfig>(GENERIC_LOCATION_CONFIG);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Mock Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userCity, setUserCity] = useState<string>(''); // Completely blank initial value
  const [propertyBudget, setPropertyBudget] = useState<string>('50-80L');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleResetModal = () => {
    setUserName('');
    setUserPhone('');
    setUserCity('');
    setPropertyBudget('50-80L');
    setIsSubmitted(false);
    setIsModalOpen(false);
  };

  return (
    <div className="loc-landing-container">
      {/* Hero Section */}
      <section className="loc-hero">
        <div className="loc-hero-badge">
          <span>🏠</span> Location Guide
        </div>
        <h1 className="loc-hero-title">{config.tagline}</h1>
        <p className="loc-hero-desc">
          Local insights, property guidelines, and step-by-step assistance in your area. Understand your estimated eligibility and available financing options.
        </p>

        <button
          type="button"
          className="loc-cta-btn"
          onClick={() => {
            setIsModalOpen(true);
            setIsSubmitted(false);
          }}
        >
          Check Home Loan Options &rarr;
        </button>

        <div className="loc-hero-stats-row">
          <div className="loc-stat-item">
            <span className="loc-stat-num">From {config.lowestRate}*</span>
            <span className="loc-stat-desc">Starting Interest Rate</span>
          </div>
          <div className="loc-stat-item">
            <span className="loc-stat-num">Up to 30 Yrs</span>
            <span className="loc-stat-desc">Repayment Tenure</span>
          </div>
          <div className="loc-stat-item">
            <span className="loc-stat-num">Up to 90%</span>
            <span className="loc-stat-desc">Property Value LTV</span>
          </div>
          <div className="loc-stat-item">
            <span className="loc-stat-num">{config.regulatoryAuthority}</span>
            <span className="loc-stat-desc">Approved Projects</span>
          </div>
        </div>
      </section>

      {/* Property Buyer Considerations */}
      <section className="loc-section">
        <h2 className="loc-section-title">
          <span>🏙️</span> Important Considerations for Property Buyers
        </h2>
        <p className="loc-section-desc">
          Essential legal and municipal guidelines for purchasing residential real estate.
        </p>

        <div className="loc-local-box">
          <h4>💡 Stamp Duty &amp; Registration Insight:</h4>
          <p>{config.stampDutyNote}</p>
        </div>

        <div className="loc-cards-grid">
          {config.localConsiderations.map((item) => (
            <div key={item.title} className="loc-feature-card">
              <div className="loc-feature-card-icon">🏛️</div>
              <h3 className="loc-feature-card-title">{item.title}</h3>
              <p className="loc-feature-card-text">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Property EMI Example Matrix */}
      <section className="loc-section">
        <h2 className="loc-section-title">
          <span>📊</span> Example Property Budgets &amp; Monthly EMIs
        </h2>
        <p className="loc-section-desc">
          Illustrative calculations for popular property configurations based on a 20-year tenure at 8.45% p.a.
        </p>

        <div className="loc-property-presets">
          {config.propertyPresets.map((preset, idx) => (
            <div
              key={preset.propertyType}
              className={`loc-property-card ${selectedPropertyIndex === idx ? 'active' : ''}`}
              onClick={() => setSelectedPropertyIndex(idx)}
            >
              <div className="loc-property-locality">Popular Tier</div>
              <div className="loc-property-name">{preset.propertyType}</div>
              <div className="loc-property-price">{formatCurrency(preset.price)}</div>
              <div className="loc-property-emi">
                Est. EMI: {formatCurrency(preset.estimatedEmi)}/mo
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                Assuming 80% loan ({formatCurrency(preset.typicalLoan)})
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eligibility & Required Documents */}
      <section className="loc-section">
        <h2 className="loc-section-title">
          <span>📋</span> Eligibility Criteria for Home Loan Borrowers
        </h2>
        <p className="loc-section-desc">
          Simple, streamlined checklist for salaried professionals and self-employed applicants.
        </p>

        <div className="loc-cards-grid">
          <div className="loc-feature-card">
            <div className="loc-feature-card-icon">👤</div>
            <h3 className="loc-feature-card-title">Salaried Borrowers</h3>
            <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Age: 21 to 65 years</li>
              <li>Min Income: ₹25,000/month in-hand</li>
              <li>Last 3 Months Salary Slips</li>
              <li>6 Months Bank Statement</li>
              <li>Form 16 / Last 2 Years ITR</li>
            </ul>
          </div>

          <div className="loc-feature-card">
            <div className="loc-feature-card-icon">🏢</div>
            <h3 className="loc-feature-card-title">Self-Employed / Business</h3>
            <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Age: 23 to 68 years</li>
              <li>Business Continuity: 2–3 Years</li>
              <li>Last 2–3 Years Audited ITR + Computation</li>
              <li>12 Months Primary Bank Statement</li>
              <li>GST / Business Registration Proof</li>
            </ul>
          </div>

          <div className="loc-feature-card">
            <div className="loc-feature-card-icon">📄</div>
            <h3 className="loc-feature-card-title">Property Documents</h3>
            <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Allotment Letter / Agreement to Sell</li>
              <li>Sanctioned Building Plan from Authority</li>
              <li>RERA Project Registration Certificate</li>
              <li>NOC from Builder / Society</li>
              <li>30-Year Title Search Report / Deed</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5-Step Process */}
      <section className="loc-section">
        <h2 className="loc-section-title">
          <span>⚡</span> How the Home Loan Process Works
        </h2>
        <p className="loc-section-desc">
          From application to disbursement — smooth and transparent end-to-end guidance.
        </p>

        <div className="loc-process-steps">
          <div className="loc-step-item">
            <div className="loc-step-num">1</div>
            <div>
              <div className="loc-step-title">Online Application &amp; Eligibility Check</div>
              <div className="loc-step-desc">Submit your basic details to understand your borrowing capacity and suitable options.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">2</div>
            <div>
              <div className="loc-step-title">Document Pickup &amp; KYC Verification</div>
              <div className="loc-step-desc">Our dedicated advisory specialist assists with digital or doorstep document collection.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">3</div>
            <div>
              <div className="loc-step-title">Technical &amp; Legal Property Valuation</div>
              <div className="loc-step-desc">The lender conducts property appraisal, municipal plan check, and legal title clearance.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">4</div>
            <div>
              <div className="loc-step-title">Formal Loan Sanction Letter</div>
              <div className="loc-step-desc">Receive your formal sanction letter detailing approved loan amount, rate, and tenure.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">5</div>
            <div>
              <div className="loc-step-title">Agreement Signing &amp; Disbursal</div>
              <div className="loc-step-desc">Complete loan agreement execution and funds are disbursed to builder or seller.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="loc-section">
        <h2 className="loc-section-title">
          <span>❓</span> Frequently Asked Questions
        </h2>

        <div style={{ marginTop: '16px' }}>
          {config.faqs.map((faq, idx) => (
            <div key={faq.q} className="loc-faq-item">
              <button
                type="button"
                className="loc-faq-question"
                onClick={() => toggleFaq(idx)}
              >
                <span>{faq.q}</span>
                <span>{openFaqIndex === idx ? '−' : '+'}</span>
              </button>
              {openFaqIndex === idx && (
                <div className="loc-faq-answer">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div className="loc-bottom-cta">
        <h3>Ready to finance your property?</h3>
        <p>
          Speak with our home loan specialists today. 100% free consultation with no obligation.
        </p>
        <button
          type="button"
          className="loc-cta-btn"
          onClick={() => {
            setIsModalOpen(true);
            setIsSubmitted(false);
          }}
        >
          Check Home Loan Options &rarr;
        </button>
      </div>

      {/* Mock Eligibility Modal */}
      {isModalOpen && (
        <div className="lowest-emi-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="lowest-emi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lowest-emi-modal-header">
              <span className="lowest-emi-mock-badge">Mock Prototyping Mode</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {isSubmitted ? (
              <div className="lowest-emi-success-view">
                <div className="lowest-emi-success-icon">🏡</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                  Mock Eligibility Request Received!
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                  In production, our advisor would contact <strong>{userName}</strong> ({userPhone}) for property in <strong>{userCity || 'Your City'}</strong> with budget <strong>{propertyBudget}</strong>.
                </p>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#475569', marginBottom: '16px' }}>
                  🔒 <em>No Supabase lead created. Local mock state only.</em>
                </div>
                <button
                  type="button"
                  className="lowest-emi-calc-btn"
                  onClick={handleResetModal}
                >
                  Close Demo
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                  Check Home Loan Eligibility
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
                  Get custom options from participating lenders in your city.
                </p>

                <form onSubmit={handleMockSubmit}>
                  <div className="lowest-emi-form-group">
                    <label htmlFor="locUserName" className="lowest-emi-label">
                      Your Full Name
                    </label>
                    <input
                      id="locUserName"
                      type="text"
                      className="lowest-emi-input"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your Name"
                      required
                    />
                  </div>

                  <div className="lowest-emi-form-group">
                    <label htmlFor="locUserPhone" className="lowest-emi-label">
                      10-Digit Mobile Number
                    </label>
                    <input
                      id="locUserPhone"
                      type="tel"
                      className="lowest-emi-input"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="lowest-emi-form-group">
                    <label htmlFor="locUserCity" className="lowest-emi-label">
                      City
                    </label>
                    <input
                      id="locUserCity"
                      type="text"
                      className="lowest-emi-input"
                      value={userCity}
                      onChange={(e) => setUserCity(e.target.value)}
                      placeholder="Your City"
                    />
                  </div>

                  <div className="lowest-emi-form-group">
                    <label htmlFor="locBudget" className="lowest-emi-label">
                      Estimated Property Budget
                    </label>
                    <select
                      id="locBudget"
                      className="lowest-emi-input"
                      value={propertyBudget}
                      onChange={(e) => setPropertyBudget(e.target.value)}
                    >
                      <option value="30-50L">₹30 Lakhs – ₹50 Lakhs (Affordable 2BHK)</option>
                      <option value="50-80L">₹50 Lakhs – ₹80 Lakhs (3BHK / Mid-segment)</option>
                      <option value="80L-1.5Cr">₹80 Lakhs – ₹1.50 Crore (Premium)</option>
                      <option value="1.5Cr+">₹1.50 Crore+ (Luxury Home / Villa)</option>
                    </select>
                  </div>

                  <button type="submit" className="loc-cta-btn" style={{ width: '100%', justifyContent: 'center', background: '#2563eb', color: '#fff', marginTop: '8px' }}>
                    Check My Eligibility (Mock) &rarr;
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
