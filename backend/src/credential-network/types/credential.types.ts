export type CredentialType =
  | 'SKILL'
  | 'COMPETENCY'
  | 'COURSE'
  | 'PROJECT'
  | 'ASSESSMENT'
  | 'MICROCREDENTIAL'
  | 'TEACHER_VERIFIED'
  | 'INSTITUTION_VERIFIED';

export enum VerificationLevel {
  SELF_REPORTED = 'SELF_REPORTED',
  AI_SUPPORTED = 'AI_SUPPORTED',
  TEACHER_VERIFIED = 'TEACHER_VERIFIED',
  INSTITUTION_VERIFIED = 'INSTITUTION_VERIFIED',
  EXTERNALLY_VERIFIED = 'EXTERNALLY_VERIFIED',
}

export type CredentialStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'REVOKED';

export interface CredentialEligibility {
  eligible: boolean;
  reasons: string[];
  evidenceCount: number;
  minimumMastery?: number;
  currentMastery?: number;
  humanVerificationRequired: boolean;
}

export interface PassportSkill {
  skillId: string;
  skillName: string;
  status: 'DEMONSTRATED' | 'IN_PROGRESS' | 'NOT_VERIFIED';
  verificationLevel: string;
  credentialIds: string[];
}

export interface PassportCredential {
  id: string;
  title: string;
  type: string;
  verificationLevel: string;
  issuedAt?: string;
  status?: string;
}

export interface SkillsPassport {
  learnerId: string;
  generatedAt: string;
  version: number;
  skills: PassportSkill[];
  credentials: PassportCredential[];
}

export interface CredentialEvidence {
  evidenceId: string;
  evidenceType:
    | 'PRACTICE'
    | 'ASSESSMENT'
    | 'PROJECT'
    | 'TEACHER_OBSERVATION'
    | 'CLASSROOM';
  recordedAt: string;
  verified: boolean;
}

export interface PortableCredential {
  format: string;
  version: string;
  credentialId: string;
  achievement: {
    name: string;
    description?: string;
    skills: string[];
  };
  issuer: {
    id?: string;
    name: string;
  };
  verification: {
    level: string;
    status: string;
  };
  issuedAt?: string;
  expiresAt?: string;
}

export interface CredentialExporter {
  readonly format: string;
  export(credential: any): PortableCredential;
}

export const P15EventTypes = {
  CREDENTIAL_CREATED: 'credential.created',
  CREDENTIAL_SUBMITTED: 'credential.submitted',
  CREDENTIAL_APPROVED: 'credential.approved',
  CREDENTIAL_ISSUED: 'credential.issued',
  CREDENTIAL_ACTIVATED: 'credential.activated',
  CREDENTIAL_SUSPENDED: 'credential.suspended',
  CREDENTIAL_REVOKED: 'credential.revoked',
  CREDENTIAL_EXPIRED: 'credential.expired',
  CREDENTIAL_VERIFIED: 'credential.verified',
  CREDENTIAL_SHARED: 'credential.shared',
  PASSPORT_GENERATED: 'skills.passport.generated',
} as const;
