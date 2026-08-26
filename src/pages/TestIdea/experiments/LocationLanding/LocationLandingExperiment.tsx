import React, { useState } from 'react';
import './LocationLanding.css';

export interface LocationLandingConfig {
  cityName: string;
  stateName: string;
  tagline: string;
  heroHighlight: string;
  lowestRate: string;
  stampDutyNote: string;
  regulatoryAuthority: string;
  topCorridors: string[];
  propertyPresets: {
    locality: string;
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

const AHMEDABAD_CONFIG: LocationLandingConfig = {
  cityName: 'Ahmedabad',
  stateName: 'Gujarat',
  tagline: 'Lowest Interest Rates on Home Loans in Ahmedabad & GIFT City Corridor',
  heroHighlight: 'From ₹15 Lakhs to ₹10 Crores • Instant In-Principle Eligibility Check',
  lowestRate: '8.40%',
  stampDutyNote: 'Gujarat Stamp Duty: 4.9% for male buyers, 3.9% for female buyers + 1% registration fee.',
  regulatoryAuthority: 'AUDA & AMC (RERA Gujarat)',
  topCorridors: ['SG Highway', 'South Bopal & Shela', 'Gota & Vaishnodevi', 'GIFT City / Gandhinagar', 'Prahlad Nagar & Thaltej'],
  propertyPresets: [
    {
      locality: 'Gota / Chandlodiya',
      propertyType: '2 BHK Affordable Apartment',
      price: 4500000,
      typicalLoan: 3600000,
      estimatedEmi: 31050,
    },
    {
      locality: 'South Bopal / Shela',
      propertyType: '3 BHK High-Rise Residence',
      price: 7500000,
      typicalLoan: 6000000,
      estimatedEmi: 51750,
    },
    {
      locality: 'SG Highway / Bodakdev',
      propertyType: '4 BHK Luxury Apartment / Bungalow',
      price: 15000000,
      typicalLoan: 12000000,
      estimatedEmi: 103500,
    },
  ],
  localConsiderations: [
    {
      title: 'AUDA vs AMC Zoning & Permissions',
      desc: 'Properties in peripheral zones (e.g. Shela, South Bopal, Godhavi) fall under AUDA, whereas core city properties fall under AMC. Ensure the project possesses clear Town Planning (TP) scheme clearance and valid Building Use (BU) permissions.',
    },
    {
      title: 'Gujarat Stamp Duty & Concessions',
      desc: 'Gujarat offers a 1% stamp duty concession for female property purchasers (3.9% vs 4.9% for male applicants), helping couples save up to ₹1,00,000 on a ₹1 Crore property registration.',
    },
    {
      title: 'RERA Gujarat (GujRERA) Compliance',
      desc: 'All under-construction builder projects in Ahmedabad must be registered with GujRERA. Lenders require the PR/GJ registration number before approving builder tie-ups.',
    },
    {
      title: 'Title Clearance & 30-Year Search Certificate',
      desc: 'For independent bungalows or old Ahmedabad societies undergoing redevelopment, nationalized and private banks require a certified 30-year title search certificate from a registered advocate.',
    },
  ],
  faqs: [
    {
      q: 'What is the minimum salary required for a home loan in Ahmedabad?',
      a: 'Most banks in Ahmedabad require a minimum net monthly salary of ₹25,000 for salaried employees. Self-employed business owners should show a minimum annual gross income of ₹3,00,000 via audited ITRs.',
    },
    {
      q: 'Which banks offer the best home loan interest rates in Ahmedabad?',
      a: 'Top lenders in Ahmedabad include SBI, HDFC Bank, ICICI Bank, Bank of Baroda, and Kotak Mahindra Bank, with floating rates currently starting from 8.40% to 8.65% for borrowers with CIBIL score 750+.',
    },
    {
      q: 'Can I get a home loan for a property in GIFT City / Gandhinagar corridor?',
      a: 'Yes, almost all leading private and PSU banks have dedicated branch tie-ups and pre-approved project sanctions for residential complexes along the GIFT City SEZ and SG Highway corridors.',
    },
    {
      q: 'How much funding (LTV) can I get for a property in Gujarat?',
      a: 'Per RBI guidelines, you can obtain up to 90% loan-to-value for loans up to ₹30 Lakhs, up to 80% for loans between ₹30 Lakhs to ₹75 Lakhs, and up to 75% for loans above ₹75 Lakhs.',
    },
  ],
};

export const LocationLandingExperiment: React.FC = () => {
  const [config] = useState<LocationLandingConfig>(AHMEDABAD_CONFIG);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Mock Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [propertyBudget, setPropertyBudget] = useState<string>('60-80L');
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
    if (!userName || !userPhone) return;
    setIsSubmitted(true);
  };

  return (
    <div className="loc-landing-container">
      {/* City Switcher Simulation Bar */}
      <div className="loc-city-switcher-bar">
        <span>📍 <strong>Location Architecture Experiment:</strong> Reusable City Template</span>
        <div className="loc-city-pills">
          <button type="button" className="loc-city-pill active">
            Ahmedabad
          </button>
          <button type="button" className="loc-city-pill" title="Future expansion target">
            Surat (Future)
          </button>
          <button type="button" className="loc-city-pill" title="Future expansion target">
            Vadodara (Future)
          </button>
          <button type="button" className="loc-city-pill" title="Future expansion target">
            Mumbai (Future)
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="loc-hero">
        <div className="loc-hero-badge">
          <span>🏠</span> Home Loans in {config.cityName}
        </div>
        <h1 className="loc-hero-title">{config.tagline}</h1>
        <p className="loc-hero-desc">
          Compare 15+ top lending banks &amp; NBFCs across Ahmedabad. Enjoy transparent processing, minimal documentation, and doorstep assistance across all major residential growth corridors.
        </p>

        <button
          type="button"
          className="loc-cta-btn"
          onClick={() => {
            setIsModalOpen(true);
            setIsSubmitted(false);
          }}
        >
          Check My Eligibility &rarr;
        </button>

        <div className="loc-hero-stats-row">
          <div className="loc-stat-item">
            <span className="loc-stat-num">From {config.lowestRate}</span>
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

      {/* Local Ahmedabad Buyer Considerations */}
      <section className="loc-section">
        <h2 className="loc-section-title">
          <span>🏙️</span> Important Considerations for {config.cityName} Property Buyers
        </h2>
        <p className="loc-section-desc">
          Essential legal and municipal guidelines for purchasing real estate across Ahmedabad and surrounding urban development zones.
        </p>

        <div className="loc-local-box">
          <h4>💡 Gujarat Stamp Duty Insight:</h4>
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
          <span>📊</span> Example Property Budgets &amp; Monthly EMIs in {config.cityName}
        </h2>
        <p className="loc-section-desc">
          Illustrative calculations for popular property configurations based on a 20-year tenure at 8.45% p.a.
        </p>

        <div className="loc-property-presets">
          {config.propertyPresets.map((preset, idx) => (
            <div
              key={preset.locality}
              className={`loc-property-card ${selectedPropertyIndex === idx ? 'active' : ''}`}
              onClick={() => setSelectedPropertyIndex(idx)}
            >
              <div className="loc-property-locality">{preset.locality}</div>
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
          <span>📋</span> Eligibility Criteria &amp; Documentation
        </h2>
        <p className="loc-section-desc">
          Simple, streamlined checklist for salaried professionals and self-employed Gujarat entrepreneurs.
        </p>

        <div className="loc-cards-grid">
          <div className="loc-feature-card">
            <div className="loc-feature-card-icon">👤</div>
            <h3 className="loc-feature-card-title">Salaried Borrowers</h3>
            <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Age: 21 to 65 years</li>
              <li>Min Income: ₹25,000/month</li>
              <li>Last 3 Months Salary Slips</li>
              <li>6 Months Bank Statement</li>
              <li>Form 16 / Last 2 Years ITR</li>
            </ul>
          </div>

          <div className="loc-feature-card">
            <div className="loc-feature-card-icon">🏢</div>
            <h3 className="loc-feature-card-title">Self-Employed / Traders</h3>
            <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Age: 23 to 68 years</li>
              <li>Business Continuity: 3+ Years</li>
              <li>Last 3 Years Audited ITR + Balance Sheet</li>
              <li>12 Months Current Account Statement</li>
              <li>GST Registration Certificate</li>
            </ul>
          </div>

          <div className="loc-feature-card">
            <div className="loc-feature-card-icon">📄</div>
            <h3 className="loc-feature-card-title">Property Documents</h3>
            <ul style={{ fontSize: '0.8125rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Allotment Letter / Agreement to Sell</li>
              <li>Sanctioned Building Plan (AMC/AUDA)</li>
              <li>RERA Gujarat Project ID</li>
              <li>NOC from Builder / Society</li>
              <li>30-Year Title Search Report</li>
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
              <div className="loc-step-title">Online Application &amp; Multi-Bank Check</div>
              <div className="loc-step-desc">Submit your income details to compare offers across 15+ participating bank partners.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">2</div>
            <div>
              <div className="loc-step-title">Doorstep Document Pickup &amp; KYC</div>
              <div className="loc-step-desc">Our dedicated loan advisor assists with document collection and initial KYC processing.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">3</div>
            <div>
              <div className="loc-step-title">Technical &amp; Legal Verification</div>
              <div className="loc-step-desc">Bank legal team inspects property title, AUDA/AMC approvals, and structural valuation.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">4</div>
            <div>
              <div className="loc-step-title">Formal Loan Sanction Letter</div>
              <div className="loc-step-desc">Receive official sanction letter with approved loan amount, interest rate, and tenure.</div>
            </div>
          </div>

          <div className="loc-step-item">
            <div className="loc-step-num">5</div>
            <div>
              <div className="loc-step-title">Agreement Signing &amp; Disbursal</div>
              <div className="loc-step-desc">Sign loan agreement, execute sub-registrar registration, and receive direct disbursement.</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="loc-section">
        <h2 className="loc-section-title">
          <span>❓</span> Frequently Asked Questions — {config.cityName}
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
        <h3>Ready to buy your dream home in {config.cityName}?</h3>
        <p>
          Speak with our local Ahmedabad home loan specialists today. 100% free consultation with no obligation.
        </p>
        <button
          type="button"
          className="loc-cta-btn"
          onClick={() => {
            setIsModalOpen(true);
            setIsSubmitted(false);
          }}
        >
          Check My Eligibility &rarr;
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
                  Mock Ahmedabad Lead Recorded!
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                  In production, our Ahmedabad branch advisor would contact <strong>{userName}</strong> ({userPhone}) for property budget <strong>{propertyBudget}</strong>.
                </p>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#475569', marginBottom: '16px' }}>
                  🔒 <em>No Supabase lead created. Local mock state only.</em>
                </div>
                <button
                  type="button"
                  className="lowest-emi-calc-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close Demo
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                  Check Home Loan Eligibility in Ahmedabad
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
                  Get custom quotes from top participating bank branches in Ahmedabad.
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
                      placeholder="e.g. Jignesh Shah"
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
                      <option value="80L-1.5Cr">₹80 Lakhs – ₹1.50 Crore (Premium / SG Highway)</option>
                      <option value="1.5Cr+">₹1.50 Crore+ (Luxury Villa / Penthouse)</option>
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
