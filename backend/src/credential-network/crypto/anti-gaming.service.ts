import { Injectable, BadRequestException } from '@nestjs/common';
import { deduplicateEvidence } from '../domain/credential-eligibility';

@Injectable()
export class AntiGamingService {
  /**
   * Validates evidence integrity and screens for evidence duplication or farming.
   */
  validateEvidenceList(evidenceIds: string[], minimumRequired: number): string[] {
    if (!evidenceIds || evidenceIds.length === 0) {
      throw new BadRequestException('Evidence list cannot be empty.');
    }

    const unique = deduplicateEvidence(evidenceIds);

    if (unique.length < minimumRequired) {
      throw new BadRequestException(
        `Insufficient unique evidence records. Provided ${unique.length}, required ${minimumRequired}. Duplicate submissions detected.`,
      );
    }

    return unique;
  }

  /**
   * Asserts that evidence does not contain self-referential or invalid IDs.
   */
  assertValidEvidenceIds(evidenceIds: string[]) {
    for (const id of evidenceIds) {
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new BadRequestException(`Invalid evidence ID format: ${id}`);
      }
    }
  }
}
