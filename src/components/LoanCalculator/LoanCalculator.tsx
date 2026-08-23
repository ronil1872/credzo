import React, { useState, useEffect } from 'react';
import {
  LoanType,
  EmploymentType,
  LoanCalculationResult,
  CalculatorValidationErrors,
} from '../../types';
import {
  LOAN_CONFIGURATIONS,
  calculateLoan,
  validateCalculatorInput,
  formatIndianCurrency,
  formatTenureDisplay,
} from '../../lib/calculator';
import { useLoanRates } from '../../hooks';
import { CalculatorInputs } from './CalculatorInputs';
import { CalculatorResult } from './CalculatorResult';
import { RequestCallModal } from '../RequestCallModal/RequestCallModal';
import './LoanCalculator.css';

export const LoanCalculator: React.FC = () => {
  const { configurations } = useLoanRates();

  // 1. Core Input State
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [principal, setPrincipal] = useState<number>(0);
  const [tenureMonths, setTenureMonths] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [existingEmi, setExistingEmi] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('salaried');
  const [city, setCity] = useState<string>('');
  const [errors, setErrors] = useState<CalculatorValidationErrors>({});
  
  // 2. Calculation Result State
  const [calculationResult, setCalculationResult] = useState<LoanCalculationResult | null>(null);
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  // 3. Post-Calculation EMI Popup State
  const [showEmiPrompt, setShowEmiPrompt] = useState<boolean>(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  // Helper to Recompute and Set Result
  const executeCalculation = (
    currentLoanType: LoanType,
    currentPrincipal: number,
    currentTenure: number
  ) => {
    if (currentPrincipal <= 0 || currentTenure <= 0) {
      setCalculationResult(null);
      return;
    }

    const config = configurations[currentLoanType];
    const newResult = calculateLoan({
      loanType: currentLoanType,
      principal: currentPrincipal,
      annualInterestRate: config?.defaultRate || 12,
      tenureMonths: currentTenure,
      monthlyIncome: monthlyIncome ? parseInt(monthlyIncome, 10) : undefined,
      existingEmi: existingEmi ? parseInt(existingEmi, 10) : undefined,
      employmentType,
      city,
    });
    setCalculationResult(newResult);
    return newResult;
  };

  // Handle active configurations change & clamp current values
  useEffect(() => {
    const availableKeys = Object.keys(configurations) as LoanType[];
    if (availableKeys.length === 0) return;

    let currentType = loanType;
    let typeChanged = false;

    // If current loanType is disabled / not in active configurations, switch to first active type
    if (!configurations[currentType]) {
      currentType = availableKeys[0];
      setLoanType(currentType);
      typeChanged = true;
    }

    const config = configurations[currentType];
    if (!config) return;

    let adjustedPrincipal = principal;
    let adjustedTenure = tenureMonths;
    let boundsChanged = false;

    if (principal > 0) {
      if (principal < config.minAmount) {
        adjustedPrincipal = config.minAmount;
        boundsChanged = true;
      } else if (principal > config.maxAmount) {
        adjustedPrincipal = config.maxAmount;
        boundsChanged = true;
      }
    }

    if (tenureMonths > 0) {
      if (tenureMonths < config.minTenureMonths) {
        adjustedTenure = config.minTenureMonths;
        boundsChanged = true;
      } else if (tenureMonths > config.maxTenureMonths) {
        adjustedTenure = config.maxTenureMonths;
        boundsChanged = true;
      }
    }

    if (boundsChanged) {
      setPrincipal(adjustedPrincipal);
      setTenureMonths(adjustedTenure);
    }

    if (typeChanged || boundsChanged) {
      if (adjustedPrincipal > 0 && adjustedTenure > 0) {
        executeCalculation(currentType, adjustedPrincipal, adjustedTenure);
      }
    }
  }, [configurations, loanType]);

  // 4. Loan Type Change Handler
  const handleLoanTypeChange = (newType: LoanType) => {
    const config = configurations[newType];
    setLoanType(newType);

    let newPrincipal = principal;
    if (principal > 0) {
      if (principal < config.minAmount) newPrincipal = config.minAmount;
      if (principal > config.maxAmount) newPrincipal = config.maxAmount;
      setPrincipal(newPrincipal);
    }

    let newTenure = tenureMonths;
    if (tenureMonths > 0) {
      if (tenureMonths < config.minTenureMonths) newTenure = config.minTenureMonths;
      if (tenureMonths > config.maxTenureMonths) newTenure = config.maxTenureMonths;
      setTenureMonths(newTenure);
    }

    setErrors((prev) => ({
      ...prev,
      loanType: undefined,
      principal: undefined,
      tenureMonths: undefined,
    }));

    if (newPrincipal > 0 && newTenure > 0) {
      executeCalculation(newType, newPrincipal, newTenure);
    } else {
      setCalculationResult(null);
    }
  };

  // 5. Principal / Amount Change Handler
  const handlePrincipalChange = (newAmount: number) => {
    setPrincipal(newAmount);
    setErrors((prev) => ({ ...prev, principal: undefined }));
    if (newAmount > 0 && tenureMonths > 0) {
      executeCalculation(loanType, newAmount, tenureMonths);
    } else {
      setCalculationResult(null);
    }
  };

  // 6. Tenure Change Handler
  const handleTenureChange = (newTenure: number) => {
    setTenureMonths(newTenure);
    setErrors((prev) => ({ ...prev, tenureMonths: undefined }));
    if (principal > 0 && newTenure > 0) {
      executeCalculation(loanType, principal, newTenure);
    } else {
      setCalculationResult(null);
    }
  };

  // 7. Explicit "Calculate Estimated EMI" Button Handler
  const handleCalculate = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const validationErrors = validateCalculatorInput({
      loanType,
      principal,
      tenureMonths,
      monthlyIncome: monthlyIncome ? parseInt(monthlyIncome, 10) : undefined,
      existingEmi: existingEmi ? parseInt(existingEmi, 10) : undefined,
    }, configurations);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    // Explicitly recalculate
    const calculated = executeCalculation(loanType, principal, tenureMonths);

    // Provide visual feedback (pulse animation on result card)
    setJustCalculated(true);
    setTimeout(() => {
      setJustCalculated(false);
    }, 800);

    // Smooth scroll down to result on mobile screens
    if (window.innerWidth < 960) {
      const resultElement = document.getElementById('calculator-result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Check if the post-calculation prompt was previously dismissed in this session
    try {
      const isDismissed = sessionStorage.getItem('credzo_emi_prompt_dismissed') === 'true';
      if (!isDismissed && calculated && calculated.monthlyEmi > 0) {
        // Show polite popup after 500ms delay so the customer first clearly sees their EMI result
        setTimeout(() => {
          setShowEmiPrompt(true);
        }, 500);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const handleDismissPrompt = () => {
    setShowEmiPrompt(false);
    try {
      sessionStorage.setItem('credzo_emi_prompt_dismissed', 'true');
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const handleOpenRequestModalFromPrompt = () => {
    setShowEmiPrompt(false);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="loan-calculator-wrapper">
      <div className="loan-calculator-layout">
        {/* Left / Top Column: Inputs Form */}
        <div className="calculator-form-column">
          <div className="calculator-card">
            <div className="calculator-card-header">
              <h2 className="calculator-card-title">Loan Parameters</h2>
              <p className="calculator-card-subtitle">
                Enter your required loan amount and select tenure to view your estimated installment.
              </p>
            </div>

            <CalculatorInputs
              loanType={loanType}
              principal={principal}
              tenureMonths={tenureMonths}
              monthlyIncome={monthlyIncome}
              existingEmi={existingEmi}
              employmentType={employmentType}
              city={city}
              errors={errors}
              configurations={configurations}
              onLoanTypeChange={handleLoanTypeChange}
              onPrincipalChange={handlePrincipalChange}
              onTenureChange={handleTenureChange}
              onIncomeChange={(val) => {
                setMonthlyIncome(val);
                setErrors((prev) => ({ ...prev, monthlyIncome: undefined }));
              }}
              onExistingEmiChange={(val) => {
                setExistingEmi(val);
                setErrors((prev) => ({ ...prev, existingEmi: undefined }));
              }}
              onEmploymentTypeChange={setEmploymentType}
              onCityChange={setCity}
              onCalculate={handleCalculate}
            />
          </div>
        </div>

        {/* Right / Bottom Column: Calculated Results */}
        <div className="calculator-result-column">
          <CalculatorResult
            result={calculationResult}
            loanTypeLabel={configurations[loanType]?.label || LOAN_CONFIGURATIONS[loanType].label}
            loanType={loanType}
            monthlyIncome={monthlyIncome}
            existingEmi={existingEmi}
            employmentType={employmentType}
            city={city}
            justCalculated={justCalculated}
            onRequestCall={() => setIsRequestModalOpen(true)}
          />
        </div>
      </div>

      {/* Post-Calculation Request a Call Popup / Prompt */}
      {showEmiPrompt && calculationResult && calculationResult.monthlyEmi > 0 && (
        <div className="emi-prompt-backdrop" onClick={handleDismissPrompt} role="dialog" aria-modal="true">
          <div className="emi-prompt-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="emi-prompt-close-btn"
              onClick={handleDismissPrompt}
              aria-label="Close popup"
            >
              &times;
            </button>

            <div className="emi-prompt-header">
              <span className="emi-prompt-badge">Your Estimated EMI</span>
              <div className="emi-prompt-amount">
                {formatIndianCurrency(calculationResult.monthlyEmi)}
                <span className="emi-prompt-unit">/ month</span>
              </div>
              <p className="emi-prompt-summary">
                {configurations[loanType]?.label || 'Loan'} • {formatIndianCurrency(calculationResult.principal)} • {formatTenureDisplay(calculationResult.tenureMonths)}
              </p>
            </div>

            <div className="emi-prompt-body">
              <h4 className="emi-prompt-headline">Want help choosing the right loan?</h4>
              <p className="emi-prompt-text">
                Our team can call you and help you understand your lender options, eligibility, and rates. 100% Free & No Obligation.
              </p>
            </div>

            <div className="emi-prompt-actions">
              <button
                type="button"
                className="btn btn-primary btn-md btn-full-width"
                id="emi-prompt-request-btn"
                onClick={handleOpenRequestModalFromPrompt}
              >
                Request a Call →
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-full-width"
                id="emi-prompt-dismiss-btn"
                onClick={handleDismissPrompt}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Request Call Modal */}
      <RequestCallModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialService="loan"
        initialLoanType={loanType}
        initialRequestedAmount={principal || calculationResult?.principal}
        initialTenureMonths={tenureMonths || calculationResult?.tenureMonths}
        initialMonthlyIncome={monthlyIncome}
        initialExistingEmi={existingEmi}
        calculatedEmi={calculationResult?.monthlyEmi}
        title="Request a Call From Our Team"
        subtitle="Our loan specialist will call you to discuss your options."
      />
    </div>
  );
};
