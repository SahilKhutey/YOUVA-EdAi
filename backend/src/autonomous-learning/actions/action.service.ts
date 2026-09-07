import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { transitionAction } from './action-state';
import { ActionPolicyRegistryService, filterUnsafeActions } from './action-policy.service';

@Injectable()
export class AutonomousActionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyRegistry: ActionPolicyRegistryService,
  ) {}

  /**
   * Proposes a new learning action subject to policy review.
   */
  async proposeAction(data: {
    learnerId: string;
    tenantId: string;
    type: string;
    parameters: Record<string, any>;
    rationale: string;
    evidenceIds: string[];
    confidence: number;
    expiresAt?: Date;
  }) {
    if (this.policyRegistry.isBlockedForAI(data.type)) {
      throw new ForbiddenException(`Action type ${data.type} is strictly blocked for autonomous AI.`);
    }

    const policy = this.policyRegistry.getPolicy(data.type);
    const prismaClient = this.prisma as any;

    return prismaClient.learningAction.create({
      data: {
        learnerId: data.learnerId,
        tenantId: data.tenantId,
        type: data.type,
        parametersJson: JSON.stringify(data.parameters),
        rationale: data.rationale,
        evidenceIdsJson: JSON.stringify(data.evidenceIds),
        confidence: data.confidence,
        autonomyLevel: policy.autonomyLevel,
        reversible: policy.reversible,
        status: 'PROPOSED',
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  /**
   * Transitions action status through the governed state machine.
   */
  async updateStatus(actionId: string, nextState: string) {
    const prismaClient = this.prisma as any;
    const action = await prismaClient.learningAction.findUnique({
      where: { id: actionId },
    });
    if (!action) throw new NotFoundException('Action not found.');

    const validNext = transitionAction(action.status, nextState);

    return prismaClient.learningAction.update({
      where: { id: actionId },
      data: { status: validNext },
    });
  }

  /**
   * Approves an action that passed policy review or human approval.
   */
  async approve(actionId: string, user: { tenantId: string; userId: string }) {
    const prismaClient = this.prisma as any;
    const action = await prismaClient.learningAction.findUnique({
      where: { id: actionId },
    });
    if (!action) throw new NotFoundException('Action not found.');
    if (action.tenantId !== user.tenantId) {
      throw new ForbiddenException('Cross-tenant action access denied.');
    }

    // Move to APPROVED status
    return this.updateStatus(actionId, 'APPROVED');
  }

  /**
   * Executes an approved action with execution tracking.
   */
  async execute(actionId: string) {
    const prismaClient = this.prisma as any;
    const action = await prismaClient.learningAction.findUnique({
      where: { id: actionId },
    });
    if (!action) throw new NotFoundException('Action not found.');
    if (action.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot execute action with status ${action.status}. Must be APPROVED.`);
    }

    await this.updateStatus(actionId, 'EXECUTING');

    const execution = await prismaClient.actionExecution.create({
      data: {
        actionId,
        status: 'EXECUTING',
        startedAt: new Date(),
      },
    });

    // Simulate safe execution
    const completed = await this.updateStatus(actionId, 'COMPLETED');
    await prismaClient.actionExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        resultJson: JSON.stringify({ executed: true, timestamp: new Date() }),
      },
    });

    return completed;
  }

  /**
   * Rolls back an executed action if it is marked as reversible (Section 61).
   */
  async rollback(actionId: string, reason: string) {
    const prismaClient = this.prisma as any;
    const action = await prismaClient.learningAction.findUnique({
      where: { id: actionId },
    });
    if (!action) throw new NotFoundException('Action not found.');

    if (!action.reversible) {
      throw new ForbiddenException('Action is irreversible and cannot be rolled back.');
    }

    await this.updateStatus(actionId, 'EVALUATING');
    return this.updateStatus(actionId, 'ROLLED_BACK');
  }

  /**
   * Retrieves actions for a tenant with strict tenant isolation.
   */
  async getActions(tenantId: string, learnerId?: string) {
    const prismaClient = this.prisma as any;
    const where: Record<string, any> = { tenantId };
    if (learnerId) where.learnerId = learnerId;

    return prismaClient.learningAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
