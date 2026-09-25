export type SystemicInsightType =
  | 'SYSTEMIC_PREREQUISITE_GAP'
  | 'CURRICULUM_BOTTLENECK'
  | 'CROSS_COURSE_MISCONCEPTION'
  | 'INTERVENTION_INEFFECTIVENESS';

export type SystemicInsightStatus = 'DETECTED' | 'CONFIRMED' | 'DISMISSED' | 'RESOLVED';

export interface SystemicInsightDto {
  id: string;
  tenantId: string;
  type: SystemicInsightType;
  title: string;
  summary: string;
  confidence: number;
  status: SystemicInsightStatus;
  affectedCourses: string[];
  affectedLearnerCount: number;
  evidenceReferences: string[];
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemicInsightDetectionCriteria {
  minCourses: number;
  minLearners: number;
  failureRateThreshold: number;
  observationWindowDays: number;
}
