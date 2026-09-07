import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../auth/role.enum';

export enum EscalationStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
}

@Injectable()
export class EscalationStateMachineService {
  private readonly validTransitions: Record<EscalationStatus, EscalationStatus[]> = {
    [EscalationStatus.OPEN]: [EscalationStatus.ASSIGNED, EscalationStatus.CLOSED],
    [EscalationStatus.ASSIGNED]: [EscalationStatus.REVIEWING, EscalationStatus.OPEN],
    [EscalationStatus.REVIEWING]: [EscalationStatus.RESOLVED, EscalationStatus.ESCALATED],
    [EscalationStatus.ESCALATED]: [EscalationStatus.RESOLVED, EscalationStatus.CLOSED],
    [EscalationStatus.RESOLVED]: [], // Terminal state
    [EscalationStatus.CLOSED]: [],   // Terminal state
  };

  /**
   * Validates if a transition from fromStatus to toStatus is permitted.
   */
  canTransition(fromStatus: EscalationStatus, toStatus: EscalationStatus): boolean {
    const allowed = this.validTransitions[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Asserts transition validity including human-in-the-loop authorization.
   * AI/System actors and students are prohibited from resolving or closing escalations.
   */
  assertTransitionAllowed(
    fromStatus: EscalationStatus,
    toStatus: EscalationStatus,
    actorRole?: string,
  ): void {
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new BadRequestException(
        `Invalid escalation status transition from ${fromStatus} to ${toStatus}`,
      );
    }

    if (
      toStatus === EscalationStatus.RESOLVED ||
      toStatus === EscalationStatus.CLOSED
    ) {
      if (!actorRole || (actorRole !== Role.TEACHER && actorRole !== Role.ADMIN)) {
        throw new ForbiddenException(
          'Only authorized human educators (TEACHER or ADMIN) can resolve or close safety escalations',
        );
      }
    }

    if (actorRole === Role.STUDENT) {
      throw new ForbiddenException('Students are not permitted to modify safety escalations');
    }
  }
}
