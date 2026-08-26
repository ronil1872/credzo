export type ExperimentId = 
  | 'lowest-emi'
  | 'education-loan'
  | 'location-landing'
  | 'ad-landing';

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
