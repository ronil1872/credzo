// Pure Calculation Engine & Central Loan Configuration for Credzo Finance
import {
  LoanType,
  LoanTypeOption,
  LoanCalculationInput,
  LoanCalculationResult,
  CalculatorValidationErrors,
} from '../types';

/**
 * Centralized configuration of illustrative interest rates, amount limits, and tenure options.
 * Modifying rates here updates calculations consistently across the entire application.
 */
export const LOAN_CONFIGURATIONS: Record<LoanType, LoanTypeOption> = {
  personal: {
    id: 'personal',
    label: 'Personal Loan',
    defaultRate: 12.0, // 12% p.a.
    minAmount: 25000,
    maxAmount: 5000000, // 50 Lakhs
    defaultAmount: 500000, // 5 Lakhs
    minTenureMonths: 6,
    maxTenureMonths: 60, // 5 Years
    defaultTenureMonths: 36, // 3 Years
    tenurePresets: [
      { label: '1 Yr', months: 12 },
      { label: '2 Yrs', months: 24 },
      { label: '3 Yrs', months: 36 },
      { label: '4 Yrs', months: 48 },
      { label: '5 Yrs', months: 60 },
    ],
  },
  business: {
    id: 'business',
    label: 'Business Loan',
    defaultRate: 14.0, // 14% p.a.
    minAmount: 100000,
    maxAmount: 10000000, // 1 Crore
    defaultAmount: 1000000, // 10 Lakhs
    minTenureMonths: 12,
    maxTenureMonths: 84, // 7 Years
    defaultTenureMonths: 36, // 3 Years
    tenurePresets: [
      { label: '1 Yr', months: 12 },
      { label: '2 Yrs', months: 24 },
      { label: '3 Yrs', months: 36 },
      { label: '5 Yrs', months: 60 },
      { label: '7 Yrs', months: 84 },
    ],
  },
  home: {
    id: 'home',
    label: 'Home Loan',
    defaultRate: 9.0, // 9% p.a.
    minAmount: 500000,
    maxAmount: 100000000, // 10 Crores
    defaultAmount: 3500000, // 35 Lakhs
    minTenureMonths: 12,
    maxTenureMonths: 360, // 30 Years
    defaultTenureMonths: 240, // 20 Years
    tenurePresets: [
      { label: '5 Yrs', months: 60 },
      { label: '10 Yrs', months: 120 },
      { label: '15 Yrs', months: 180 },
      { label: '20 Yrs', months: 240 },
      { label: '25 Yrs', months: 300 },
      { label: '30 Yrs', months: 360 },
    ],
  },
  lap: {
    id: 'lap',
    label: 'Loan Against Property',
    defaultRate: 10.0, // 10% p.a.
    minAmount: 500000,
    maxAmount: 50000000, // 5 Crores
    defaultAmount: 2500000, // 25 Lakhs
    minTenureMonths: 12,
    maxTenureMonths: 180, // 15 Years
    defaultTenureMonths: 120, // 10 Years
    tenurePresets: [
      { label: '3 Yrs', months: 36 },
      { label: '5 Yrs', months: 60 },
      { label: '7 Yrs', months: 84 },
      { label: '10 Yrs', months: 120 },
      { label: '15 Yrs', months: 180 },
    ],
  },
  gold: {
    id: 'gold',
    label: 'Gold Loan',
    defaultRate: 12.0, // 12% p.a.
    minAmount: 10000,
    maxAmount: 2500000, // 25 Lakhs
    defaultAmount: 200000, // 2 Lakhs
    minTenureMonths: 3,
    maxTenureMonths: 36, // 3 Years
    defaultTenureMonths: 12, // 1 Year
    tenurePresets: [
      { label: '3 Mos', months: 3 },
      { label: '6 Mos', months: 6 },
      { label: '1 Yr', months: 12 },
      { label: '2 Yrs', months: 24 },
      { label: '3 Yrs', months: 36 },
    ],
  },
  other: {
    id: 'other',
    label: 'Other Loans',
    defaultRate: 12.0, // 12% p.a.
    minAmount: 25000,
    maxAmount: 5000000, // 50 Lakhs
    defaultAmount: 500000, // 5 Lakhs
    minTenureMonths: 6,
    maxTenureMonths: 60, // 5 Years
    defaultTenureMonths: 36, // 3 Years
    tenurePresets: [
      { label: '1 Yr', months: 12 },
      { label: '2 Yrs', months: 24 },
      { label: '3 Yrs', months: 36 },
      { label: '4 Yrs', months: 48 },
      { label: '5 Yrs', months: 60 },
    ],
  },
};

