import { createHash, randomBytes } from 'crypto';

/**
 * Generates a cryptographically random share token (32 bytes base64url).
 * Invariant: Never persist the raw token. Only store the SHA-256 hash in the database.
 */
export function generateShareToken(): {
  token: string;
  hash: string;
} {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');

  return {
    token,
    hash,
  };
}

/**
 * Computes a deterministic canonical SHA-256 hash of a credential.
 * Used for external portable verification and tamper-detection.
 */
export function credentialIntegrityHash(credential: {
  id: string;
  title: string;
  credentialType: string;
  verificationLevel: string;
  issuedAt?: Date | null;
}): string {
  const canonical = JSON.stringify({
    id: credential.id,
    title: credential.title,
    credentialType: credential.credentialType,
    verificationLevel: credential.verificationLevel,
    issuedAt: credential.issuedAt ? credential.issuedAt.toISOString() : null,
  });

  return createHash('sha256').update(canonical).digest('hex');
}
