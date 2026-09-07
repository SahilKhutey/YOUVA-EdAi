export type PolicyScope = 'CLASS' | 'SCHOOL' | 'PLATFORM';

export type PolicyCategory =
  | 'CONTENT'
  | 'CURRICULUM'
  | 'AI'
  | 'ASSESSMENT'
  | 'OPERATIONS';

export interface PolicyRecommendation {
  scope: PolicyScope;
  category: PolicyCategory;
  recommendation: string;
  evidenceIds: string[];
  confidence: number;
  requiresHumanApproval: boolean;
}
