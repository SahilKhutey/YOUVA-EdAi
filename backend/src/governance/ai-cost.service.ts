import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetReport, BudgetState } from './governance.types';

@Injectable()
export class AICostService {
  // Standard educational model blended pricing ($ / 1k tokens)
  public static readonly DEFAULT_INPUT_COST_PER_1K = 0.0015;
  public static readonly DEFAULT_OUTPUT_COST_PER_1K = 0.0020;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates the USD cost for a token batch.
   */
  calculateCost(
    inputTokens: number,
    outputTokens: number,
    inputCostPer1k = AICostService.DEFAULT_INPUT_COST_PER_1K,
    outputCostPer1k = AICostService.DEFAULT_OUTPUT_COST_PER_1K,
  ): number {
    const inputCost = (inputTokens / 1000) * inputCostPer1k;
    const outputCost = (outputTokens / 1000) * outputCostPer1k;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Records AI token usage and estimated cost for institutional auditing and billing.
   */
  async recordUsage(params: {
    tenantId?: string;
    learnerId?: string;
    agentId?: string;
    modelVersionId?: string;
    inputTokens: number;
    outputTokens: number;
    inputCostPer1k?: number;
    outputCostPer1k?: number;
    latencyMs?: number;
    status?: string;
  }) {
    const estimatedCost = this.calculateCost(
      params.inputTokens,
      params.outputTokens,
      params.inputCostPer1k,
      params.outputCostPer1k,
    );

    const prismaClient = this.prisma as any;
    return prismaClient.aIUsageRecord.create({
      data: {
        tenantId: params.tenantId,
        learnerId: params.learnerId,
        agentId: params.agentId,
        modelVersionId: params.modelVersionId,
        requestCount: 1,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        estimatedCost,
        currency: 'USD',
        latencyMs: params.latencyMs,
        status: params.status ?? 'SUCCESS',
      },
    });
  }

  /**
   * Computes institutional budget state for the current billing cycle.
   */
  async checkBudgetState(tenantId: string, monthlyBudgetUSD: number): Promise<BudgetReport> {
    const prismaClient = this.prisma as any;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const records = await prismaClient.aIUsageRecord.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
      select: { estimatedCost: true },
    });

    const totalSpent = records.reduce(
      (sum: number, r: { estimatedCost: number }) => sum + (r.estimatedCost || 0),
      0,
    );
    const roundedSpent = Number(totalSpent.toFixed(4));
    const percentUsed = monthlyBudgetUSD > 0
      ? Number(((roundedSpent / monthlyBudgetUSD) * 100).toFixed(2))
      : 0;

    let state: BudgetState = 'OK';
    if (percentUsed >= 100) {
      state = 'EXCEEDED';
    } else if (percentUsed >= 80) {
      state = 'WARNING';
    }

    return {
      tenantId,
      totalSpent: roundedSpent,
      budgetLimit: monthlyBudgetUSD,
      percentUsed,
      state,
    };
  }
}
