import React, { useState, useMemo } from 'react';

interface HomeLoanAffordabilitySectionProps {
  onGetPersonalizedOptions: (context?: { income: number; propertyPrice: number; eligibleLoan: number }) => void;
}

export const HomeLoanAffordabilitySection: React.FC<HomeLoanAffordabilitySectionProps> = ({
  onGetPersonalizedOptions,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [existingEmi, setExistingEmi] = useState<number>(15000);
  const [propertyPrice, setPropertyPrice] = useState<number>(6500000);
  const [showEstimate, setShowEstimate] = useState<boolean>(true);

  // Standard banking FOIR (Fixed Obligation to Income Ratio) ~50%
  const maxAllowableEmi = useMemo(() => {
    const foirEmi = monthlyIncome * 0.5;
    return Math.max(0, foirEmi - existingEmi);
  }, [monthlyIncome, existingEmi]);

  // Max loan amount derived from allowable EMI for 20 years at ~8.75%
  const estimatedEligibleLoan = useMemo(() => {
    const rate = 0.0875 / 12;
    const months = 240;
    if (maxAllowableEmi <= 0) return 0;
    const loan = (maxAllowableEmi * (Math.pow(1 + rate, months) - 1)) / (rate * Math.pow(1 + rate, months));
    // Capped by 80% LTV of property price
    const maxLtvCap = propertyPrice * 0.8;
    return Math.min(Math.round(loan), maxLtvCap);
  }, [maxAllowableEmi, propertyPrice]);

  const estimatedDownPayment = useMemo(() => {
    return Math.max(0, propertyPrice - estimatedEligibleLoan);
  }, [propertyPrice, estimatedEligibleLoan]);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEstimate(true);
  };

  return (
    <section className="cz-section cz-affordability-section" id="affordability">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Affordability Estimator</span>
          <h2 className="cz-section-title">Planning to Buy a Home?</h2>
          <p className="cz-section-subtitle">
            Find out what loan amount may fit your budget based on your monthly income and obligations.
          </p>
        </div>

        <div className="cz-affordability-grid">
          {/* Inputs */}
          <div className="cz-affordability-card cz-affordability-input-card">
            <h3 className="cz-card-title">Your Monthly Financial Profile</h3>

            <form onSubmit={handleCalculate} className="cz-form">
              {/* Monthly Income */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="afford-income">Net Monthly In-Hand Income</label>
                  <span className="cz-label-value">{formatCurrency(monthlyIncome)}</span>
                </div>
                <input
                  id="afford-income"
                  type="range"
                  min="25000"
                  max="500000"
                  step="5000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="cz-range-slider"
                />
                <div className="cz-range-hints">
                  <span>₹25k</span>
                  <span>₹2.5 Lakh</span>
                  <span>₹5 Lakh+</span>
                </div>
              </div>

              {/* Existing EMIs */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="afford-emi">Existing Monthly EMIs (Car, Personal, etc.)</label>
                  <span className="cz-label-value">{formatCurrency(existingEmi)}</span>
                </div>
                <input
                  id="afford-emi"
                  type="range"
                  min="0"
                  max="150000"
                  step="2500"
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(Number(e.target.value))}
                  className="cz-range-slider"
                />
                <div className="cz-range-hints">
                  <span>₹0</span>
                  <span>₹75k</span>
                  <span>₹1.5 Lakh</span>
                </div>
              </div>

              {/* Property Price */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="afford-price">Target Property Price</label>
                  <span className="cz-label-value">{formatCurrency(propertyPrice)}</span>
                </div>
                <input
                  id="afford-price"
                  type="range"
                  min="2000000"
                  max="25000000"
                  step="250000"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="cz-range-slider"
                />
                <div className="cz-range-hints">
                  <span>₹20 Lakh</span>
                  <span>₹1.25 Cr</span>
                  <span>₹2.5 Cr</span>
                </div>
              </div>

              <button type="submit" className="cz-btn cz-btn-secondary cz-btn-block">
                Check My Eligibility
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="cz-affordability-card cz-affordability-result-card">
            <div className="cz-result-header">
              <span className="cz-result-badge">Eligibility Estimate</span>
              <h3 className="cz-result-title">Estimated Loan Capacity</h3>
            </div>

            {showEstimate && (
              <div className="cz-result-content">
                <div className="cz-savings-box cz-afford-result-box">
                  <span className="cz-savings-label">Estimated Maximum Eligible Loan</span>
                  <span className="cz-savings-value">{formatCurrency(estimatedEligibleLoan)}</span>
                  <span className="cz-savings-note">
                    Comfortable monthly EMI capacity: ~{formatCurrency(maxAllowableEmi)}/mo
                  </span>
                </div>

                <div className="cz-savings-grid">
                  <div className="cz-savings-cell">
                    <span className="cz-cell-label">Property Value</span>
                    <span className="cz-cell-value">{formatCurrency(propertyPrice)}</span>
                  </div>
                  <div className="cz-savings-cell">
                    <span className="cz-cell-label">Estimated Down Payment</span>
                    <span className="cz-cell-value cz-highlight">{formatCurrency(estimatedDownPayment)}</span>
                  </div>
                </div>

                <div className="cz-disclaimer-box">
                  <p>
                    *Indicative calculation assumes ~50% FOIR and 20-year repayment tenure. Final loan sanction is determined by partner lenders based on credit score, employer category, and property appraisal.
                  </p>
                </div>

                {/* Lead Action */}
                <div className="cz-result-lead-action">
                  <p className="cz-lead-action-text">Want us to check your actual options?</p>
                  <button
                    type="button"
                    className="cz-btn cz-btn-primary cz-btn-large cz-btn-block"
                    onClick={() =>
                      onGetPersonalizedOptions({
                        income: monthlyIncome,
                        propertyPrice,
                        eligibleLoan: estimatedEligibleLoan,
                      })
                    }
                  >
                    <span>Get Personalized Options</span>
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
