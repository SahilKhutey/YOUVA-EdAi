export type EvidenceSource =
  | 'STUDENT'
  | 'TEACHER'
  | 'AI'
  | 'ASSESSMENT'
  | 'SYSTEM'
  | 'EXTERNAL';

export interface EvidenceProvenanceDto {
  evidenceId: string;
  tenantId: string;
  learnerId: string;
  conceptId?: string;
  contentId?: string;
  curriculumId?: string;
  modelVersion?: string;
  agentVersion?: string;
  policyVersion?: string;
  teacherId?: string;
  interventionId?: string;
  experimentId?: string;
  source: EvidenceSource;
  evidencePayload: Record<string, unknown>;
  occurredAt?: string;
}

export interface EvidenceCorrectionDto {
  evidenceId: string;
  reason: string;
  replacementId?: string;
}
