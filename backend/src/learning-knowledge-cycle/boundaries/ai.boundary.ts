/**
 * YOUVA-EdAI: AI Boundary & Guardrails (LKC-0)
 * 
 * Boundary Interface & Policy Guard:
 * Ensures AI services (Authoring Copilot, AI Mentor, Recommendation Engine)
 * consume and enrich canonical knowledge without bypassing human review.
 * 
 * Invariants:
 *   1. NEVER AI -> DIRECT DATABASE PUBLISH for governed educational content.
 *   2. AI-generated versions must carry `sourceType: 'AI'` and `reviewStatus: 'PENDING_REVIEW'`.
 *   3. AI recommendations cannot unilaterally certify student mastery.
 */

import { KnowledgeVersion } from '../contracts/knowledge-object.contract';

export interface AiEnrichmentProposal {
  knowledgeObjectId: string;
  targetArtifactType: 'EXPLANATION' | 'EXAMPLE' | 'QUESTION' | 'HINT' | 'MISCONCEPTION';
  proposedContent: Record<string, unknown>;
  modelIdentifier: string;
  confidenceScore: number;
  rationale?: string;
}

export interface IAiBoundary {
  /**
   * Submits an AI-generated enrichment draft.
   * Enforces that the draft enters PENDING_REVIEW and is tagged as sourceType 'AI'.
   */
  submitAiProposal(
    proposal: AiEnrichmentProposal,
    tenantId: string,
  ): Promise<KnowledgeVersion>;

  /**
   * Asserts that a version to be published was not directly authored by AI
   * without verified human teacher approval.
   */
  assertAiSafetyGuard(version: KnowledgeVersion): void;
}

export class AiSafetyGuard {
  public static verifyCanPublish(version: KnowledgeVersion): void {
    if (version.sourceType === 'AI' && version.reviewStatus !== 'APPROVED') {
      throw new Error(
        `AI Safety Violation: AI-generated version ${version.version} of knowledge object ${version.knowledgeObjectId} cannot be published without explicit human review approval.`,
      );
    }
  }
}
