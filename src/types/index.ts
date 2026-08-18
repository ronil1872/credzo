// Core Application Types (Stage 1 Foundation)

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

export interface NavItem {
  label: string;
  path: string;
}
