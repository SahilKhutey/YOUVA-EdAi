export type SystemOptimizationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SystemicAction {
  id: string;
  type:
    | 'REVIEW_PREREQUISITE'
    | 'CREATE_REMEDIATION'
    | 'REVISE_ASSESSMENT'
    | 'REVISE_CURRICULUM_PATH'
    | 'UPDATE_POLICY';
  targetCourseIds: string[];
  targetKnowledgeIds: string[];
  description: string;
  status: 'PENDING' | 'EXECUTED';
}

export interface SystemOptimizationPlanDto {
  id: string;
  tenantId: string;
  objective: string;
  status: SystemOptimizationStatus;
  policyVersion: string;
  ownerId: string;
  approvedBy?: string;
  actions: SystemicAction[];
  createdAt: Date;
  updatedAt: Date;
}