/**
 * Dynamically generates intuitive tenure preset buttons based on min and max months.
 */
export function generateTenurePresets(
  minMonths: number,
  maxMonths: number,
  loanType?: LoanType
): Array<{ label: string; months: number }> {
  let candidates: Array<{ label: string; months: number }> = [];

  if (loanType === 'gold' || maxMonths <= 36) {
    candidates = [
      { label: '3 Mos', months: 3 },
      { label: '6 Mos', months: 6 },
      { label: '1 Yr', months: 12 },
      { label: '2 Yrs', months: 24 },
      { label: '3 Yrs', months: 36 },
    ];
  } else if (maxMonths <= 60) {
    candidates = [
      { label: '1 Yr', months: 12 },
      { label: '2 Yrs', months: 24 },
      { label: '3 Yrs', months: 36 },
      { label: '4 Yrs', months: 48 },
      { label: '5 Yrs', months: 60 },
    ];
  } else if (maxMonths <= 120) {
    candidates = [
      { label: '1 Yr', months: 12 },
      { label: '2 Yrs', months: 24 },
      { label: '3 Yrs', months: 36 },
      { label: '5 Yrs', months: 60 },
      { label: '7 Yrs', months: 84 },
      { label: '10 Yrs', months: 120 },
    ];
  } else {
    candidates = [
      { label: '3 Yrs', months: 36 },
      { label: '5 Yrs', months: 60 },
      { label: '7 Yrs', months: 84 },
      { label: '10 Yrs', months: 120 },
      { label: '15 Yrs', months: 180 },
      { label: '20 Yrs', months: 240 },
      { label: '25 Yrs', months: 300 },
      { label: '30 Yrs', months: 360 },
    ];
  }

  return candidates.filter(
    (preset) => preset.months >= minMonths && preset.months <= maxMonths
  );
}

/**
 * Merges active database-backed loan interest rates into loan configurations.
 * Only active loan products returned from the database are included in the resulting dictionary.
 */
export function mergeDatabaseLoanConfigurations(
  dbRates?: Array<{
    loan_type: string;
    label?: string;
    rate: number;
    min_amount?: number;
    max_amount?: number;
    default_amount?: number;
    min_tenure_months?: number;
    max_tenure_months?: number;
    default_tenure_months?: number;
  }> | null
): Record<LoanType, LoanTypeOption> {
  if (!dbRates || dbRates.length === 0) {
    return { ...LOAN_CONFIGURATIONS };
  }

  const activeConfigs: Partial<Record<LoanType, LoanTypeOption>> = {};
  for (const item of dbRates) {
    const key = item.loan_type as LoanType;
    const base = LOAN_CONFIGURATIONS[key] || {
      id: key,
      label: item.label || key.toUpperCase(),
      defaultRate: Number(item.rate),
      minAmount: 25000,
      maxAmount: 5000000,
      defaultAmount: 500000,
      minTenureMonths: 6,
      maxTenureMonths: 60,
      defaultTenureMonths: 36,
      tenurePresets: [],
    };

    const minTenure = item.min_tenure_months !== undefined ? Number(item.min_tenure_months) : base.minTenureMonths;
    const maxTenure = item.max_tenure_months !== undefined ? Number(item.max_tenure_months) : base.maxTenureMonths;

    activeConfigs[key] = {
      ...base,
      label: item.label || base.label,
      defaultRate: Number(item.rate),
      minAmount: item.min_amount !== undefined ? Number(item.min_amount) : base.minAmount,
      maxAmount: item.max_amount !== undefined ? Number(item.max_amount) : base.maxAmount,
      defaultAmount: item.default_amount !== undefined ? Number(item.default_amount) : base.defaultAmount,
      minTenureMonths: minTenure,
      maxTenureMonths: maxTenure,
      defaultTenureMonths: item.default_tenure_months !== undefined ? Number(item.default_tenure_months) : base.defaultTenureMonths,
      tenurePresets: generateTenurePresets(minTenure, maxTenure, key),
    };
  }
  return activeConfigs as Record<LoanType, LoanTypeOption>;
}

/**
 * Formats a number in the standard Indian currency numbering system (e.g. ₹5,00,000).
 */
export function formatIndianCurrency(amount: number, includeSymbol: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return includeSymbol ? '₹0' : '0';
  }

  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(rounded);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Formats tenure in a user-friendly format (e.g., "3 Years (36 Months)" or "6 Months").
 */
