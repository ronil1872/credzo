import React, { useState } from 'react';
import { LoanCalculationResult } from '../../types';
import { formatIndianCurrency, formatTenureDisplay } from '../../lib/calculator';

interface CalculatorResultProps {
  result: LoanCalculationResult;
  loanTypeLabel: string;
  justCalculated?: boolean;
}

export const CalculatorResult: React.FC<CalculatorResultProps> = ({
  result,
  loanTypeLabel,
  justCalculated = false,
}) => {
  const [showCallbackNotice, setShowCallbackNotice] = useState(false);

  const handleCallbackClick = () => {
    setShowCallbackNotice(true);
  };

  return (
    <div className="calculator-result-container" id="calculator-result">
      {/* 1. Main Highlight Card */}
      <div className={`result-highlight-card ${justCalculated ? 'recalculated-pulse' : ''}`}>
        <div className="result-card-header">
          <div className="badge-group">
            <span className="result-badge">Illustrative Estimate</span>
            {justCalculated && (
              <span className="result-updated-badge" aria-live="polite">
                Updated
              </span>
            )}
          </div>
          <span className="result-loan-type">{loanTypeLabel}</span>
        </div>

        <div className="result-main-metric">
          <span className="metric-caption">Estimated Monthly EMI</span>
          <div className="metric-amount">
            {formatIndianCurrency(result.monthlyEmi)}
            <span className="metric-unit">/month</span>
          </div>
          <p className="metric-subtext">
            Based on an illustrative rate of {result.annualInterestRate}% p.a.
          </p>
        </div>

        {/* Breakdown Progress Bar */}
        <div className="repayment-breakdown-bar">
          <div
            className="bar-segment principal-bar"
            style={{ width: `${result.principalPercentage}%` }}
            title={`Principal: ${result.principalPercentage}%`}
          />
          <div
            className="bar-segment interest-bar"
            style={{ width: `${result.interestPercentage}%` }}
            title={`Interest: ${result.interestPercentage}%`}
          />
        </div>

        {/* Legend */}
        <div className="breakdown-legend">
          <div className="legend-item">
            <span className="legend-dot dot-principal" />
            <span className="legend-text">
              Principal: {formatIndianCurrency(result.principal)} ({result.principalPercentage}%)
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-interest" />
            <span className="legend-text">
              Total Interest: {formatIndianCurrency(result.totalInterest)} ({result.interestPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Structured Breakdown Summary Grid */}
      <div className="result-summary-grid">
        <div className="summary-item">
          <span className="summary-label">Loan Amount</span>
          <span className="summary-val">{formatIndianCurrency(result.principal)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Illustrative Rate</span>
          <span className="summary-val">{result.annualInterestRate}% p.a.</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Tenure</span>
          <span className="summary-val">{formatTenureDisplay(result.tenureMonths)}</span>
        </div>
        <div className="summary-item highlight-item">
          <span className="summary-label">Est. Total Interest</span>
          <span className="summary-val">{formatIndianCurrency(result.totalInterest)}</span>
        </div>
        <div className="summary-item highlight-item">
          <span className="summary-label">Est. Total Repayment</span>
          <span className="summary-val">{formatIndianCurrency(result.totalRepayment)}</span>
        </div>
      </div>

      {/* 3. Mandatory Transparency & Disclaimers */}
      <div className="result-disclaimer-box">
        <div className="disclaimer-title-row">
          <svg className="disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <h4>Illustrative Estimate Only</h4>
        </div>
        <p>
          This calculation is for illustrative and financial planning purposes only. Final interest rates, loan tenure, fees, eligibility, and sanction are strictly determined by the relevant lending institution based on its internal credit policies, documentation, and verification.
        </p>
        <p className="disclaimer-secondary">
          Submitting an enquiry or calculating an estimate does not guarantee loan approval or official eligibility.
        </p>
      </div>

      {/* 4. Future Callback CTA */}
      <div className="result-callback-card">
        <h4 className="callback-title">
          Want a free callback to discuss your loan options?
        </h4>
        <p className="callback-subtitle">
          Speak with a loan specialist to explore options suited to your requirement. Free & no obligation.
        </p>
        
        <button
          type="button"
          className="btn btn-primary btn-md btn-full-width"
          onClick={handleCallbackClick}
        >
          Request a Free Callback &rarr;
        </button>

        {showCallbackNotice && (
          <div className="callback-stage-notice" role="status">
            <span className="notice-badge">Stage 3 Notice</span>
            <p>
              Lead capture and callback scheduling will be connected in <strong>Stage 5</strong>. No customer information is saved at this stage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
