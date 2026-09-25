import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemicAction, SystemOptimizationPlanDto } from '../domain/system-optimization';

export interface CreateSystemOptimizationPlanDto {
  objective: string;
  policyVersion?: string;
  ownerId: string;
  actions: SystemicAction[];
}

@Injectable()
export class SystemOptimizationService {
  private readonly logger = new Logger(SystemOptimizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a systemic optimization plan.
   */
  async createPlan(dto: CreateSystemOptimizationPlanDto, tenantId = 'default-tenant') {
    if (!dto.objective || dto.actions.length === 0) {
      throw new BadRequestException('System optimization plan requires an objective and at least one action.');
    }

    const plan = await this.prisma.systemOptimizationPlan.create({
      data: {
        tenantId,
        objective: dto.objective,
        status: 'DRAFT',
        policyVersion: dto.policyVersion || 'SYSTEM_OPT_V1',
        ownerId: dto.ownerId,
        actionsJson: JSON.stringify(dto.actions),
      },
    });

    return {
      ...plan,
      actions: JSON.parse(plan.actionsJson || '[]'),
    };
  }

  /**
   * Submits plan for governance review.
   */
  async submitPlan(id: string, tenantId = 'default-tenant') {
    const plan = await this.prisma.systemOptimizationPlan.findFirst({
      where: { id, tenantId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${id}' not found.`);
    }

    if (plan.status !== 'DRAFT') {
      throw new BadRequestException(`Only DRAFT plans can be submitted (current: ${plan.status}).`);
    }

    return this.prisma.systemOptimizationPlan.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });
  }

  /**
   * Approves a systemic optimization plan (Admin/Governance authority).
   */
  async approvePlan(id: string, approvedBy: string, tenantId = 'default-tenant') {
    const plan = await this.prisma.systemOptimizationPlan.findFirst({
      where: { id, tenantId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${id}' not found.`);
    }

    if (plan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Only PENDING_APPROVAL plans can be approved (current: ${plan.status}).`);
    }

    return this.prisma.systemOptimizationPlan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
      },
    });
  }

  /**
   * Executes systemic actions within an approved plan.
   */
  async executePlan(id: string, tenantId = 'default-tenant') {
    const plan = await this.prisma.systemOptimizationPlan.findFirst({
      where: { id, tenantId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${id}' not found.`);
    }

    if (plan.status !== 'APPROVED') {
      throw new ForbiddenException(
        `Execution rejected: System optimization plan must be APPROVED before execution (current: ${plan.status}).`,
      );
    }

    const actions: SystemicAction[] = JSON.parse(plan.actionsJson || '[]');
    const executedActions = actions.map((a) => ({ ...a, status: 'EXECUTED' as const }));

    return this.prisma.systemOptimizationPlan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actionsJson: JSON.stringify(executedActions),
      },
    });
  }

  /**
   * Lists system optimization plans.
   */
  async listPlans(tenantId = 'default-tenant') {
    const plans = await this.prisma.systemOptimizationPlan.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((p) => ({
      ...p,
      actions: JSON.parse(p.actionsJson || '[]'),
    }));
  }
}
