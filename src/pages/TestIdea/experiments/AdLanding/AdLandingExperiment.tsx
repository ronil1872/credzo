import React, { useState } from 'react';
import './AdLanding.css';

export const AdLandingExperiment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // 5 Step Inputs
  const [monthlyIncome, setMonthlyIncome] = useState<number>(75000);
  const [employmentType, setEmploymentType] = useState<string>('salaried');
  const [existingEmi, setExistingEmi] = useState<number>(10000);
  const [applicantAge, setApplicantAge] = useState<number>(30);
  const [requiredLoanAmount, setRequiredLoanAmount] = useState<number>(4000000);

  // Lead capture state
  const [leadName, setLeadName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadCity, setLeadCity] = useState<string>(''); // Completely blank initial value
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Estimated Eligibility calculation (standard FOIR 50-60%)
  const calculateEligibility = () => {
    const foir = employmentType === 'salaried' ? 0.55 : 0.60;
    const maxAvailableEmi = Math.max(5000, monthlyIncome * foir - existingEmi);
    
    // Remaining working years up to retirement (60 for salaried, 65 for self-employed)
    const retirementAge = employmentType === 'salaried' ? 60 : 65;
    const maxTenureYears = Math.min(30, Math.max(5, retirementAge - applicantAge));
    
    // Benchmark interest rate ~8.5%
    const monthlyRate = 8.5 / 12 / 100;
    const totalMonths = maxTenureYears * 12;
    
    // Max Principal = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
    const baseEligibility = maxAvailableEmi * (Math.pow(1 + monthlyRate, totalMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
    
    const minRange = Math.round(baseEligibility * 0.9 / 50000) * 50000;
    const maxRange = Math.round(baseEligibility * 1.1 / 50000) * 50000;
    
    return {
      minRange,
      maxRange,
      maxTenureYears,
      maxAvailableEmi: Math.round(maxAvailableEmi),
    };
  };

  const eligibility = calculateEligibility();

  const formatLakhs = (val: number): string => {
    const lakhs = val / 100000;
    if (lakhs >= 100) {
      return `₹${(lakhs / 100).toFixed(2)} Cr`;
    }
    return `₹${lakhs.toFixed(0)}L`;
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMockLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;
    setIsSubmitted(true);
  };

  return (
    <div className="ad-landing-container">
      {/* Header Banner */}
      <div className="ad-landing-header">
        <div className="ad-landing-pill">
          <span>🎯</span> Ad Campaign Target Funnel (Isolated)
        </div>
        <h1 className="ad-landing-title">🏠 Buying a home?</h1>
        <p className="ad-landing-subtitle">
          Find out how much home loan you may be eligible for in under 60 seconds.
        </p>
      </div>

      <div className="ad-landing-card">
        {/* Progress Bar */}
        {currentStep <= 5 && (
          <div className="ad-landing-progress-bar">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`ad-progress-step ${
                  currentStep === step ? 'active' : currentStep > step ? 'completed' : ''
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Monthly Income */}
        {currentStep === 1 && (
          <div>
            <div className="ad-question-num">Step 1 of 5</div>
            <h2 className="ad-question-title">What is your total net monthly income?</h2>

            <div className="ad-input-group">
              <div className="ad-input-wrap">
                <span className="ad-input-prefix">₹</span>
                <input
                  type="number"
                  className="ad-input has-prefix"
                  value={monthlyIncome || ''}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  placeholder="75000"
                  step="5000"
                  min="15000"
                />
              </div>

              <div className="ad-preset-pills">
                {[35000, 50000, 75000, 100000, 150000, 250000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="ad-preset-pill"
                    onClick={() => setMonthlyIncome(preset)}
                  >
                    ₹{(preset / 1000).toFixed(0)}k/mo
                  </button>
                ))}
              </div>
            </div>

            <div className="ad-nav-actions">
              <div />
              <button type="button" className="ad-btn-next" onClick={handleNext}>
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Employment Type */}
        {currentStep === 2 && (
          <div>
            <div className="ad-question-num">Step 2 of 5</div>
            <h2 className="ad-question-title">What is your employment type?</h2>

            <div className="ad-options-grid">
              <div
                className={`ad-option-card ${employmentType === 'salaried' ? 'selected' : ''}`}
                onClick={() => setEmploymentType('salaried')}
              >
                <span className="ad-option-icon">💼</span>
                <div>
                  <div className="ad-option-text">Salaried Employee</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Working in Private / MNC / Govt organization</span>
                </div>
              </div>

              <div
                className={`ad-option-card ${employmentType === 'professional' ? 'selected' : ''}`}
                onClick={() => setEmploymentType('professional')}
              >
                <span className="ad-option-icon">🩺</span>
                <div>
                  <div className="ad-option-text">Self-Employed Professional</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Doctor, Chartered Accountant, Architect, Lawyer</span>
                </div>
              </div>

              <div
                className={`ad-option-card ${employmentType === 'business' ? 'selected' : ''}`}
                onClick={() => setEmploymentType('business')}
              >
                <span className="ad-option-icon">🏬</span>
                <div>
                  <div className="ad-option-text">Self-Employed Business / Trader</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Proprietor, Partner, Director with filed ITRs</span>
                </div>
              </div>
            </div>

            <div className="ad-nav-actions">
              <button type="button" className="ad-btn-back" onClick={handleBack}>
                &larr; Back
              </button>
              <button type="button" className="ad-btn-next" onClick={handleNext}>
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Existing EMI */}
        {currentStep === 3 && (
          <div>
            <div className="ad-question-num">Step 3 of 5</div>
            <h2 className="ad-question-title">Do you currently pay any monthly loan EMIs?</h2>

            <div className="ad-input-group">
              <div className="ad-input-wrap">
                <span className="ad-input-prefix">₹</span>
                <input
                  type="number"
                  className="ad-input has-prefix"
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(Number(e.target.value))}
                  placeholder="0"
                  step="2000"
                  min="0"
                />
              </div>

              <div className="ad-preset-pills">
                {[0, 5000, 10000, 20000, 35000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="ad-preset-pill"
                    onClick={() => setExistingEmi(preset)}
                  >
                    {preset === 0 ? 'Zero EMI' : `₹${(preset / 1000).toFixed(0)}k`}
                  </button>
                ))}
              </div>
            </div>

            <div className="ad-nav-actions">
              <button type="button" className="ad-btn-back" onClick={handleBack}>
                &larr; Back
              </button>
              <button type="button" className="ad-btn-next" onClick={handleNext}>
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Age */}
        {currentStep === 4 && (
          <div>
            <div className="ad-question-num">Step 4 of 5</div>
            <h2 className="ad-question-title">What is your current age?</h2>

            <div className="ad-input-group">
              <div className="ad-input-wrap">
                <input
                  type="number"
                  className="ad-input has-suffix"
                  value={applicantAge || ''}
                  onChange={(e) => setApplicantAge(Number(e.target.value))}
                  placeholder="30"
                  min="21"
                  max="65"
                />
                <span className="ad-input-suffix">Years</span>
              </div>

              <div className="ad-preset-pills">
                {[25, 28, 32, 36, 42, 48].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="ad-preset-pill"
                    onClick={() => setApplicantAge(preset)}
                  >
                    {preset} Yrs
                  </button>
                ))}
              </div>
            </div>

            <div className="ad-nav-actions">
              <button type="button" className="ad-btn-back" onClick={handleBack}>
                &larr; Back
              </button>
              <button type="button" className="ad-btn-next" onClick={handleNext}>
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Required Loan Amount */}
        {currentStep === 5 && (
          <div>
            <div className="ad-question-num">Step 5 of 5</div>
            <h2 className="ad-question-title">How much loan amount are you looking for?</h2>

            <div className="ad-input-group">
              <div className="ad-input-wrap">
                <span className="ad-input-prefix">₹</span>
                <input
                  type="number"
                  className="ad-input has-prefix"
                  value={requiredLoanAmount || ''}
                  onChange={(e) => setRequiredLoanAmount(Number(e.target.value))}
                  placeholder="4000000"
                  step="100000"
                  min="500000"
                />
              </div>

              <div className="ad-preset-pills">
                {[2500000, 4000000, 6000000, 8500000, 12500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="ad-preset-pill"
                    onClick={() => setRequiredLoanAmount(preset)}
                  >
                    {formatLakhs(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div className="ad-nav-actions">
              <button type="button" className="ad-btn-back" onClick={handleBack}>
                &larr; Back
              </button>
              <button type="button" className="ad-btn-next" onClick={handleNext}>
                View My Estimated Eligibility &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Eligibility Result & High-Conversion Lead Capture */}
        {currentStep === 6 && (
          <div className="ad-result-view">
            <div className="ad-eligibility-highlight-box">
              <div className="ad-eligibility-label">Estimated Home Loan Eligibility</div>
              <div className="ad-eligibility-range">
                {formatLakhs(eligibility.minRange)} – {formatLakhs(eligibility.maxRange)}
              </div>
              <div className="ad-eligibility-note">
                Based on your ₹{(monthlyIncome / 1000).toFixed(0)}k income &amp; up to {eligibility.maxTenureYears} years tenure.
              </div>
            </div>

            {isSubmitted ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                  Options Unlocked (Mock Mode)
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#15803d', marginBottom: '16px', lineHeight: 1.5 }}>
                  In production, our banking specialist would connect with <strong>{leadName}</strong> at <strong>{leadPhone}</strong> with pre-screened loan offers from SBI, HDFC, and ICICI.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#475569', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  🔒 <em>No Supabase write occurred. Prototype test only.</em>
                </div>
                <button
                  type="button"
                  className="ad-btn-back"
                  style={{ marginTop: '16px' }}
                  onClick={() => {
                    setIsSubmitted(false);
                    setCurrentStep(1);
                  }}
                >
                  Restart Quiz
                </button>
              </div>
            ) : (
              <div className="ad-lead-section">
                <h3 className="ad-lead-title">Want us to check suitable loan options for you?</h3>
                <p className="ad-lead-desc">
                  Understand suitable loan options based on your needs. Free expert guidance with no spam calls.
                </p>

                <form onSubmit={handleMockLeadSubmit}>
                  <div className="ad-lead-input-group">
                    <label htmlFor="adLeadName" className="ad-lead-label">Your Name</label>
                    <input
                      id="adLeadName"
                      type="text"
                      className="ad-lead-input"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Your Name"
                      required
                    />
                  </div>

                  <div className="ad-lead-input-group">
                    <label htmlFor="adLeadPhone" className="ad-lead-label">Mobile Number</label>
                    <input
                      id="adLeadPhone"
                      type="tel"
                      className="ad-lead-input"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="ad-lead-input-group">
                    <label htmlFor="adLeadCity" className="ad-lead-label">City</label>
                    <input
                      id="adLeadCity"
                      type="text"
                      className="ad-lead-input"
                      value={leadCity}
                      onChange={(e) => setLeadCity(e.target.value)}
                      placeholder="Your City"
                    />
                  </div>

                  <button type="submit" className="ad-lead-submit-btn">
                    Get Personalized Options &rarr;
                  </button>
                </form>

                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    &larr; Modify Answers
                  </button>
                </div>
              </div>
            )}

            <div className="ad-trust-footer">
              <span>🔒 100% Privacy Protected</span>
              <span>⚡ Free &amp; Instant Estimation</span>
              <span>🏦 No Impact on CIBIL</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