export function formatTenureDisplay(months: number): string {
  if (!months || months <= 0) return '0 Months';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths === 0) {
    return `${years} Year${years > 1 ? 's' : ''} (${months} Months)`;
  }
  if (years > 0 && remainingMonths > 0) {
    return `${years} Yr${years > 1 ? 's' : ''} ${remainingMonths} Mo${remainingMonths > 1 ? 's' : ''} (${months} Months)`;
  }
  return `${months} Month${months > 1 ? 's' : ''}`;
}

/**
 * Pure loan EMI calculation using standard reducing-balance formula:
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 *
 * Edge case r = 0 is handled safely via EMI = P / n.
 */
export function calculateLoan(input: LoanCalculationInput): LoanCalculationResult {
  const { principal, annualInterestRate, tenureMonths } = input;

  if (!principal || principal <= 0 || !tenureMonths || tenureMonths <= 0) {
    return {
      principal: Math.max(0, principal || 0),
      annualInterestRate: Math.max(0, annualInterestRate || 0),
      tenureMonths: Math.max(1, tenureMonths || 1),
      monthlyEmi: 0,
      totalInterest: 0,
      totalRepayment: 0,
      interestToPrincipalRatio: 0,
      principalPercentage: 100,
      interestPercentage: 0,
    };
  }

  // Edge case: 0% Interest Rate
  if (annualInterestRate <= 0) {
    const emi = Math.round(principal / tenureMonths);
    const totalRepayment = emi * tenureMonths;
    return {
      principal,
      annualInterestRate: 0,
      tenureMonths,
      monthlyEmi: emi,
      totalInterest: 0,
      totalRepayment,
      interestToPrincipalRatio: 0,
      principalPercentage: 100,
      interestPercentage: 0,
    };
  }

  // Standard Reducing Balance Calculation
  const monthlyRate = annualInterestRate / 12 / 100;
  const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
  const emiExact = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
  const monthlyEmi = Math.round(emiExact);

  const totalRepayment = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalRepayment - principal);
  const interestToPrincipalRatio = principal > 0 ? totalInterest / principal : 0;

  const principalPercentage = totalRepayment > 0 
    ? Math.min(100, Math.max(0, Math.round((principal / totalRepayment) * 100)))
    : 100;
  const interestPercentage = Math.max(0, 100 - principalPercentage);

  return {
    principal,
    annualInterestRate,
    tenureMonths,
    monthlyEmi,
    totalInterest,
    totalRepayment,
    interestToPrincipalRatio,
    principalPercentage,
    interestPercentage,
  };
}

/**
 * Validates calculator inputs before calculation/submission.
 */
export function validateCalculatorInput(
  input: Partial<LoanCalculationInput>,
  customConfigs?: Record<LoanType, LoanTypeOption>
): CalculatorValidationErrors {
  const configs = customConfigs || LOAN_CONFIGURATIONS;
  const errors: CalculatorValidationErrors = {};

  if (!input.loanType || !configs[input.loanType]) {
    errors.loanType = 'Please select a valid loan type.';
  }

  const config = input.loanType ? configs[input.loanType] : null;

  if (input.principal === undefined || input.principal === null || isNaN(input.principal)) {
    errors.principal = 'Please enter a valid loan amount.';
  } else if (input.principal <= 0) {
    errors.principal = 'Loan amount must be greater than zero.';
  } else if (config && input.principal < config.minAmount) {
    errors.principal = `Minimum loan amount for ${config.label} is ${formatIndianCurrency(config.minAmount)}.`;
  } else if (config && input.principal > config.maxAmount) {
    errors.principal = `Maximum loan amount for ${config.label} is ${formatIndianCurrency(config.maxAmount)}.`;
  }

  if (!input.tenureMonths || isNaN(input.tenureMonths)) {
    errors.tenureMonths = 'Please select a valid loan tenure.';
  } else if (input.tenureMonths <= 0) {
    errors.tenureMonths = 'Tenure must be at least 1 month.';
  } else if (config && (input.tenureMonths < config.minTenureMonths || input.tenureMonths > config.maxTenureMonths)) {
    errors.tenureMonths = `Tenure must be between ${config.minTenureMonths} and ${config.maxTenureMonths} months.`;
  }

  if (input.monthlyIncome !== undefined && input.monthlyIncome !== null && !isNaN(input.monthlyIncome)) {
    if (input.monthlyIncome < 0) {
      errors.monthlyIncome = 'Monthly income cannot be negative.';
    }
  }

  if (input.existingEmi !== undefined && input.existingEmi !== null && !isNaN(input.existingEmi)) {
    if (input.existingEmi < 0) {
      errors.existingEmi = 'Existing EMI cannot be negative.';
    }
  }

  return errors;
}
