import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AutonomyPolicyService } from './autonomy-policy.service';
import {
  AgentAction,
  AgentRegistrationDto,
  AutonomyLevel,
  LearningAgentRequest,
  RiskClassification,
} from './autonomy.types';

@Injectable()
export class AgentExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: AutonomyPolicyService,
  ) {}

  /**
   * Registers a new AI Agent with governance metadata.
   */
  async registerAgent(dto: AgentRegistrationDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.aIAgent.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        version: dto.version ?? '1.0.0',
        status: 'ACTIVE',
        autonomyLevel: dto.autonomyLevel ?? AutonomyLevel.SUPERVISED,
        policyVersion: AutonomyPolicyService.POLICY_VERSION,
        configJson: dto.configJson ?? {},
      },
      update: {
        name: dto.name,
        description: dto.description,
        version: dto.version ?? '1.0.0',
        autonomyLevel: dto.autonomyLevel ?? AutonomyLevel.SUPERVISED,
        configJson: dto.configJson ?? {},
      },
    });
  }

  /**
   * Retrieves an AI agent by its unique key.
   */
  async getAgent(key: string) {
    const prismaClient = this.prisma as any;
    const agent = await prismaClient.aIAgent.findUnique({
      where: { key },
    });
    if (!agent) {
      throw new NotFoundException(`AI Agent with key '${key}' not found`);
    }
    return agent;
  }

  /**
   * Execute an agent action through strict policy gating and audit logging.
   */
  async executeAction(request: LearningAgentRequest) {
    const agent = await this.getAgent(request.agentKey);
    if (agent.status !== 'ACTIVE') {
      throw new ForbiddenException(`AI Agent '${request.agentKey}' is not active (status: ${agent.status})`);
    }

    const decision = this.policyService.evaluatePolicy(request);
    const requestId = crypto.randomUUID();
    const prismaClient = this.prisma as any;

    // Case 1: Strictly prohibited actions
    if (decision.riskLevel === RiskClassification.BLOCKED) {
      await prismaClient.aIAgentExecution.create({
        data: {
          agentId: agent.id,
          tenantId: request.tenantId,
          learnerId: request.learnerId,
          requestId,
          action: request.action,
          autonomyLevel: agent.autonomyLevel,
          status: 'BLOCKED',
          inputHash: decision.inputHash,
          policyVersion: decision.policyVersion,
          errorCode: 'PROHIBITED_ACTION',
          errorDetails: decision.reason,
          metadataJson: { payload: request.payload },
          completedAt: new Date(),
        },
      });

      throw new ForbiddenException(`Action blocked by governance policy: ${decision.reason}`);
    }

    // Case 2: Requires human approval
    if (decision.riskLevel === RiskClassification.HUMAN_APPROVAL) {
      const execution = await prismaClient.aIAgentExecution.create({
        data: {
          agentId: agent.id,
          tenantId: request.tenantId,
          learnerId: request.learnerId,
          requestId,
          action: request.action,
          autonomyLevel: agent.autonomyLevel,
          status: 'PENDING',
          inputHash: decision.inputHash,
          policyVersion: decision.policyVersion,
          metadataJson: {
            payload: request.payload,
            reason: decision.reason,
            ageTier: request.ageTier,
          },
        },
      });

      return {
        executionId: execution.id,
        requestId,
        status: 'PENDING',
        decision,
        message: 'Action requires human approval before execution',
      };
    }

    // Case 3: Auto low-risk execution
    const output = await this.performBoundedAction(request.action, request.payload);
    const outputHash = this.policyService.calculateHash(output);

    const execution = await prismaClient.aIAgentExecution.create({
      data: {
        agentId: agent.id,
        tenantId: request.tenantId,
        learnerId: request.learnerId,
        requestId,
        action: request.action,
        autonomyLevel: agent.autonomyLevel,
        status: 'EXECUTED',
        inputHash: decision.inputHash,
        outputHash,
        policyVersion: decision.policyVersion,
        metadataJson: {
          payload: request.payload,
          output,
        },
        completedAt: new Date(),
      },
    });

    return {
      executionId: execution.id,
      requestId,
      status: 'EXECUTED',
      decision,
      output,
    };
  }

  /**
   * Human approval for a pending execution.
   */
  async approveExecution(executionId: string, approvedByUserId: string) {
    const prismaClient = this.prisma as any;
    const execution = await prismaClient.aIAgentExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new NotFoundException(`Execution record '${executionId}' not found`);
    }
    if (execution.status !== 'PENDING') {
      throw new ForbiddenException(`Execution is already in status '${execution.status}'`);
    }

    const payload = execution.metadataJson?.payload ?? {};
    const output = await this.performBoundedAction(execution.action as AgentAction, payload);
    const outputHash = this.policyService.calculateHash(output);

    return prismaClient.aIAgentExecution.update({
      where: { id: executionId },
      data: {
        status: 'APPROVED',
        humanApprovedBy: approvedByUserId,
        approvedAt: new Date(),
        outputHash,
        metadataJson: {
          ...execution.metadataJson,
          output,
          approvedBy: approvedByUserId,
        },
        completedAt: new Date(),
      },
    });
  }

  /**
   * Human rejection for a pending execution.
   */
  async rejectExecution(executionId: string, rejectedByUserId: string, reason: string) {
    const prismaClient = this.prisma as any;
    const execution = await prismaClient.aIAgentExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new NotFoundException(`Execution record '${executionId}' not found`);
    }
    if (execution.status !== 'PENDING') {
      throw new ForbiddenException(`Execution is already in status '${execution.status}'`);
    }

    return prismaClient.aIAgentExecution.update({
      where: { id: executionId },
      data: {
        status: 'REJECTED',
        errorCode: 'REJECTED_BY_HUMAN',
        errorDetails: reason,
        completedAt: new Date(),
        metadataJson: {
          ...execution.metadataJson,
          rejectedBy: rejectedByUserId,
          rejectionReason: reason,
        },
      },
    });
  }

  /**
   * Retrieves execution audit history.
   */
  async getAuditHistory(filters: { agentId?: string; learnerId?: string; tenantId?: string; limit?: number }) {
    const prismaClient = this.prisma as any;
    const where: any = {};
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.learnerId) where.learnerId = filters.learnerId;
    if (filters.tenantId) where.tenantId = filters.tenantId;

    return prismaClient.aIAgentExecution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
      include: {
        agent: true,
      },
    });
  }

  /**
   * Internal bounded handler for safe, reversible actions.
   */
  private async performBoundedAction(action: AgentAction, payload: any) {
    switch (action) {
      case AgentAction.RECOMMEND_ACTIVITY:
        return {
          recommendedActivityId: payload.activityId ?? 'act-default-01',
          rationale: 'Pedagogical step aligned with current target mastery',
          confidence: 0.88,
          timestamp: new Date().toISOString(),
        };

      case AgentAction.GENERATE_HINT:
        return {
          hintText: payload.context ? `Consider the relationship in ${payload.context}` : 'Review the definition of the concept before attempting.',
          hintLevel: payload.hintLevel ?? 1,
          scaffoldType: 'CONCEPTUAL_NUDGE',
        };

      case AgentAction.GENERATE_EXPLANATION:
        return {
          explanation: `Let's break this down step-by-step for ${payload.topic ?? 'the topic'}.`,
          simplified: true,
          readabilityScore: 85,
        };

      case AgentAction.RESCHEDULE_ACTIVITY:
        return {
          activityId: payload.activityId,
          newScheduledTime: payload.requestedTime ?? new Date(Date.now() + 86400000).toISOString(),
          status: 'RESCHEDULED',
        };

      case AgentAction.ASSIGN_CONTENT:
        return {
          contentId: payload.contentId,
          assignedToLearnerId: payload.learnerId,
          status: 'ASSIGNED',
        };

      default:
        return {
          acknowledged: true,
          action,
        };
    }
  }
}
