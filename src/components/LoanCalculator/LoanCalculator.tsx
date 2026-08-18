import React, { useState, useMemo } from 'react';
import {
  LoanType,
  EmploymentType,
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
  // 1. Core State
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

  // 2. Loan Type Change Handler
  const handleLoanTypeChange = (newType: LoanType) => {
    const config = LOAN_CONFIGURATIONS[newType];
    setLoanType(newType);

    // Adjust principal if out of bounds for the new loan category
    if (principal < config.minAmount || principal > config.maxAmount) {
      setPrincipal(config.defaultAmount);
    }

    // Adjust tenure if out of bounds for the new category
    if (tenureMonths < config.minTenureMonths || tenureMonths > config.maxTenureMonths) {
      setTenureMonths(config.defaultTenureMonths);
    }

    setErrors((prev) => ({ ...prev, loanType: undefined }));
  };

  // 3. Computed Calculation Result (Real-time reactivity)
  const calculationResult = useMemo(() => {
    const config = LOAN_CONFIGURATIONS[loanType];
    return calculateLoan({
      loanType,
      principal,
      annualInterestRate: config.defaultRate,
      tenureMonths,
      monthlyIncome: monthlyIncome ? parseInt(monthlyIncome, 10) : undefined,
      existingEmi: existingEmi ? parseInt(existingEmi, 10) : undefined,
      employmentType,
      city,
    });
  }, [loanType, principal, tenureMonths, monthlyIncome, existingEmi, employmentType, city]);

  // 4. Handle Form Calculate Trigger
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
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

    // Smooth scroll to result on mobile viewports
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
            onPrincipalChange={(val) => {
              setPrincipal(val);
              setErrors((prev) => ({ ...prev, principal: undefined }));
            }}
            onTenureChange={(val) => {
              setTenureMonths(val);
              setErrors((prev) => ({ ...prev, tenureMonths: undefined }));
            }}
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

      {/* Right / Bottom Column: Live Calculated Results */}
      <div className="calculator-result-column">
        <CalculatorResult
          result={calculationResult}
          loanTypeLabel={LOAN_CONFIGURATIONS[loanType].label}
        />
      </div>
    </div>
  );
};
