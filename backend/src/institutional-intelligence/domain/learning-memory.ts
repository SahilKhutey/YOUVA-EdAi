export type MemoryType =
  | 'INTERVENTION_EFFECTIVENESS'
  | 'PREREQUISITE_COHESION'
  | 'COGNITIVE_LOAD_PATTERN';

export type MemoryStatus = 'ACTIVE' | 'REVALIDATING' | 'EXPIRED' | 'SUPERSEDED';

export interface LearningMemoryDto {
  id: string;
  tenantId: string;
  memoryType: MemoryType;
  statement: string;
  confidence: number;
  status: MemoryStatus;
  evidenceReferences: string[];
  createdAt: Date;
  expiresAt?: Date;
}
