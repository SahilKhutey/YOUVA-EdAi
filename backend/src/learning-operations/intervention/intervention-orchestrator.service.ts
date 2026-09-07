import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  InterventionPlan,
  transitionIntervention,
  TeacherInterventionDecision,
} from './intervention.types';

@Injectable()
export class InterventionOrchestratorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Plans an educational intervention based on empirical signals.
   * Invariant: Consequential interventions default to requiresTeacherApproval = true.
   */
  async createPlan(plan: InterventionPlan) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningIntervention.create({
      data: {
        learnerId: plan.learnerId,
        tenantId: plan.tenantId,
        signalId: plan.triggerSignalId,
        type: plan.type,
        targetConceptId: plan.targetConceptId ?? null,
        priority: plan.priority,
        rationale: plan.rationale,
        requiresTeacherApproval: plan.requiresTeacherApproval,
        status: plan.requiresTeacherApproval ? 'PROPOSED' : 'APPROVED',
      },
    });
  }

  /**
   * Approves a proposed intervention with teacher review.
   */
  async approve(interventionId: string, teacherId: string, rationale?: string) {
    const prismaClient = this.prisma as any;
    const intervention = await prismaClient.learningIntervention.findUnique({
      where: { id: interventionId },
    });
    if (!intervention) throw new NotFoundException('Intervention not found.');

    const nextStatus = transitionIntervention(intervention.status, 'APPROVED');

    return prismaClient.learningIntervention.update({
      where: { id: interventionId },
      data: {
        status: nextStatus,
        startedAt: new Date(),
        outcomeJson: JSON.stringify({ approvedBy: teacherId, rationale }),
      },
    });
  }

  /**
   * Rejects a proposed intervention with teacher rationale.
   */
  async reject(interventionId: string, teacherId: string, rationale: string) {
    const prismaClient = this.prisma as any;
    const intervention = await prismaClient.learningIntervention.findUnique({
      where: { id: interventionId },
    });
    if (!intervention) throw new NotFoundException('Intervention not found.');

    const nextStatus = transitionIntervention(intervention.status, 'REJECTED');

    return prismaClient.learningIntervention.update({
      where: { id: interventionId },
      data: {
        status: nextStatus,
        outcomeJson: JSON.stringify({ rejectedBy: teacherId, rationale }),
      },
    });
  }

  /**
   * Advances the intervention lifecycle through the state machine.
   */
  async updateStatus(interventionId: string, nextState: string) {
    const prismaClient = this.prisma as any;
    const intervention = await prismaClient.learningIntervention.findUnique({
      where: { id: interventionId },
    });
    if (!intervention) throw new NotFoundException('Intervention not found.');

    const updated = transitionIntervention(intervention.status, nextState);

    return prismaClient.learningIntervention.update({
      where: { id: interventionId },
      data: {
        status: updated,
        completedAt: ['SUCCESS', 'PARTIAL', 'FAILED'].includes(updated) ? new Date() : undefined,
      },
    });
  }

  /**
   * Queries interventions scoped strictly by tenant.
   */
  async getInterventions(query: {
    tenantId: string;
    learnerId?: string;
    status?: string;
  }) {
    const prismaClient = this.prisma as any;
    const where: Record<string, any> = { tenantId: query.tenantId };
    if (query.learnerId) where.learnerId = query.learnerId;
    if (query.status) where.status = query.status;

    return prismaClient.learningIntervention.findMany({
      where,
      orderBy: { priority: 'desc' },
    });
  }
}
