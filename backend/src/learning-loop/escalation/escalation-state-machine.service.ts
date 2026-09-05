import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { EscalationStatus, EscalationSeverity, ActorType } from '../domain/enums';

@Injectable()
export class EscalationStateMachineService {
  private readonly logger = new Logger(EscalationStateMachineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: LearningLoopAuditService,
  ) {}

  /**
   * Triggers a new safety escalation event.
   */
  async triggerEscalation(
    userId: string,
    severity: EscalationSeverity,
    reason: string,
    triggerActorType: ActorType = ActorType.SYSTEM,
    triggerActorId: string = 'SYSTEM',
  ) {
    const escalation = await this.prisma.escalationEvent.create({
      data: {
        userId,
        severity,
        reason,
        status: EscalationStatus.OPEN,
      },
    });

    await this.auditService.logAction({
      userId,
      actorType: triggerActorType,
      actorId: triggerActorId,
      action: 'SAFETY_ESCALATED',
      stateBefore: null,
      stateAfter: { escalationId: escalation.id, status: EscalationStatus.OPEN, severity, reason },
    });

    this.logger.warn(`Safety Escalation triggered for user ${userId} [${severity}]: ${reason}`);
    return escalation;
  }

  /**
   * Transitions an escalation event's state.
   * STRICT POLICY: AI or STUDENT actors can NEVER resolve an escalation!
   */
  async transitionState(
    escalationId: string,
    targetStatus: EscalationStatus,
    actorType: ActorType,
    actorId: string,
    resolutionNotes?: string,
  ) {
    // Invariant: AI cannot dismiss or resolve safety escalations
    if (actorType === ActorType.AI) {
      throw new ForbiddenException(
        'Policy Violation: AI actors are strictly forbidden from dismissing or resolving safety escalations.',
      );
    }

    // Invariant: Students cannot resolve their own safety escalations
    if (actorType === ActorType.STUDENT) {
      throw new ForbiddenException(
        'Unauthorized: Students cannot modify or resolve safety escalations.',
      );
    }

    const escalation = await this.prisma.escalationEvent.findUnique({
      where: { id: escalationId },
    });

    if (!escalation) {
      throw new NotFoundException(`Escalation with ID ${escalationId} not found.`);
    }

    const currentStatus = escalation.status as EscalationStatus;

    // Validate Transition Matrix
    this.validateTransition(currentStatus, targetStatus, escalation.severity as EscalationSeverity);

    if (targetStatus === EscalationStatus.RESOLVED && (!resolutionNotes || resolutionNotes.trim().length === 0)) {
      throw new BadRequestException('Resolution notes are mandatory when resolving a safety escalation.');
    }

    const updated = await this.prisma.escalationEvent.update({
      where: { id: escalationId },
      data: {
        status: targetStatus,
        resolvedById: targetStatus === EscalationStatus.RESOLVED ? actorId : escalation.resolvedById,
        resolutionNotes: resolutionNotes ?? escalation.resolutionNotes,
      },
    });

    await this.auditService.logAction({
      userId: escalation.userId,
      actorType,
      actorId,
      action: `ESCALATION_${targetStatus}`,
      stateBefore: { status: currentStatus },
      stateAfter: { status: targetStatus, resolutionNotes },
    });

    this.logger.log(
      `Escalation ${escalationId} transitioned from ${currentStatus} to ${targetStatus} by ${actorType} ${actorId}`,
    );

    return updated;
  }

  /**
   * Validates state transition legality according to the safety matrix.
   */
  private validateTransition(
    current: EscalationStatus,
    target: EscalationStatus,
    severity: EscalationSeverity,
  ): void {
    if (current === target) {
      throw new BadRequestException(`Escalation is already in ${target} status.`);
    }

    if (current === EscalationStatus.RESOLVED) {
      throw new BadRequestException('A resolved escalation cannot be reopened through standard transition.');
    }

    if (current === EscalationStatus.OPEN) {
      // Critical escalations must go to IN_REVIEW first before RESOLVED
      if (target === EscalationStatus.RESOLVED && severity === EscalationSeverity.CRITICAL) {
        throw new BadRequestException(
          'CRITICAL escalations must be transitioned to IN_REVIEW before they can be marked RESOLVED.',
        );
      }
      if (target !== EscalationStatus.IN_REVIEW && target !== EscalationStatus.RESOLVED) {
        throw new BadRequestException(`Invalid transition from ${current} to ${target}.`);
      }
    } else if (current === EscalationStatus.IN_REVIEW) {
      if (target !== EscalationStatus.RESOLVED) {
        throw new BadRequestException(`Invalid transition from ${current} to ${target}.`);
      }
    }
  }
}
