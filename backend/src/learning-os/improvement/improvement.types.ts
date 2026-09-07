export enum ImprovementStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  PROPOSED = 'PROPOSED',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  EXPERIMENTING = 'EXPERIMENTING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ROLLED_OUT = 'ROLLED_OUT',
  ROLLED_BACK = 'ROLLED_BACK',
}

export type ImprovementSource =
  | 'ANALYTICS'
  | 'TEACHER'
  | 'AI_EVALUATION'
  | 'OPERATIONS'
  | 'RESEARCH';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ImprovementProposalDto {
  tenantId?: string;
  source: ImprovementSource;
  title: string;
  description: string;
  hypothesis: string;
  expectedOutcome: string;
  riskLevel: RiskLevel;
  affectedSystems: string[];
  rollbackPlan: string;
  proposedBy?: string;
}

export interface OpportunitySignal {
  metric: string;
  baseline: number;
  current: number;
  direction: 'IMPROVEMENT' | 'REGRESSION' | 'NEUTRAL';
  confidence: number;
}
