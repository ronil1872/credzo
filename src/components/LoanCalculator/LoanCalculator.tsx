import React, { useState } from 'react';
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
} from '../../lib/calculator';
import { CalculatorInputs } from './CalculatorInputs';
import { CalculatorResult } from './CalculatorResult';
import './LoanCalculator.css';

export const LoanCalculator: React.FC = () => {
  // 1. Core Input State
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [principal, setPrincipal] = useState<number>(
    LOAN_CONFIGURATIONS.personal.defaultAmount
  );
  const [tenureMonths, setTenureMonths] = useState<number>(
    LOAN_CONFIGURATIONS.personal.defaultTenureMonths
  );
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [existingEmi, setExistingEmi] = useState<string>('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('salaried');
  const [city, setCity] = useState<string>('');
  const [errors, setErrors] = useState<CalculatorValidationErrors>({});
  
  // 2. Explicit Calculation Result State & Recalculation Visual Feedback
  const [calculationResult, setCalculationResult] = useState<LoanCalculationResult>(() => {
    const config = LOAN_CONFIGURATIONS.personal;
    return calculateLoan({
      loanType: 'personal',
      principal: config.defaultAmount,
      annualInterestRate: config.defaultRate,
      tenureMonths: config.defaultTenureMonths,
    });
  });
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  // 3. Helper to Recompute and Set Result
  const executeCalculation = (
    currentLoanType: LoanType,
    currentPrincipal: number,
    currentTenure: number
  ) => {
    const config = LOAN_CONFIGURATIONS[currentLoanType];
    const newResult = calculateLoan({
      loanType: currentLoanType,
      principal: currentPrincipal,
      annualInterestRate: config.defaultRate,
      tenureMonths: currentTenure,
      monthlyIncome: monthlyIncome ? parseInt(monthlyIncome, 10) : undefined,
      existingEmi: existingEmi ? parseInt(existingEmi, 10) : undefined,
      employmentType,
      city,
    });
    setCalculationResult(newResult);
  };

  // 4. Loan Type Change Handler
  const handleLoanTypeChange = (newType: LoanType) => {
    const config = LOAN_CONFIGURATIONS[newType];
    setLoanType(newType);

    let newPrincipal = principal;
    if (principal < config.minAmount || principal > config.maxAmount) {
      newPrincipal = config.defaultAmount;
      setPrincipal(newPrincipal);
    }

    let newTenure = tenureMonths;
    if (tenureMonths < config.minTenureMonths || tenureMonths > config.maxTenureMonths) {
      newTenure = config.defaultTenureMonths;
      setTenureMonths(newTenure);
    }

    setErrors((prev) => ({
      ...prev,
      loanType: undefined,
      principal: undefined,
      tenureMonths: undefined,
    }));

    executeCalculation(newType, newPrincipal, newTenure);
  };

  // 5. Principal / Amount Change Handler
  const handlePrincipalChange = (newAmount: number) => {
    setPrincipal(newAmount);
    setErrors((prev) => ({ ...prev, principal: undefined }));
    if (newAmount > 0) {
      executeCalculation(loanType, newAmount, tenureMonths);
    }
  };

  // 6. Tenure Change Handler
  const handleTenureChange = (newTenure: number) => {
    setTenureMonths(newTenure);
    setErrors((prev) => ({ ...prev, tenureMonths: undefined }));
    if (newTenure > 0) {
      executeCalculation(loanType, principal, newTenure);
    }
  };

  // 7. Explicit "Calculate Estimated EMI" Button & Form Submission Handler
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
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    // Explicitly recalculate using the exact current state values
    executeCalculation(loanType, principal, tenureMonths);

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
  };

  return (
    <div className="loan-calculator-layout">
      {/* Left / Top Column: Inputs Form */}
      <div className="calculator-form-column">
        <div className="calculator-card">
          <div className="calculator-card-header">
            <h2 className="calculator-card-title">Loan Parameters</h2>
            <p className="calculator-card-subtitle">
              Adjust loan amount and tenure to view your estimated installment.
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
          loanTypeLabel={LOAN_CONFIGURATIONS[loanType].label}
          justCalculated={justCalculated}
        />
      </div>
    </div>
  );
};
