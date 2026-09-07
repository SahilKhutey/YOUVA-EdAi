import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Recursively canonicalizes nested structures and sorts object keys deterministically.
 */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    return Object.keys(record)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(record[key]);
        return result;
      }, {} as Record<string, unknown>);
  }

  return value;
}

/**
 * Computes deterministic SHA-256 cryptographic hash over canonicalized evidence.
 */
export function hashCanonicalEvidence(evidence: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(evidence)))
    .digest('hex');
}

@Injectable()
export class EvidenceIntegrityService {
  /**
   * Verifies the cryptographic integrity of evidence against its recorded provenance hash.
   */
  verify(evidence: unknown, expectedHash: string): boolean {
    const actualHash = hashCanonicalEvidence(evidence);

    if (actualHash !== expectedHash) {
      throw new ConflictException('Evidence integrity validation failed.');
    }

    return true;
  }
}
