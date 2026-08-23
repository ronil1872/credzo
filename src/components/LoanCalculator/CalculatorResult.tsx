import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoanCalculationResult, LoanType } from '../../types';
import { formatIndianCurrency, formatTenureDisplay, LOAN_CONFIGURATIONS } from '../../lib/calculator';

interface CalculatorResultProps {
  result: LoanCalculationResult | null;
  loanTypeLabel: string;
  loanType?: LoanType;
  monthlyIncome?: string;
  existingEmi?: string;
  employmentType?: string;
  city?: string;
  justCalculated?: boolean;
  onRequestCall?: () => void;
}

export const CalculatorResult: React.FC<CalculatorResultProps> = ({
  result,
  loanTypeLabel,
  loanType = 'personal',
  monthlyIncome = '',
  existingEmi = '',
  employmentType = 'salaried',
  city = '',
  justCalculated = false,
  onRequestCall,
}) => {
  const navigate = useNavigate();

  const hasValidResult = Boolean(result && result.monthlyEmi > 0 && result.principal > 0);
  const defaultRate = LOAN_CONFIGURATIONS[loanType]?.defaultRate ?? 12;

  const handleCallbackClick = () => {
    if (!hasValidResult || !result) return;

    const snapshot = {
      result,
      loanTypeLabel,
      loanType,
      monthlyIncome,
      existingEmi,
      employmentType,
      city,
    };

    try {
      sessionStorage.setItem('credzo_calculation_snapshot', JSON.stringify(snapshot));
    } catch {
      // Ignore sessionStorage issues
    }

    if (onRequestCall) {
      onRequestCall();
    } else {
      navigate('/result', { state: snapshot });
    }
  };

  return (
    <div className="calculator-result-container" id="calculator-result">
      {/* 1. Main Highlight Card */}
      <div className={`result-highlight-card ${justCalculated ? 'recalculated-pulse' : ''}`}>
        <div className="result-card-header">
          <div className="badge-group">
            <span className="result-badge">
              {hasValidResult ? 'Illustrative Estimate' : 'Estimate Preview'}
            </span>
            {justCalculated && hasValidResult && (
              <span className="result-updated-badge" aria-live="polite">
                Updated
              </span>
            )}
          </div>
          <span className="result-loan-type">{loanTypeLabel}</span>
        </div>

        <div className="result-main-metric">
          <span className="metric-caption">Estimated Monthly EMI</span>
          <div className={`metric-amount ${!hasValidResult ? 'metric-amount-empty' : ''}`}>
            {hasValidResult && result ? (
              <>
                {formatIndianCurrency(result.monthlyEmi)}
                <span className="metric-unit">/month</span>
              </>
            ) : (
              '—'
            )}
          </div>
          <p className="metric-subtext">
            {hasValidResult && result
              ? `Based on an illustrative rate of ${result.annualInterestRate}% p.a.`
              : 'Enter your loan details to see your estimated EMI'}
          </p>
        </div>

        {/* Breakdown Progress Bar */}
        {hasValidResult && result ? (
          <>
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
          </>
        ) : (
          <div className="breakdown-empty-placeholder">
            <div className="repayment-breakdown-bar empty-breakdown-bar" />
            <p className="empty-breakdown-note">
              Principal and interest breakdown will appear here once calculated.
            </p>
          </div>
        )}
      </div>

      {/* 2. Structured Breakdown Summary Grid */}
      <div className="result-summary-grid">
        <div className="summary-item">
          <span className="summary-label">Loan Amount</span>
          <span className="summary-val">
            {hasValidResult && result ? formatIndianCurrency(result.principal) : '—'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Illustrative Rate</span>
          <span className="summary-val">
            {hasValidResult && result ? `${result.annualInterestRate}% p.a.` : `${defaultRate}% p.a.`}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Tenure</span>
          <span className="summary-val">
            {hasValidResult && result ? formatTenureDisplay(result.tenureMonths) : '—'}
          </span>
        </div>
        <div className="summary-item highlight-item">
          <span className="summary-label">Est. Total Interest</span>
          <span className="summary-val">
            {hasValidResult && result ? formatIndianCurrency(result.totalInterest) : '—'}
          </span>
        </div>
        <div className="summary-item highlight-item">
          <span className="summary-label">Est. Total Repayment</span>
          <span className="summary-val">
            {hasValidResult && result ? formatIndianCurrency(result.totalRepayment) : '—'}
          </span>
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

      {/* 4. Lead Capture Callback CTA */}
      <div className="result-callback-card">
        <h4 className="callback-title">
          Want help choosing the right loan?
        </h4>
        <p className="callback-subtitle">
          {hasValidResult
            ? 'Our advisory team can call you to explain your eligibility and lender options. 100% Free & No Obligation.'
            : 'Enter your loan details above to calculate an estimate and request a free callback.'}
        </p>
        
        <button
          type="button"
          className={`btn ${hasValidResult ? 'btn-primary' : 'btn-secondary'} btn-md btn-full-width`}
          id="request-callback-btn"
          disabled={!hasValidResult}
          onClick={handleCallbackClick}
        >
          {hasValidResult ? 'Request a Call From Our Team →' : 'Enter Details to Request Callback'}
        </button>
      </div>
    </div>
  );
};
