const ACTION_TRANSITIONS: Record<string, string[]> = {
  PROPOSED: ['POLICY_REVIEW', 'DENIED'],
  POLICY_REVIEW: ['APPROVED', 'DENIED'],
  APPROVED: ['EXECUTING', 'DENIED'],
  EXECUTING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['EVALUATING'],
  EVALUATING: [
    'SUCCESS',
    'PARTIAL',
    'ROLLED_BACK',
  ],
};

/**
 * Validates and executes governed action lifecycle transitions.
 */
export function transitionAction(
  current: string,
  next: string,
): string {
  if (!ACTION_TRANSITIONS[current]?.includes(next)) {
    throw new Error(
      `Invalid action transition: ${current} -> ${next}`,
    );
  }

  return next;
}
