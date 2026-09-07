export type LearningDataScope =
  | 'PROFILE_MINIMAL'
  | 'MASTERY'
  | 'ASSESSMENTS'
  | 'CREDENTIALS'
  | 'LEARNING_EVIDENCE'
  | 'TEACHER_VERIFICATIONS';

export type ShareStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED';

export interface CreateDataShareDto {
  recipientType: 'SCHOOL' | 'DISTRICT' | 'HIGHER_ED' | 'EXTERNAL_APP';
  recipientId: string;
  purpose: string;
  scopes: LearningDataScope[];
  expiresInDays?: number;
}
