import { Injectable } from '@nestjs/common';
import { AdaptiveCandidate } from '../decision/decision.types';

@Injectable()
export class CandidateDeduplicator {
  /**
   * Deduplicates candidates by knowledgeId + action.
   * Merges reason codes and keeps the highest priority candidate.
   */
  deduplicate(candidates: AdaptiveCandidate[]): AdaptiveCandidate[] {
    const map = new Map<string, AdaptiveCandidate>();

    for (const cand of candidates) {
      const key = `${cand.knowledgeId}:${cand.action}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...cand, reasonCodes: [...cand.reasonCodes] });
      } else {
        // Merge unique reason codes
        const mergedReasons = Array.from(
          new Set([...existing.reasonCodes, ...cand.reasonCodes]),
        );

        // Keep highest priority and required flag
        const isRequired = existing.required || cand.required;
        const highestPriority = Math.max(existing.priority, cand.priority);
        const highestConfidence = Math.max(
          existing.confidence ?? 0.5,
          cand.confidence ?? 0.5,
        );

        map.set(key, {
          ...existing,
          required: isRequired,
          priority: highestPriority,
          confidence: highestConfidence,
          reasonCodes: mergedReasons,
        });
      }
    }

    return Array.from(map.values());
  }
}
