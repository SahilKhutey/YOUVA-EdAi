import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SafetyDecision,
  SafetyPolicyService,
} from '../safety/safety-policy.service';
import {
  EscalationStateMachineService,
  EscalationStatus,
} from './escalation-state-machine.service';

@Injectable()
export class EscalationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safetyPolicy: SafetyPolicyService,
    private readonly stateMachine: EscalationStateMachineService,
  ) {}

  /**
   * Evaluates an incoming safety signal and triggers escalation if necessary.
   */
  async processSignal(input: {
    studentId: string;
    category: string;
    confidence: number;
    source: string;
    summary: string;
    metadata?: unknown;
  }) {
    const decision = this.safetyPolicy.evaluate(input);

    if (decision === SafetyDecision.CONTINUE) {
      return {
        decision,
        escalationId: null,
      };
    }

    const severity =
      decision === SafetyDecision.ESCALATE ? 'CRITICAL' : 'HIGH';

    const escalation = await this.prisma.safetyEscalation.create({
      data: {
        studentId: input.studentId,
        severity,
        category: input.category,
        source: input.source,
        summary: input.summary,
        metadata: input.metadata
          ? JSON.stringify(input.metadata)
          : undefined,
      },
    });

    return {
      decision,
      escalationId: escalation.id,
    };
  }

  /**
   * Assigns an escalation to a designated teacher/admin.
   */
  async assign(escalationId: string, assignedToId: string, actorRole: string) {
    const escalation = await this.getEscalationById(escalationId);
    this.stateMachine.assertTransitionAllowed(
      escalation.status as EscalationStatus,
      EscalationStatus.ASSIGNED,
      actorRole,
    );

    return this.prisma.safetyEscalation.update({
      where: { id: escalationId },
      data: {
        assignedToId,
        status: EscalationStatus.ASSIGNED,
      },
    });
  }

  /**
   * Moves an escalation into reviewing status.
   */
  async review(escalationId: string, actorRole: string) {
    const escalation = await this.getEscalationById(escalationId);
    this.stateMachine.assertTransitionAllowed(
      escalation.status as EscalationStatus,
      EscalationStatus.REVIEWING,
      actorRole,
    );

    return this.prisma.safetyEscalation.update({
      where: { id: escalationId },
      data: {
        status: EscalationStatus.REVIEWING,
      },
    });
  }

  /**
   * Resolves an escalation with human resolution notes.
   */
  async resolve(
    escalationId: string,
    resolvedById: string,
    resolution: string,
    actorRole: string,
  ) {
    const escalation = await this.getEscalationById(escalationId);
    this.stateMachine.assertTransitionAllowed(
      escalation.status as EscalationStatus,
      EscalationStatus.RESOLVED,
      actorRole,
    );

    return this.prisma.safetyEscalation.update({
      where: { id: escalationId },
      data: {
        resolvedById,
        resolution,
        status: EscalationStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves an escalation by ID.
   */
  async getEscalationById(id: string) {
    const record = await this.prisma.safetyEscalation.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, gradeLevel: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Safety escalation ${id} not found`);
    }

    return record;
  }

  /**
   * Queries escalations with optional status filtering.
   */
  async getEscalations(filters?: {
    status?: string;
    studentId?: string;
    severity?: string;
  }) {
    return this.prisma.safetyEscalation.findMany({
      where: {
        status: filters?.status,
        studentId: filters?.studentId,
        severity: filters?.severity,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, name: true, gradeLevel: true },
        },
      },
    });
  }
}
