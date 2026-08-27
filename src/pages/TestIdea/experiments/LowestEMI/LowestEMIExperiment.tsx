import React, { useState, useMemo } from 'react';
import './LowestEMI.css';

export const LowestEMIExperiment: React.FC = () => {
  const [loanBalance, setLoanBalance] = useState<number>(4500000);
  const [currentRate, setCurrentRate] = useState<number>(9.65);
  const [remainingTenureYears, setRemainingTenureYears] = useState<number>(15);
  const [manualEmi, setManualEmi] = useState<string>('');
  const [isCalculated, setIsCalculated] = useState<boolean>(true);
  
  // Mock Lead Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [leadName, setLeadName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadCity, setLeadCity] = useState<string>(''); // Completely blank initial value
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Helper EMI calculation
  const calculateEmi = (principal: number, annualRate: number, tenureYears: number): number => {
    if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(emi);
  };

  // Mock benchmark competitive refinancing rate based on loan size
  const benchmarkRefinanceRate = useMemo(() => {
    if (loanBalance >= 7500000) return 8.35;
    if (loanBalance >= 3000000) return 8.45;
    return 8.60;
  }, [loanBalance]);

  const computedCurrentEmi = useMemo(() => {
    if (manualEmi && Number(manualEmi) > 0) {
      return Number(manualEmi);
    }
    return calculateEmi(loanBalance, currentRate, remainingTenureYears);
  }, [loanBalance, currentRate, remainingTenureYears, manualEmi]);

  const estimatedNewEmi = useMemo(() => {
    return calculateEmi(loanBalance, benchmarkRefinanceRate, remainingTenureYears);
  }, [loanBalance, benchmarkRefinanceRate, remainingTenureYears]);

  const monthlySavings = Math.max(0, computedCurrentEmi - estimatedNewEmi);
  const annualSavings = monthlySavings * 12;
  const lifetimeSavings = monthlySavings * remainingTenureYears * 12;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
  };

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;
    setIsSubmitted(true);
  };

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="lowest-emi-container">
      {/* Header */}
      <div className="lowest-emi-header">
        <div className="lowest-emi-badge">
          <span>💰</span> Balance Transfer &amp; Refinance Test
        </div>
        <h1 className="lowest-emi-title">Looking for a lower home-loan EMI?</h1>
        <p className="lowest-emi-subtitle">
          Compare your current home loan and see your estimated potential savings.
        </p>
      </div>

      <div className="lowest-emi-grid">
        {/* Form Inputs Card */}
        <div className="lowest-emi-card">
          <h2 className="lowest-emi-card-title">
            <span>📝</span> Your Existing Loan Details
          </h2>

          <form onSubmit={handleCalculate}>
            <div className="lowest-emi-form-group">
              <label htmlFor="loanBalance" className="lowest-emi-label">
                Current Outstanding Loan Balance
              </label>
              <div className="lowest-emi-input-wrap">
                <span className="lowest-emi-input-prefix">₹</span>
                <input
                  id="loanBalance"
                  type="number"
                  className="lowest-emi-input has-prefix"
                  value={loanBalance || ''}
                  onChange={(e) => setLoanBalance(Number(e.target.value))}
                  placeholder="e.g. 4500000"
                  min="100000"
                  step="50000"
                  required
                />
              </div>
              <div className="lowest-emi-presets">
                {[2500000, 4500000, 7500000, 10000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="lowest-emi-preset-btn"
                    onClick={() => setLoanBalance(preset)}
                  >
                    ₹{(preset / 100000).toFixed(0)}L
                  </button>
                ))}
              </div>
            </div>

            <div className="lowest-emi-form-group">
              <label htmlFor="currentRate" className="lowest-emi-label">
                Current Interest Rate (% p.a.)
              </label>
              <div className="lowest-emi-input-wrap">
                <input
                  id="currentRate"
                  type="number"
                  className="lowest-emi-input has-suffix"
                  value={currentRate || ''}
                  onChange={(e) => setCurrentRate(Number(e.target.value))}
                  placeholder="e.g. 9.5"
                  min="5"
                  max="20"
                  step="0.05"
                  required
                />
                <span className="lowest-emi-input-suffix">%</span>
              </div>
              <div className="lowest-emi-presets">
                {[9.0, 9.5, 10.0, 10.5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="lowest-emi-preset-btn"
                    onClick={() => setCurrentRate(preset)}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <div className="lowest-emi-form-group">
              <label htmlFor="tenureYears" className="lowest-emi-label">
                Remaining Tenure
              </label>
              <div className="lowest-emi-input-wrap">
                <input
                  id="tenureYears"
                  type="number"
                  className="lowest-emi-input has-suffix"
                  value={remainingTenureYears || ''}
                  onChange={(e) => setRemainingTenureYears(Number(e.target.value))}
                  placeholder="e.g. 15"
                  min="1"
                  max="30"
                  required
                />
                <span className="lowest-emi-input-suffix">Years</span>
              </div>
              <div className="lowest-emi-presets">
                {[10, 15, 20, 25].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="lowest-emi-preset-btn"
                    onClick={() => setRemainingTenureYears(preset)}
                  >
                    {preset} Yrs
                  </button>
                ))}
              </div>
            </div>

            <div className="lowest-emi-form-group">
              <label htmlFor="manualEmi" className="lowest-emi-label">
                Current Monthly EMI (Optional override)
              </label>
              <div className="lowest-emi-input-wrap">
                <span className="lowest-emi-input-prefix">₹</span>
                <input
                  id="manualEmi"
                  type="number"
                  className="lowest-emi-input has-prefix"
                  value={manualEmi}
                  onChange={(e) => setManualEmi(e.target.value)}
                  placeholder={`Auto: ${formatCurrency(calculateEmi(loanBalance, currentRate, remainingTenureYears))}`}
                />
              </div>
            </div>

            <button type="submit" className="lowest-emi-calc-btn">
              Calculate My Savings
            </button>
          </form>
        </div>

        {/* Results Card */}
        {isCalculated && (
          <div className="lowest-emi-result-card">
            <div>
              <div className="lowest-emi-savings-banner">
                <div className="lowest-emi-savings-label">
                  Estimated Potential Savings
                </div>
                <div className="lowest-emi-savings-amount">
                  {formatCurrency(monthlySavings)}
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}> / month</span>
                </div>
                <div className="lowest-emi-savings-annual">
                  Up to {formatCurrency(annualSavings)}/yr ({formatCurrency(lifetimeSavings)} over remaining tenure)
                </div>
              </div>

              <div className="lowest-emi-comparison-grid">
                <div className="lowest-emi-stat-box">
                  <div className="lowest-emi-stat-label">Current EMI</div>
                  <div className="lowest-emi-stat-val">
                    {formatCurrency(computedCurrentEmi)}
                  </div>
                </div>

                <div className="lowest-emi-stat-box">
                  <div className="lowest-emi-stat-label">Estimated Refinanced EMI</div>
                  <div className="lowest-emi-stat-val highlight">
                    {formatCurrency(estimatedNewEmi)}
                  </div>
                </div>

                <div className="lowest-emi-stat-box">
                  <div className="lowest-emi-stat-label">Current Rate</div>
                  <div className="lowest-emi-stat-val">{currentRate}% p.a.</div>
                </div>

                <div className="lowest-emi-stat-box">
                  <div className="lowest-emi-stat-label">Competitive Benchmark</div>
                  <div className="lowest-emi-stat-val highlight">
                    {benchmarkRefinanceRate}% p.a.*
                  </div>
                </div>
              </div>

              <div className="lowest-emi-disclaimer">
                <p>
                  <strong>*Note on Calculations:</strong> You may be able to reduce your EMI based on current lender balance transfer policies. Figures shown are illustrative estimates. Final terms and interest rates are determined by individual lending institutions based on CIBIL score and property appraisal. No guaranteed savings promised.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="lowest-emi-cta-btn"
              onClick={() => {
                setIsModalOpen(true);
                setIsSubmitted(false);
              }}
            >
              Check Refinancing Options &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Mock Lead Capture Modal */}
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
                <div className="lowest-emi-success-icon">🎉</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                  Mock Enquiry Captured!
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                  In production, our advisor team would receive this balance transfer request for <strong>{leadName}</strong> ({leadPhone}) with estimated savings of <strong>{formatCurrency(monthlySavings)}/mo</strong>.
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
                  Explore Lower EMI Options
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
                  See if your existing home loan qualifies for competitive balance transfer rates.
                </p>

                <form onSubmit={handleMockSubmit}>
                  <div className="lowest-emi-form-group">
                    <label htmlFor="leadName" className="lowest-emi-label">
                      Your Full Name
                    </label>
                    <input
                      id="leadName"
                      type="text"
                      className="lowest-emi-input"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Your Name"
                      required
                    />
                  </div>

                  <div className="lowest-emi-form-group">
                    <label htmlFor="leadPhone" className="lowest-emi-label">
                      10-Digit Mobile Number
                    </label>
                    <input
                      id="leadPhone"
                      type="tel"
                      className="lowest-emi-input"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="lowest-emi-form-group">
                    <label htmlFor="leadCity" className="lowest-emi-label">
                      City
                    </label>
                    <input
                      id="leadCity"
                      type="text"
                      className="lowest-emi-input"
                      value={leadCity}
                      onChange={(e) => setLeadCity(e.target.value)}
                      placeholder="Your City"
                    />
                  </div>

                  <button type="submit" className="lowest-emi-cta-btn" style={{ width: '100%', marginTop: '8px' }}>
                    Request Callback (Mock) &rarr;
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
