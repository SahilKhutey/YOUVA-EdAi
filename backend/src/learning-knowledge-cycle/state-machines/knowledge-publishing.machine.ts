/**
 * YOUVA-EdAI: Knowledge Publishing State Machine (LKC-0)
 * 
 * Enforces the canonical lifecycle:
 *   DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED
 * 
 * Invariant: Direct transition DRAFT -> PUBLISHED is prohibited
 * unless an authorized bypass is explicitly granted.
 */

import { KnowledgeObjectStatus } from '../contracts/knowledge-object.contract';

export type KnowledgeEvent =
  | 'SUBMIT_FOR_REVIEW'
  | 'REQUEST_CHANGES'
  | 'APPROVE'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'UNARCHIVE';

export interface TransitionContext {
  actorRole: 'TEACHER' | 'REVIEWER' | 'ADMIN' | 'SYSTEM';
  isAuthorizedBypass?: boolean;
}

export class KnowledgePublishingStateMachine {
  private static readonly VALID_TRANSITIONS: Record<
    KnowledgeObjectStatus,
    Partial<Record<KnowledgeEvent, KnowledgeObjectStatus>>
  > = {
    DRAFT: {
      SUBMIT_FOR_REVIEW: 'IN_REVIEW',
      // DRAFT -> PUBLISHED only allowed via explicit bypass
    },
    IN_REVIEW: {
      APPROVE: 'APPROVED',
      REQUEST_CHANGES: 'DRAFT',
    },
    APPROVED: {
      PUBLISH: 'PUBLISHED',
      REQUEST_CHANGES: 'DRAFT',
    },
    PUBLISHED: {
      ARCHIVE: 'ARCHIVED',
    },
    ARCHIVED: {
      UNARCHIVE: 'DRAFT',
    },
  };

  /**
   * Validates whether a state transition is legal and permitted for the actor.
   */
  public static canTransition(
    currentStatus: KnowledgeObjectStatus,
    event: KnowledgeEvent,
    context: TransitionContext,
  ): boolean {
    // Special bypass rule: Admins can directly publish from DRAFT if explicitly flagged
    if (
      currentStatus === 'DRAFT' &&
      event === 'PUBLISH' &&
      context.actorRole === 'ADMIN' &&
      context.isAuthorizedBypass === true
    ) {
      return true;
    }

    const possibleNextStatus = this.VALID_TRANSITIONS[currentStatus]?.[event];
    if (!possibleNextStatus) {
      return false;
    }

    // Role-based transition guard
    switch (event) {
      case 'SUBMIT_FOR_REVIEW':
        return ['TEACHER', 'ADMIN'].includes(context.actorRole);
      case 'APPROVE':
      case 'REQUEST_CHANGES':
        return ['REVIEWER', 'ADMIN'].includes(context.actorRole);
      case 'PUBLISH':
        return ['ADMIN', 'SYSTEM', 'TEACHER'].includes(context.actorRole);
      case 'ARCHIVE':
      case 'UNARCHIVE':
        return ['ADMIN', 'TEACHER'].includes(context.actorRole);
      default:
        return false;
    }
  }

  /**
   * Computes the next status or throws an error if invalid.
   */
  public static transition(
    currentStatus: KnowledgeObjectStatus,
    event: KnowledgeEvent,
    context: TransitionContext,
  ): KnowledgeObjectStatus {
    if (!this.canTransition(currentStatus, event, context)) {
      throw new Error(
        `Invalid knowledge transition: Cannot apply event '${event}' to status '${currentStatus}' for role '${context.actorRole}'`,
      );
    }

    if (currentStatus === 'DRAFT' && event === 'PUBLISH' && context.isAuthorizedBypass) {
      return 'PUBLISHED';
    }

    return this.VALID_TRANSITIONS[currentStatus][event]!;
  }
}
