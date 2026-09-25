import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionPolicy } from '../policies/execution-policy';
import { ActionType, ExecutionMode } from '../domain/improvement-action';
import { ActorType } from '../domain/execution';

export interface ExecuteActionDto {
  planId: string;
  actionId: string;
  actorType: ActorType;
  actorId?: string;
  executionVersion?: number;
  payload?: Record<string, any>;
}

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotently executes an improvement action.
   */
  async executeAction(dto: ExecuteActionDto, tenantId = 'default-tenant') {
    const plan = await this.prisma.improvementPlan.findFirst({
      where: { id: dto.planId, tenantId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${dto.planId}' not found.`);
    }

    const action = await this.prisma.improvementAction.findFirst({
      where: { id: dto.actionId, planId: dto.planId, tenantId },
    });

    if (!action) {
      throw new NotFoundException(`Action '${dto.actionId}' not found in plan '${dto.planId}'.`);
    }

    const isPlanApproved = plan.status === 'APPROVED' || plan.status === 'EXECUTING';
    const isActionApproved = !action.requiresApproval || isPlanApproved;

    // Validate authorization policy
    ExecutionPolicy.validateAuthorization(
      action.type as ActionType,
      action.executionMode as ExecutionMode,
      isPlanApproved,
      isActionApproved,
      dto.actorType,
    );

    // Compute idempotency execution key
    const version = dto.executionVersion || 1;
    const executionKey = `${tenantId}:${dto.planId}:${dto.actionId}:v${version}`;

    // Check if execution already exists
    const existingExecution = await this.prisma.improvementExecution.findUnique({
      where: {
        tenantId_executionKey: {
          tenantId,
          executionKey,
        },
      },
    });

    if (existingExecution) {
      if (existingExecution.status === 'COMPLETED') {
        this.logger.log(`Idempotency: Execution '${executionKey}' already completed. Returning existing.`);
        return existingExecution;
      }
    }

    // Create or update execution record in STARTED status
    const execution = existingExecution
      ? await this.prisma.improvementExecution.update({
          where: { id: existingExecution.id },
          data: {
            status: 'STARTED',
            attempts: { increment: 1 },
            startedAt: new Date(),
          },
        })
      : await this.prisma.improvementExecution.create({
          data: {
            tenantId,
            planId: dto.planId,
            actionId: dto.actionId,
            executionKey,
            status: 'STARTED',
            attempts: 1,
            actorType: dto.actorType,
            actorId: dto.actorId,
            startedAt: new Date(),
          },
        });

    try {
      // Execute the domain action
      let outputReference = `executed:${action.type}:${Date.now()}`;

      if (action.type === 'REVISE_KNOWLEDGE' || action.type === 'ADD_EXAMPLE' || action.type === 'ADD_REMEDIATION') {
        // If target is a KnowledgeObject, create a new KnowledgeVersion draft or increment
        const ko = await this.prisma.knowledgeObject.findFirst({
          where: { id: action.targetId || plan.targetId, tenantId },
        });

        if (ko) {
          const nextVersion = ko.currentVersion + 1;
          const kv = await this.prisma.knowledgeVersion.create({
            data: {
              knowledgeObjectId: ko.id,
              version: nextVersion,
              content: JSON.stringify({
                revisionNote: `Generated via Improvement Plan ${plan.id}`,
                actionType: action.type,
                appliedPayload: dto.payload || {},
              }),
              contentHash: `hash_plan_${plan.id}_v${nextVersion}`,
              sourceType: dto.actorType === 'AI' ? 'AI' : 'TEACHER',
              reviewStatus: 'DRAFT',
              authorId: dto.actorId || 'system',
            },
          });

          outputReference = `knowledge_version:${kv.id}`;

          // Record lineage
          await this.prisma.learningLineage.create({
            data: {
              tenantId,
              sourceType: 'IMPROVEMENT_PLAN',
              sourceId: plan.id,
              targetType: 'KNOWLEDGE_VERSION',
              targetId: kv.id,
              relation: 'CREATED_FROM',
              metadata: JSON.stringify({ actionId: action.id, actorType: dto.actorType }),
            },
          });
        }
      }

      // Mark action COMPLETED
      await this.prisma.improvementAction.update({
        where: { id: action.id },
        data: { status: 'COMPLETED' },
      });

      // If plan was APPROVED, advance to EXECUTING
      if (plan.status === 'APPROVED') {
        await this.prisma.improvementPlan.update({
          where: { id: plan.id },
          data: { status: 'EXECUTING' },
        });
      }

      // Mark execution COMPLETED
      return this.prisma.improvementExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          outputReference,
        },
      });
    } catch (err: any) {
      this.logger.error(`Execution failed for '${executionKey}': ${err.message}`);
      await this.prisma.improvementExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorCode: 'EXECUTION_ERROR',
          errorMessage: err.message,
        },
      });
      await this.prisma.improvementAction.update({
        where: { id: action.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }
}
