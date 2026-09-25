import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActionPlannerService, CreatePlanDto } from './action-planner.service';
import { ExecutionService } from './execution.service';
import { EvaluationService } from './evaluation.service';
import { PlanStatus } from '../domain/improvement-plan';
import { ActionType, ExecutionMode } from '../domain/improvement-action';

@Injectable()
export class ImprovementOrchestratorService {
  private readonly logger = new Logger(ImprovementOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly actionPlanner: ActionPlannerService,
    private readonly executionService: ExecutionService,
    private readonly evaluationService: EvaluationService,
  ) {}

  /**
   * Creates an improvement plan.
   */
  async createPlan(dto: CreatePlanDto, tenantId = 'default-tenant') {
    return this.actionPlanner.createPlan(dto, tenantId);
  }

  /**
   * Submits a plan for governance approval.
   */
  async submitForApproval(planId: string, tenantId = 'default-tenant') {
    const plan = await this.prisma.improvementPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${planId}' not found.`);
    }

    if (plan.status !== 'DRAFT') {
      throw new BadRequestException(`Only DRAFT plans can be submitted for approval (current: ${plan.status}).`);
    }

    return this.prisma.improvementPlan.update({
      where: { id: planId },
      data: { status: 'PENDING_APPROVAL' },
    });
  }

  /**
   * Approves a plan (Authorized Teacher/Admin).
   */
  async approvePlan(planId: string, approvedBy: string, tenantId = 'default-tenant') {
    const plan = await this.prisma.improvementPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${planId}' not found.`);
    }

    if (plan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Only PENDING_APPROVAL plans can be approved (current: ${plan.status}).`);
    }

    return this.prisma.improvementPlan.update({
      where: { id: planId },
      data: {
        status: 'APPROVED',
        approvedBy,
      },
    });
  }

  /**
   * Executes all ready actions in an approved plan.
   */
  async executePlan(planId: string, actorId: string, tenantId = 'default-tenant') {
    const plan = await this.actionPlanner.getPlanWithDetails(planId, tenantId);

    if (plan.status !== 'APPROVED' && plan.status !== 'EXECUTING') {
      throw new ForbiddenException(
        `Plan '${planId}' cannot be executed in status '${plan.status}'. Must be APPROVED first.`,
      );
    }

    const results = [];
    for (const action of plan.actions) {
      if (action.status === 'PENDING' || action.status === 'READY') {
        const exec = await this.executionService.executeAction(
          {
            planId: plan.id,
            actionId: action.id,
            actorType: 'TEACHER',
            actorId,
          },
          tenantId,
        );
        results.push(exec);
      }
    }

    return {
      planId: plan.id,
      executedCount: results.length,
      executions: results,
    };
  }

  /**
   * Reopens a failed or rolled-back plan to trigger a new improvement loop.
   */
  async reopenPlan(planId: string, reason: string, ownerId: string, tenantId = 'default-tenant') {
    const oldPlan = await this.actionPlanner.getPlanWithDetails(planId, tenantId);

    if (oldPlan.status !== 'FAILED' && oldPlan.status !== 'ROLLED_BACK') {
      throw new BadRequestException(
        `Only FAILED or ROLLED_BACK plans can be reopened (current: ${oldPlan.status}).`,
      );
    }

    // Create a new iterative plan
    const newPlan = await this.actionPlanner.createPlan(
      {
        targetType: oldPlan.targetType,
        targetId: oldPlan.targetId,
        objective: oldPlan.objective,
        hypothesis: `Iterative Improvement (Reopened from ${oldPlan.id}): ${reason}`,
        sourceInsightIds: oldPlan.sourceInsightIds,
        sourceRecommendationIds: oldPlan.sourceRecommendationIds,
        actions: oldPlan.actions.map((a) => ({
          type: a.type as ActionType,
          targetId: a.targetId,
          executionMode: a.executionMode as ExecutionMode,
          requiresApproval: a.requiresApproval,
          payload: a.payload,
        })),
        ownerId,
      },
      tenantId,
    );

    // Record lineage between old plan and new plan
    await this.prisma.learningLineage.create({
      data: {
        tenantId,
        sourceType: 'IMPROVEMENT_PLAN',
        sourceId: oldPlan.id,
        targetType: 'IMPROVEMENT_PLAN',
        targetId: newPlan.id,
        relation: 'INFORMED_BY',
        metadata: JSON.stringify({ reopenReason: reason, reopenedAt: new Date() }),
      },
    });

    return newPlan;
  }

  /**
   * Cancels a plan.
   */
  async cancelPlan(planId: string, tenantId = 'default-tenant') {
    return this.prisma.improvementPlan.update({
      where: { id: planId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Lists improvement plans with filters.
   */
  async listPlans(tenantId = 'default-tenant', status?: PlanStatus) {
    const where: any = { tenantId };
    if (status) where.status = status;

    const plans = await this.prisma.improvementPlan.findMany({
      where,
      include: {
        actions: true,
        outcomes: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return plans.map((p) => ({
      ...p,
      baseline: JSON.parse(p.baseline),
      successCriteria: JSON.parse(p.successCriteria),
    }));
  }
}
