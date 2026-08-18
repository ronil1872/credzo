// Core Application Types (LoanCheck / Credzo Finance)

export type LoanType = 
  | 'personal'
  | 'business'
  | 'home'
  | 'lap'
  | 'gold'
  | 'other';

export type EmploymentType = 
  | 'salaried'
  | 'self_employed'
  | 'business';

export interface LoanTypeOption {
  id: LoanType;
  label: string;
  defaultRate: number; // Illustrative annual rate in %
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  defaultTenureMonths: number;
  tenurePresets: { label: string; months: number }[];
}

export interface LoanCalculationInput {
  loanType: LoanType;
  principal: number;
  annualInterestRate: number; // In percentage, e.g., 12 for 12%
  tenureMonths: number;
  monthlyIncome?: number;
  existingEmi?: number;
  employmentType?: EmploymentType;
  city?: string;
}

export interface LoanCalculationResult {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  interestToPrincipalRatio: number;
  principalPercentage: number;
  interestPercentage: number;
}

export interface CalculatorValidationErrors {
  loanType?: string;
  principal?: string;
  tenureMonths?: string;
  monthlyIncome?: string;
  existingEmi?: string;
  employmentType?: string;
  city?: string;
}

export interface NavItem {
  label: string;
  path: string;
}
