export type ExperimentId = 
  | 'loan-eligibility'
  | 'loan-affordability'
  | 'education-loan'
  | 'loan-comparison';

export type ExperimentStatus = 'Scaffolded' | 'In Prototyping' | 'Review Ready' | 'Archived';

export interface ExperimentMetadata {
  id: ExperimentId;
  title: string;
  category: string;
  icon: string;
  description: string;
  status: ExperimentStatus;
  estimatedEffort: string;
  tags: string[];
}
