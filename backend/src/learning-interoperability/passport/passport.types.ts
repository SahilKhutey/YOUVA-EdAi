import * as crypto from 'crypto';

export interface LearningIdentity {
  subjectId: string;
  issuer: string;
  createdAt: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
}

export interface PassportAchievementDto {
  achievementType: 'CONCEPT' | 'COMPETENCY' | 'ASSESSMENT' | 'CREDENTIAL' | 'PROJECT' | 'TEACHER_VERIFICATION';
  title: string;
  description?: string;
  conceptId?: string;
  competencyId?: string;
  verificationStatus?: 'UNVERIFIED' | 'VERIFIED' | 'REVOKED';
  evidenceRefJson?: Record<string, any>;
}

/**
 * Generates an opaque, non-semantic, non-guessable subject ID.
 * Invariant: Never embed student name, age, grade, or school into public identifier.
 */
export function generateOpaqueSubjectId(tenantId: string, learnerId: string): string {
  const hash = crypto
    .createHmac('sha256', 'youva-salt')
    .update(`${tenantId}:${learnerId}`)
    .digest('hex')
    .slice(0, 32);
  return `sub_${hash}`;
}
