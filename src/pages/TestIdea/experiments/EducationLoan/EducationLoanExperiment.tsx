import React, { useState } from 'react';
import './EducationLoan.css';

export interface EducationLoanPresetConfig {
  presetId?: string;
  defaultCountry?: string;
  defaultCourse?: string;
  defaultUniversity?: string;
  defaultTuition?: number;
  defaultLiving?: number;
  defaultFunding?: number;
  hasCollateral?: boolean;
}

interface EducationLoanExperimentProps {
  initialConfig?: EducationLoanPresetConfig;
}

const COUNTRIES = [
  { id: 'usa', name: 'United States (USA)', defaultLiving: 1500000 },
  { id: 'uk', name: 'United Kingdom (UK)', defaultLiving: 1200000 },
  { id: 'canada', name: 'Canada', defaultLiving: 1100000 },
  { id: 'australia', name: 'Australia', defaultLiving: 1300000 },
  { id: 'germany', name: 'Germany', defaultLiving: 900000 },
  { id: 'ireland', name: 'Ireland', defaultLiving: 1000000 },
  { id: 'india', name: 'India (Premier Institutes)', defaultLiving: 400000 },
];

const COURSES = [
  'MS / STEM Masters',
  'MBA / Management',
  'Undergraduate / Bachelors',
  'Data Science & AI',
  'Healthcare & Medicine',
  'Law & Public Policy',
  'Other Masters',
];

