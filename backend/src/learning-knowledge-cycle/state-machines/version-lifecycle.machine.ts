/**
 * YOUVA-EdAI: Version Lifecycle State Machine (LKC-0)
 * 
 * Manages version-level progression:
 *   CREATED -> EDITED -> SUBMITTED -> REVIEWED -> PUBLISHED
 * 
 * Ensures historical versions remain immutable once published.
 */

import { VersionReviewStatus } from '../contracts/knowledge-object.contract';

export type VersionLifecycleEvent =
  | 'EDIT'
  | 'SUBMIT'
  | 'REVIEW_APPROVE'
  | 'REVIEW_REJECT'
  | 'PUBLISH';

export class VersionLifecycleStateMachine {
  private static readonly VALID_TRANSITIONS: Record<
    VersionReviewStatus,
    Partial<Record<VersionLifecycleEvent, VersionReviewStatus>>
  > = {
    DRAFT: {
      EDIT: 'DRAFT',
      SUBMIT: 'PENDING_REVIEW',
    },
    PENDING_REVIEW: {
      REVIEW_APPROVE: 'APPROVED',
      REVIEW_REJECT: 'REJECTED',
    },
    APPROVED: {
      PUBLISH: 'APPROVED', // Once published, version record is frozen
    },
    REJECTED: {
      EDIT: 'DRAFT',
    },
  };

  public static canTransition(
    currentStatus: VersionReviewStatus,
    event: VersionLifecycleEvent,
  ): boolean {
    return !!this.VALID_TRANSITIONS[currentStatus]?.[event];
  }

  public static transition(
    currentStatus: VersionReviewStatus,
    event: VersionLifecycleEvent,
  ): VersionReviewStatus {
    if (!this.canTransition(currentStatus, event)) {
      throw new Error(
        `Invalid version transition: Cannot apply event '${event}' to status '${currentStatus}'`,
      );
    }
    return this.VALID_TRANSITIONS[currentStatus][event]!;
  }
}
