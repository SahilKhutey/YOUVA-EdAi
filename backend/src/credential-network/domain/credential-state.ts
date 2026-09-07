const CREDENTIAL_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['ISSUED'],
  ISSUED: ['ACTIVE'],
  ACTIVE: ['SUSPENDED', 'EXPIRED', 'REVOKED'],
  SUSPENDED: ['ACTIVE', 'REVOKED'],
  EXPIRED: [],
  REVOKED: [],
};

/**
 * Validates and executes governed credential lifecycle state transitions.
 * Invariant: Revoked or expired credentials can never reactivate. Direct jumps from DRAFT to ISSUED are blocked.
 */
export function transitionCredential(
  current: string,
  next: string,
): string {
  if (!CREDENTIAL_TRANSITIONS[current]?.includes(next)) {
    throw new Error(
      `Invalid credential transition: ${current} -> ${next}`,
    );
  }

  return next;
}
