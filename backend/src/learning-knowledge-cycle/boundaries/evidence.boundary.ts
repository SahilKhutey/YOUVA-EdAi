/**
 * YOUVA-EdAI: Evidence Boundary (LKC-0)
 * 
 * Boundary Interface: Connects KnowledgeLearningEvent to the repository's
 * existing evidence-processing and learning-loop pipelines.
 * 
 * Enforces:
 *   1. KNOWLEDGE ≠ LEARNING STATE ≠ LEARNING EVIDENCE
 *   2. Idempotent ingestion of student interaction logs
 */

import { KnowledgeLearningEvent } from '../contracts/learning-event.contract';

export interface IngestedEvidenceResult {
  evidenceLogId: string;
  isIdempotentReplay: boolean;
  status: 'PROCESSED' | 'PENDING_POLICY_GATE' | 'FLAGGED_INTERVENTION';
  evaluatedAt: Date;
}

export interface IEvidenceBoundary {
  /**
   * Dispatches a raw student learning event to the existing evidence processor.
   */
  processLearningEvent(
    event: KnowledgeLearningEvent,
  ): Promise<IngestedEvidenceResult>;
}
