import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaselineDefinition, SuccessCriteria } from '../domain/improvement-plan';
import { ActionType, ExecutionMode } from '../domain/improvement-action';

export interface CreatePlanDto {
  targetType: string;
  targetId: string;
  objective: string;
  hypothesis: string;
  sourceInsightIds?: string[];
  sourceRecommendationIds?: string[];
  baseline?: BaselineDefinition;
  successCriteria?: SuccessCriteria;
  actions?: Array<{
    type: ActionType;
    targetId?: string;
    executionMode?: ExecutionMode;
    requiresApproval?: boolean;
    payload?: Record<string, any>;
  }>;
  ownerId: string;
}

@Injectable()
export class ActionPlannerService {
  private readonly logger = new Logger(ActionPlannerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a formal Improvement Plan with initial actions, baseline, and success criteria.
   */
  async createPlan(dto: CreatePlanDto, tenantId = 'default-tenant') {
    if (!dto.objective || !dto.hypothesis) {
      throw new BadRequestException('Plan requires objective and hypothesis.');
    }

    const defaultBaseline: BaselineDefinition = dto.baseline || {
      metric: 'accuracy',
      windowStart: new Date(Date.now() - 14 * 86400000),
      windowEnd: new Date(),
      aggregation: 'RATE',
      minimumSampleSize: 15,
    };

    const defaultCriteria: SuccessCriteria = dto.successCriteria || {
      primaryMetric: 'accuracy',
      targetDirection: 'INCREASE',
      targetValue: 0.75,
      minimumSampleSize: 15,
      evaluationWindowDays: 14,
      guardrailMetrics: [
        { metric: 'abandonment', acceptableTolerance: 0.05, targetDirection: 'DECREASE' },
        { metric: 'hint_consumption', acceptableTolerance: 0.1, targetDirection: 'STABILIZE' },
      ],
    };

    const plan = await this.prisma.improvementPlan.create({
      data: {
        tenantId,
        sourceInsightIds: dto.sourceInsightIds || [],
        sourceRecommendationIds: dto.sourceRecommendationIds || [],
        targetType: dto.targetType,
        targetId: dto.targetId,
        objective: dto.objective,
        hypothesis: dto.hypothesis,
        baseline: JSON.stringify(defaultBaseline),
        successCriteria: JSON.stringify(defaultCriteria),
        policyVersion: '1.0.0',
        status: 'DRAFT',
        ownerId: dto.ownerId,
      },
    });

    // Create actions if provided
    if (dto.actions && dto.actions.length > 0) {
      for (let i = 0; i < dto.actions.length; i++) {
        const a = dto.actions[i];
        await this.prisma.improvementAction.create({
          data: {
            tenantId,
            planId: plan.id,
            type: a.type,
            targetId: a.targetId || dto.targetId,
            executionMode: a.executionMode || 'HUMAN',
            requiresApproval: a.requiresApproval !== undefined ? a.requiresApproval : true,
            status: 'PENDING',
            actionOrder: i + 1,
            payload: a.payload ? JSON.stringify(a.payload) : null,
          },
        });
      }
    }

    return this.getPlanWithDetails(plan.id, tenantId);
  }

  /**
   * Generates an improvement plan proposal from an existing recommendation.
   */
  async createPlanFromRecommendation(
    recommendationId: string,
    ownerId: string,
    tenantId = 'default-tenant',
  ) {
    const rec = await this.prisma.improvementRecommendation.findFirst({
      where: { id: recommendationId, tenantId },
    });

    if (!rec) {
      throw new NotFoundException(`Recommendation '${recommendationId}' not found.`);
    }

    let actionType: ActionType = 'REVISE_KNOWLEDGE';
    if (rec.actionType === 'ADD_EXAMPLE') actionType = 'ADD_EXAMPLE';
    else if (rec.actionType === 'ADD_PRACTICE') actionType = 'ADD_PRACTICE';
    else if (rec.actionType === 'CREATE_REMEDIATION') actionType = 'ADD_REMEDIATION';
    else if (rec.actionType === 'REVIEW_ASSESSMENT') actionType = 'REVISE_ASSESSMENT';
    else if (rec.actionType === 'RUN_EXPERIMENT') actionType = 'CREATE_EXPERIMENT';

    return this.createPlan(
      {
        targetType: 'KNOWLEDGE_OBJECT',
        targetId: rec.targetId,
        objective: `Improve mastery for target ${rec.targetId}`,
        hypothesis: `Applying recommendation '${rec.actionType}' will address: ${rec.reason}`,
        sourceRecommendationIds: [rec.id],
        sourceInsightIds: rec.evidenceIds || [],
        actions: [
          {
            type: actionType,
            targetId: rec.targetId,
            executionMode: 'HUMAN',
            requiresApproval: true,
          },
        ],
        ownerId,
      },
      tenantId,
    );
  }

  /**
   * Retrieves plan with its actions and executions.
   */
  async getPlanWithDetails(planId: string, tenantId = 'default-tenant') {
    const plan = await this.prisma.improvementPlan.findFirst({
      where: { id: planId, tenantId },
      include: {
        actions: { orderBy: { actionOrder: 'asc' } },
        executions: { orderBy: { startedAt: 'desc' } },
        outcomes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Improvement plan '${planId}' not found.`);
    }

    return {
      ...plan,
      baseline: JSON.parse(plan.baseline),
      successCriteria: JSON.parse(plan.successCriteria),
      actions: plan.actions.map((a) => ({
        ...a,
        payload: a.payload ? JSON.parse(a.payload) : null,
      })),
    };
  }
}