export const EducationLoanExperiment: React.FC<EducationLoanExperimentProps> = ({
  initialConfig,
}) => {
  const [country, setCountry] = useState<string>(initialConfig?.defaultCountry || 'United States (USA)');
  const [course, setCourse] = useState<string>(initialConfig?.defaultCourse || 'MS / STEM Masters');
  const [university, setUniversity] = useState<string>(initialConfig?.defaultUniversity || 'Northeastern University');
  const [tuitionFees, setTuitionFees] = useState<number>(initialConfig?.defaultTuition || 3200000);
  const [livingExpenses, setLivingExpenses] = useState<number>(initialConfig?.defaultLiving || 1200000);
  const [existingFunding, setExistingFunding] = useState<number>(initialConfig?.defaultFunding || 600000);

  // Mock Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Calculation: Tuition + Living - Existing Funding = Required Loan
  const totalGrossCost = tuitionFees + livingExpenses;
  const estimatedRequirement = Math.max(0, totalGrossCost - existingFunding);

  // Progress Bar Percentages
  const tuitionPercent = totalGrossCost > 0 ? Math.round((tuitionFees / totalGrossCost) * 100) : 0;
  const livingPercent = totalGrossCost > 0 ? Math.round((livingExpenses / totalGrossCost) * 100) : 0;

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCountryChange = (selectedCountryName: string) => {
    setCountry(selectedCountryName);
    const matched = COUNTRIES.find((c) => c.name === selectedCountryName);
    if (matched) {
      setLivingExpenses(matched.defaultLiving);
    }
  };

  const handleSeoSimulationPill = (preset: { country: string; course: string; tuition: number; living: number }) => {
    setCountry(preset.country);
    setCourse(preset.course);
    setTuitionFees(preset.tuition);
    setLivingExpenses(preset.living);
  };

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentPhone) return;
    setIsSubmitted(true);
  };

  return (
    <div className="edu-loan-container">
      {/* Header */}
      <div className="edu-loan-header">
        <div className="edu-loan-badge">
          <span>🎓</span> Study Abroad &amp; Domestic Higher Education
        </div>
        <h1 className="edu-loan-title">How much education loan do you need?</h1>
        <p className="edu-loan-subtitle">
          Calculate your net funding requirement across tuition fees, living costs, and scholarships.
        </p>

        {/* Preset Simulators for future SEO landing routes */}
        <div className="edu-loan-seo-pills">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', alignSelf: 'center' }}>
            SEO Route Templates:
          </span>
          <button
            type="button"
            className={`edu-loan-seo-pill ${country.includes('UK') ? 'active' : ''}`}
            onClick={() => handleSeoSimulationPill({ country: 'United Kingdom (UK)', course: 'MS / STEM Masters', tuition: 2400000, living: 1200000 })}
          >
            /education-loan/uk
          </button>
          <button
            type="button"
            className={`edu-loan-seo-pill ${country.includes('Canada') ? 'active' : ''}`}
            onClick={() => handleSeoSimulationPill({ country: 'Canada', course: 'MS / STEM Masters', tuition: 2200000, living: 1100000 })}
          >
            /education-loan/canada
          </button>
          <button
            type="button"
            className={`edu-loan-seo-pill ${course.includes('MBA') ? 'active' : ''}`}
            onClick={() => handleSeoSimulationPill({ country: 'United States (USA)', course: 'MBA / Management', tuition: 5500000, living: 1800000 })}
          >
            /education-loan/mba
          </button>
          <button
            type="button"
            className="edu-loan-seo-pill"
            onClick={() => handleSeoSimulationPill({ country: 'Germany', course: 'MS / STEM Masters', tuition: 200000, living: 950000 })}
          >
            /education-loan/germany
          </button>
        </div>
      </div>

      <div className="edu-loan-grid">
        {/* Input Card */}
        <div className="edu-loan-card">
          <h2 className="edu-loan-card-title">
            <span>📚</span> Course &amp; University Details
          </h2>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="edu-loan-form-row two-col">
              <div className="edu-loan-form-group">
                <label htmlFor="targetCountry" className="edu-loan-label">
                  Study Destination
                </label>
                <select
                  id="targetCountry"
                  className="edu-loan-select"
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edu-loan-form-group">
                <label htmlFor="targetCourse" className="edu-loan-label">
                  Course Stream
                </label>
                <select
                  id="targetCourse"
                  className="edu-loan-select"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="edu-loan-form-group">
              <label htmlFor="university" className="edu-loan-label">
                Target University / College
              </label>
              <input
                id="university"
                type="text"
                className="edu-loan-input"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. University of Manchester"
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Financial Cost Estimates (Total Course)
            </h3>

            <div className="edu-loan-form-group">
              <label htmlFor="tuitionFees" className="edu-loan-label">
                Estimated Tuition Fees (Total)
              </label>
              <div className="edu-loan-input-wrap">
                <span className="edu-loan-input-prefix">₹</span>
                <input
                  id="tuitionFees"
                  type="number"
                  className="edu-loan-input has-prefix"
                  value={tuitionFees || ''}
                  onChange={(e) => setTuitionFees(Number(e.target.value))}
                  placeholder="3000000"
                  step="50000"
                  min="0"
                />
              </div>
            </div>

            <div className="edu-loan-form-group">
              <label htmlFor="livingExpenses" className="edu-loan-label">
                Living Expenses, Travel &amp; Accommodation
              </label>
              <div className="edu-loan-input-wrap">
                <span className="edu-loan-input-prefix">₹</span>
                <input
                  id="livingExpenses"
                  type="number"
                  className="edu-loan-input has-prefix"
                  value={livingExpenses || ''}
                  onChange={(e) => setLivingExpenses(Number(e.target.value))}
                  placeholder="1200000"
                  step="25000"
                  min="0"
                />
              </div>
            </div>

            <div className="edu-loan-form-group">
              <label htmlFor="existingFunding" className="edu-loan-label">
                Existing Funding / Scholarship / Self-Savings (Deducted)
              </label>
              <div className="edu-loan-input-wrap">
                <span className="edu-loan-input-prefix">₹</span>
                <input
                  id="existingFunding"
                  type="number"
                  className="edu-loan-input has-prefix"
                  value={existingFunding || ''}
                  onChange={(e) => setExistingFunding(Number(e.target.value))}
                  placeholder="500000"
                  step="25000"
                  min="0"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Results Card */}
        <div className="edu-loan-result-card">
          <div>
            <div className="edu-loan-requirement-box">
              <div className="edu-loan-requirement-label">
                Estimated Net Loan Requirement
              </div>
              <div className="edu-loan-requirement-amount">
                {formatCurrency(estimatedRequirement)}
              </div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '4px' }}>
                For {course} in {country}
              </div>
            </div>

            {/* Clear Step-by-Step Calculation Breakdown */}
            <div className="edu-loan-breakdown-list">
              <div className="edu-loan-breakdown-item">
                <span className="edu-loan-item-tag">
                  <span>🎓</span> Tuition Fees
                </span>
                <span className="edu-loan-item-val">{formatCurrency(tuitionFees)}</span>
              </div>

              <div className="edu-loan-breakdown-item">
                <span className="edu-loan-item-tag">
                  <span>🏠</span> Living &amp; Insurance
                </span>
                <span className="edu-loan-item-val">{formatCurrency(livingExpenses)}</span>
              </div>

              <div className="edu-loan-breakdown-item">
                <span className="edu-loan-item-tag deduct">
                  <span>🎁</span> Less: Scholarships / Self-Fund
                </span>
                <span className="edu-loan-item-val deduct">- {formatCurrency(existingFunding)}</span>
              </div>

              <div className="edu-loan-breakdown-item">
                <span>Estimated Net Loan Required</span>
                <span style={{ color: '#2563eb' }}>{formatCurrency(estimatedRequirement)}</span>
              </div>
            </div>

            {/* Visual Progress Proportion */}
            <div className="edu-loan-bar-wrap">
              <div className="edu-loan-bar-label">
                <span>Tuition ({tuitionPercent}%)</span>
                <span>Living ({livingPercent}%)</span>
              </div>
              <div className="edu-loan-progress-bar">
                <div className="edu-loan-progress-segment tuition" style={{ width: `${tuitionPercent}%` }} />
                <div className="edu-loan-progress-segment living" style={{ width: `${livingPercent}%` }} />
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', lineHeight: 1.45 }}>
              💡 <strong>Moratorium &amp; Repayment:</strong> Most banks &amp; NBFCs offer a moratorium period covering the complete course duration + 6 to 12 months grace period before full EMI repayment commences.
            </div>
          </div>

          <button
            type="button"
            className="edu-loan-cta-btn"
            onClick={() => {
              setIsModalOpen(true);
              setIsSubmitted(false);
            }}
          >
            Check Education Loan Options &rarr;
          </button>
        </div>
      </div>

      {/* Mock Enquiry Modal */}
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
                <div className="lowest-emi-success-icon">🎓</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                  Mock Education Loan Enquiry Sent!
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                  In live mode, our study abroad financing experts would contact <strong>{studentName}</strong> ({studentPhone}) to structure an education loan of <strong>{formatCurrency(estimatedRequirement)}</strong> for <strong>{university}</strong>.
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
                  Compare Education Loan Schemes
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
                  Explore secured (with collateral) and non-collateral loan options across public banks &amp; specialized NBFCs.
                </p>

                <form onSubmit={handleMockSubmit}>
                  <div className="lowest-emi-form-group">
                    <label htmlFor="studentName" className="lowest-emi-label">
                      Applicant Name
                    </label>
                    <input
                      id="studentName"
                      type="text"
                      className="lowest-emi-input"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Ananya Patel"
                      required
                    />
                  </div>

                  <div className="lowest-emi-form-group">
                    <label htmlFor="studentPhone" className="lowest-emi-label">
                      10-Digit Mobile Number
                    </label>
                    <input
                      id="studentPhone"
                      type="tel"
                      className="lowest-emi-input"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                    />
                  </div>

                  <button type="submit" className="edu-loan-cta-btn" style={{ width: '100%', marginTop: '8px' }}>
                    Request Education Loan Callback (Mock) &rarr;
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
