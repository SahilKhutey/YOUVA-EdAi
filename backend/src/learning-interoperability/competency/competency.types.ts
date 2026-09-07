export interface EvidenceRequirement {
  id: string;
  description: string;
  minimumConfidence: number;
}

export interface Competency {
  id: string;
  key: string;
  name: string;
  description?: string;
  conceptIds: string[];
  evidenceRequirements: EvidenceRequirement[];
  level: 'FOUNDATIONAL' | 'DEVELOPING' | 'PROFICIENT' | 'ADVANCED';
}

export interface CompetencyAssessment {
  competencyId: string;
  evidenceIds: string[];
  requiredLevel: string;
  achievedLevel: string;
  confidence: number;
  teacherVerified: boolean;
}

/**
 * Competency Certification Rule:
 * Invariant: Conservative rule ensuring AI cannot autonomously certify competencies.
 * Requires non-empty evidence, high confidence (>= 0.8), and human teacher verification.
 */
export function canCertifyCompetency(assessment: CompetencyAssessment): boolean {
  return (
    assessment.evidenceIds.length > 0 &&
    assessment.confidence >= 0.8 &&
    assessment.teacherVerified === true
  );
}

export interface CredentialVerification {
  valid: boolean;
  credentialId: string;
  issuer: string;
  achievementType: string;
  issuedAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}
