import { Injectable } from '@nestjs/common';
import { ContentTrust, EvidenceTrust } from './trust.types';

/**
 * Calculates decomposed evidence trust score from provenance, integrity, completeness, and consistency.
 * Note: Trust score is strictly an analytical signal and NEVER substitutes for RBAC or access control.
 */
export function evidenceTrustScore(input: EvidenceTrust): number {
  return (
    input.provenance * 0.30 +
    input.integrity * 0.30 +
    input.completeness * 0.20 +
    input.consistency * 0.20
  );
}

/**
 * Calculates decomposed content trust score across curriculum alignment, safety, accessibility, teacher reviews.
 */
export function contentTrustScore(input: ContentTrust): number {
  return (
    input.curriculumAlignment * 0.20 +
    input.safety * 0.25 +
    input.accessibility * 0.15 +
    input.teacherReview * 0.15 +
    input.effectiveness * 0.15 +
    input.provenance * 0.10
  );
}

@Injectable()
export class TrustService {
  /**
   * Evaluates evidence trust.
   */
  evaluateEvidenceTrust(input: EvidenceTrust): number {
    return Number(evidenceTrustScore(input).toFixed(4));
  }

  /**
   * Evaluates content trust.
   */
  evaluateContentTrust(input: ContentTrust): number {
    return Number(contentTrustScore(input).toFixed(4));
  }
}
