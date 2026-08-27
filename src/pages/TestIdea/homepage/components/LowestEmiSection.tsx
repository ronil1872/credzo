import React, { useState, useMemo } from 'react';

interface LowestEmiSectionProps {
  onTalkToExpert: (context?: { balance: number; savings: number }) => void;
}

export const LowestEmiSection: React.FC<LowestEmiSectionProps> = ({ onTalkToExpert }) => {
  const [loanBalance, setLoanBalance] = useState<number>(4500000);
  const [currentRate, setCurrentRate] = useState<number>(9.5);
  const [remainingTenure, setRemainingTenure] = useState<number>(15);
  const [manualEmi, setManualEmi] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(true);

  // Helper EMI calculation formula
  const calculateEmi = (principal: number, annualRate: number, tenureYears: number): number => {
    if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(emi);
  };

  // Benchmark estimated competitive market rate based on loan size
  const benchmarkRate = useMemo(() => {
    if (loanBalance >= 7500000) return 8.35;
    if (loanBalance >= 3000000) return 8.45;
    return 8.60;
  }, [loanBalance]);

  const computedCurrentEmi = useMemo(() => {
    if (manualEmi && Number(manualEmi) > 0) {
      return Number(manualEmi);
    }
    return calculateEmi(loanBalance, currentRate, remainingTenure);
  }, [loanBalance, currentRate, remainingTenure, manualEmi]);

  const estimatedNewEmi = useMemo(() => {
    return calculateEmi(loanBalance, benchmarkRate, remainingTenure);
  }, [loanBalance, benchmarkRate, remainingTenure]);

  const monthlySavings = Math.max(0, computedCurrentEmi - estimatedNewEmi);
  const annualSavings = monthlySavings * 12;
  const lifetimeSavings = monthlySavings * remainingTenure * 12;

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(true);
  };

  return (
    <section className="cz-section cz-emi-section" id="calculators">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Home Loan Refinancing</span>
          <h2 className="cz-section-title">Could You Be Paying More EMI Than You Need To?</h2>
          <p className="cz-section-subtitle">
            Compare your current home loan and see your estimated potential savings with competitive balance transfer options.
          </p>
        </div>

        <div className="cz-emi-calculator-grid">
          {/* Input Form Column */}
          <div className="cz-emi-card cz-emi-input-card">
            <h3 className="cz-card-title">Enter Your Current Loan Details</h3>
            
            <form onSubmit={handleCalculate} className="cz-form">
              {/* Current Balance */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="emi-balance">Current Outstanding Balance</label>
                  <span className="cz-label-value">{formatCurrency(loanBalance)}</span>
                </div>
                <input
                  id="emi-balance"
                  type="range"
                  min="500000"
                  max="30000000"
                  step="100000"
                  value={loanBalance}
                  onChange={(e) => setLoanBalance(Number(e.target.value))}
                  className="cz-range-slider"
                />
                <div className="cz-range-hints">
                  <span>₹5 Lakh</span>
                  <span>₹1.5 Cr</span>
                  <span>₹3 Cr</span>
                </div>
              </div>

              {/* Current Interest Rate */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="emi-rate">Current Interest Rate (% p.a.)</label>
                  <span className="cz-label-value">{currentRate}%</span>
                </div>
                <input
                  id="emi-rate"
                  type="range"
                  min="8.0"
                  max="15.0"
                  step="0.05"
                  value={currentRate}
                  onChange={(e) => setCurrentRate(Number(e.target.value))}
                  className="cz-range-slider"
                />
                <div className="cz-range-hints">
                  <span>8.0%</span>
                  <span>11.5%</span>
                  <span>15.0%</span>
                </div>
              </div>

              {/* Remaining Tenure */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="emi-tenure">Remaining Tenure (Years)</label>
                  <span className="cz-label-value">{remainingTenure} Years</span>
                </div>
                <input
                  id="emi-tenure"
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={remainingTenure}
                  onChange={(e) => setRemainingTenure(Number(e.target.value))}
                  className="cz-range-slider"
                />
                <div className="cz-range-hints">
                  <span>1 Yr</span>
                  <span>15 Yrs</span>
                  <span>30 Yrs</span>
                </div>
              </div>

              {/* Optional Manual EMI */}
              <div className="cz-form-group">
                <label htmlFor="emi-manual" className="cz-label-sub">
                  Current Monthly EMI (Optional Override)
                </label>
                <div className="cz-input-addon-group">
                  <span className="cz-addon">₹</span>
                  <input
                    id="emi-manual"
                    type="number"
                    value={manualEmi}
                    onChange={(e) => setManualEmi(e.target.value)}
                    placeholder={computedCurrentEmi.toString()}
                    className="cz-input"
                  />
                </div>
              </div>

              <button type="submit" className="cz-btn cz-btn-secondary cz-btn-block">
                Recalculate Potential Savings
              </button>
            </form>
          </div>

          {/* Results Column */}
          <div className="cz-emi-card cz-emi-result-card">
            <div className="cz-result-header">
              <span className="cz-result-badge">Analysis Summary</span>
              <h3 className="cz-result-title">Estimated Potential Savings</h3>
            </div>

            {showResult && (
              <div className="cz-result-content">
                {/* Monthly Savings Highlight */}
                <div className="cz-savings-box">
                  <span className="cz-savings-label">Estimated Potential Monthly Savings</span>
                  <span className="cz-savings-value">{formatCurrency(monthlySavings)}/mo</span>
                  <span className="cz-savings-note">
                    Based on an estimated benchmark refinancing rate of ~{benchmarkRate}% p.a.
                  </span>
                </div>

                {/* Savings Breakdown */}
                <div className="cz-savings-grid">
                  <div className="cz-savings-cell">
                    <span className="cz-cell-label">Current Monthly EMI</span>
                    <span className="cz-cell-value cz-current">{formatCurrency(computedCurrentEmi)}</span>
                  </div>
                  <div className="cz-savings-cell">
                    <span className="cz-cell-label">Estimated Lower EMI</span>
                    <span className="cz-cell-value cz-new">{formatCurrency(estimatedNewEmi)}</span>
                  </div>
                  <div className="cz-savings-cell">
                    <span className="cz-cell-label">Est. Annual Savings</span>
                    <span className="cz-cell-value cz-highlight">{formatCurrency(annualSavings)}</span>
                  </div>
                  <div className="cz-savings-cell">
                    <span className="cz-cell-label">Est. Lifetime Savings</span>
                    <span className="cz-cell-value cz-highlight">{formatCurrency(lifetimeSavings)}</span>
                  </div>
                </div>

                <div className="cz-disclaimer-box">
                  <p>
                    <strong>*Disclaimer:</strong> Figures shown are indicative estimates for comparison purposes only. Actual interest rates, eligible loan amount, processing fees, and savings are determined by partner lending institutions subject to credit appraisal and verification.
                  </p>
                </div>

                {/* Prominent Lead CTA */}
                <div className="cz-result-lead-action">
                  <p className="cz-lead-action-text">
                    Want us to check refinancing options for your loan?
                  </p>
                  <button
                    type="button"
                    className="cz-btn cz-btn-primary cz-btn-large cz-btn-block"
                    onClick={() =>
                      onTalkToExpert({
                        balance: loanBalance,
                        savings: monthlySavings,
                      })
                    }
                  >
                    <span>Talk to a Loan Expert</span>
                    <span className="cz-btn-arrow">&rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
