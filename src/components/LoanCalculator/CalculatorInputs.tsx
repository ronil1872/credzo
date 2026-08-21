import React from 'react';
import {
  LoanType,
  EmploymentType,
  CalculatorValidationErrors,
} from '../../types';
import {
  LOAN_CONFIGURATIONS,
  formatIndianCurrency,
  formatTenureDisplay,
} from '../../lib/calculator';

interface CalculatorInputsProps {
  loanType: LoanType;
  principal: number;
  tenureMonths: number;
  monthlyIncome: string;
  existingEmi: string;
  employmentType: EmploymentType;
  city: string;
  errors: CalculatorValidationErrors;
  onLoanTypeChange: (type: LoanType) => void;
  onPrincipalChange: (amount: number) => void;
  onTenureChange: (months: number) => void;
  onIncomeChange: (income: string) => void;
  onExistingEmiChange: (emi: string) => void;
  onEmploymentTypeChange: (emp: EmploymentType) => void;
  onCityChange: (city: string) => void;
  onCalculate: (e: React.FormEvent) => void;
}

export const CalculatorInputs: React.FC<CalculatorInputsProps> = ({
  loanType,
  principal,
  tenureMonths,
  monthlyIncome,
  existingEmi,
  employmentType,
  city,
  errors,
  onLoanTypeChange,
  onPrincipalChange,
  onTenureChange,
  onIncomeChange,
  onExistingEmiChange,
  onEmploymentTypeChange,
  onCityChange,
  onCalculate,
}) => {
  const currentConfig = LOAN_CONFIGURATIONS[loanType];

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? parseInt(rawVal, 10) : 0;
    onPrincipalChange(num);
  };

  const handleTenureSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const months = parseInt(e.target.value, 10);
    onTenureChange(months);
  };

  return (
    <form className="calculator-inputs-form" onSubmit={onCalculate} noValidate>
      {/* 1. Loan Type Selector */}
      <div className="input-group">
        <label className="input-label" id="loan-type-label">
          <span>Select Loan Type</span>
          <span className="rate-badge">
            Illustrative rate: {currentConfig.defaultRate}% p.a.
          </span>
        </label>
        <div className="loan-types-pill-grid" role="radiogroup" aria-labelledby="loan-type-label">
          {Object.values(LOAN_CONFIGURATIONS).map((config) => {
            const isSelected = loanType === config.id;
            return (
              <button
                type="button"
                key={config.id}
                role="radio"
                aria-checked={isSelected}
                className={`loan-type-pill ${isSelected ? 'selected' : ''}`}
                onClick={() => onLoanTypeChange(config.id)}
              >
                <span className="pill-title">{config.label}</span>
                <span className="pill-rate">{config.defaultRate}% p.a.</span>
              </button>
            );
          })}
        </div>
        {errors.loanType && <span className="input-error-msg">{errors.loanType}</span>}
      </div>

      {/* 2. Loan Amount */}
      <div className="input-group">
        <div className="label-with-value">
          <label htmlFor="loan-amount-input" className="input-label">
            Loan Amount
          </label>
          <span className="highlight-value">
            {principal > 0 ? formatIndianCurrency(principal) : '—'}
          </span>
        </div>

        <div className={`currency-input-group currency-input-group-lg ${errors.principal ? 'input-error' : ''}`}>
          <span className="currency-prefix" aria-hidden="true">₹</span>
          <input
            id="loan-amount-input"
            type="text"
            inputMode="numeric"
            className="currency-input-field currency-amount-field"
            value={principal > 0 ? principal.toString() : ''}
            placeholder="Enter loan amount"
            onChange={handleAmountInputChange}
          />
        </div>

        {/* Range Slider */}
        <input
          type="range"
          className="range-slider"
          min={currentConfig.minAmount}
          max={currentConfig.maxAmount}
          step={Math.max(10000, (currentConfig.maxAmount - currentConfig.minAmount) / 100)}
          value={principal > 0 ? Math.min(currentConfig.maxAmount, Math.max(currentConfig.minAmount, principal)) : currentConfig.minAmount}
          onChange={(e) => onPrincipalChange(parseInt(e.target.value, 10))}
          aria-label="Loan amount slider"
        />

        <div className="range-limits">
          <span>Min: {formatIndianCurrency(currentConfig.minAmount)}</span>
          <span>Max: {formatIndianCurrency(currentConfig.maxAmount)}</span>
        </div>
        {errors.principal && <span className="input-error-msg">{errors.principal}</span>}
      </div>

      {/* 3. Loan Tenure */}
      <div className="input-group">
        <div className="label-with-value">
          <label htmlFor="loan-tenure-slider" className="input-label">
            Loan Tenure
          </label>
          <span className="highlight-value">
            {tenureMonths > 0 ? formatTenureDisplay(tenureMonths) : 'Select tenure'}
          </span>
        </div>

        {/* Tenure Presets */}
        <div className="tenure-presets-row">
          {currentConfig.tenurePresets.map((preset) => (
            <button
              type="button"
              key={preset.months}
              className={`preset-btn ${tenureMonths === preset.months ? 'selected' : ''}`}
              onClick={() => onTenureChange(preset.months)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Range Slider */}
        <input
          id="loan-tenure-slider"
          type="range"
          className="range-slider"
          min={currentConfig.minTenureMonths}
          max={currentConfig.maxTenureMonths}
          step={loanType === 'gold' ? 3 : 6}
          value={tenureMonths > 0 ? Math.min(currentConfig.maxTenureMonths, Math.max(currentConfig.minTenureMonths, tenureMonths)) : currentConfig.minTenureMonths}
          onChange={handleTenureSliderChange}
          aria-label="Loan tenure slider"
        />

        <div className="range-limits">
          <span>{currentConfig.minTenureMonths} Mos</span>
          <span>{currentConfig.maxTenureMonths} Mos ({Math.floor(currentConfig.maxTenureMonths / 12)} Yrs)</span>
        </div>
        {errors.tenureMonths && <span className="input-error-msg">{errors.tenureMonths}</span>}
      </div>

      {/* 4. Customer Profile Inputs (Informational) */}
      <div className="optional-fields-section">
        <div className="section-divider-title">
          <span>Applicant Profile (Optional for Estimation)</span>
        </div>

        <div className="form-grid-2">
          {/* Monthly Income */}
          <div className="input-group">
            <label htmlFor="monthly-income" className="input-label">
              Monthly Income (₹)
            </label>
            <div className={`currency-input-group ${errors.monthlyIncome ? 'input-error' : ''}`}>
              <span className="currency-prefix" aria-hidden="true">₹</span>
              <input
                id="monthly-income"
                type="text"
                inputMode="numeric"
                className="currency-input-field"
                placeholder="e.g. 50,000"
                value={monthlyIncome}
                onChange={(e) => onIncomeChange(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            {errors.monthlyIncome && <span className="input-error-msg">{errors.monthlyIncome}</span>}
          </div>

          {/* Existing EMI */}
          <div className="input-group">
            <label htmlFor="existing-emi" className="input-label">
              Existing Monthly EMI (₹)
            </label>
            <div className={`currency-input-group ${errors.existingEmi ? 'input-error' : ''}`}>
              <span className="currency-prefix" aria-hidden="true">₹</span>
              <input
                id="existing-emi"
                type="text"
                inputMode="numeric"
                className="currency-input-field"
                placeholder="e.g. 10,000"
                value={existingEmi}
                onChange={(e) => onExistingEmiChange(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            {errors.existingEmi && <span className="input-error-msg">{errors.existingEmi}</span>}
          </div>
        </div>

        <div className="form-grid-2">
          {/* Employment Type */}
          <div className="input-group">
            <label htmlFor="employment-type" className="input-label">
              Employment Type
            </label>
            <select
              id="employment-type"
              className="select-input"
              value={employmentType}
              onChange={(e) => onEmploymentTypeChange(e.target.value as EmploymentType)}
            >
              <option value="salaried">Salaried Employee</option>
              <option value="self_employed">Self-Employed Professional</option>
              <option value="business">Business Owner / Trader</option>
            </select>
          </div>

          {/* City */}
          <div className="input-group">
            <label htmlFor="city-input" className="input-label">
              City
            </label>
            <input
              id="city-input"
              type="text"
              className="text-input"
              placeholder="e.g. Mumbai, Delhi, Bengaluru"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Recalculate / Update Action */}
      <div className="calculator-action-wrapper">
        <button type="submit" className="btn btn-primary btn-lg btn-full-width">
          Calculate Estimated EMI &rarr;
        </button>
      </div>
    </form>
  );
};
