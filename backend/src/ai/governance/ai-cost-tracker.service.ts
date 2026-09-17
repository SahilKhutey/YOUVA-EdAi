import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiUsageMetrics } from '../interfaces/ai-gateway.interface';

@Injectable()
export class AiCostTrackerService {
  private readonly logger = new Logger(AiCostTrackerService.name);

  // Default educational model blended pricing ($ / 1k tokens)
  public static readonly DEFAULT_INPUT_COST_PER_1K = 0.0015;
  public static readonly DEFAULT_OUTPUT_COST_PER_1K = 0.0020;
  public static readonly DEFAULT_DAILY_SPEND_LIMIT_USD = 50.0;
  public static readonly SOFT_CAP_PERCENTAGE = 0.8; // 80%

  private readonly tenantSpendLimits = new Map<string, number>();
  private readonly tenantDailySpend = new Map<string, { amount: number; resetAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sets custom daily spend limit for a tenant.
   */
  setTenantSpendLimit(tenantId: string, limitDailyUsd: number): void {
    this.tenantSpendLimits.set(tenantId, limitDailyUsd);
  }

  /**
   * Checks whether the tenant has exceeded their daily AI budget.
   */
  async checkTenantSpendLimit(tenantId: string): Promise<{
    allowed: boolean;
    currentDailySpend: number;
    limitDailySpend: number;
    softCapTriggered: boolean;
  }> {
    const limit = this.tenantSpendLimits.get(tenantId) ?? AiCostTrackerService.DEFAULT_DAILY_SPEND_LIMIT_USD;
    const currentSpend = await this.getTenantDailySpend(tenantId);

    const softCapTriggered = currentSpend >= limit * AiCostTrackerService.SOFT_CAP_PERCENTAGE;
    const allowed = currentSpend < limit;

    if (softCapTriggered && allowed) {
      this.logger.warn(
        `Tenant [${tenantId}] has reached 80% soft cap for daily AI spend ($${currentSpend.toFixed(2)} / $${limit.toFixed(2)})`,
      );
    }

    return {
      allowed,
      currentDailySpend: Number(currentSpend.toFixed(4)),
      limitDailySpend: limit,
      softCapTriggered,
    };
  }

  /**
   * Gets current 24-hour spend for a tenant from cache or DB.
   */
  async getTenantDailySpend(tenantId: string): Promise<number> {
    const now = Date.now();
    const cached = this.tenantDailySpend.get(tenantId);
    if (cached && cached.resetAt > now) {
      return cached.amount;
    }

    // Calculate from DB if available
    try {
      const prismaAny = this.prisma as any;
      if (prismaAny.aIUsageRecord?.findMany) {
        const oneDayAgo = new Date(now - 24 * 3600 * 1000);
        const records = await prismaAny.aIUsageRecord.findMany({
          where: {
            tenantId,
            createdAt: { gte: oneDayAgo },
          },
          select: { estimatedCost: true },
        });

        const sum = records.reduce((acc: number, r: any) => acc + (r.estimatedCost || 0), 0);
        const resetAt = now + 60 * 1000; // cache for 1 min
        this.tenantDailySpend.set(tenantId, { amount: sum, resetAt });
        return sum;
      }
    } catch {
      // ignore
    }

    return cached?.amount ?? 0;
  }


  /**
   * Estimates tokens from character count if provider doesn't report exact token counts.
   */
  estimateTokens(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /**
   * Calculates cost in USD based on input and output tokens.
   */
  calculateCostUsd(
    inputTokens: number,
    outputTokens: number,
    inputCostPer1k = AiCostTrackerService.DEFAULT_INPUT_COST_PER_1K,
    outputCostPer1k = AiCostTrackerService.DEFAULT_OUTPUT_COST_PER_1K,
  ): number {
    const cost = (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k;
    return Number(cost.toFixed(6));
  }

  /**
   * Persists an AI usage record into the database for FinOps governance.
   */
  async recordUsage(params: {
    tenantId: string;
    actorId: string;
    purpose: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    status?: string;
  }): Promise<AiUsageMetrics> {
    const estimatedCostUsd = this.calculateCostUsd(params.inputTokens, params.outputTokens);
    const totalTokens = params.inputTokens + params.outputTokens;

    try {
      const prismaAny = this.prisma as any;
      if (prismaAny.aIUsageRecord?.create) {
        await prismaAny.aIUsageRecord.create({
          data: {
            tenantId: params.tenantId,
            learnerId: params.actorId,
            agentId: `${params.provider}:${params.model}`,
            modelVersionId: params.model,
            requestCount: 1,
            inputTokens: params.inputTokens,
            outputTokens: params.outputTokens,
            estimatedCost: estimatedCostUsd,
            currency: 'USD',
            latencyMs: params.latencyMs,
            status: params.status || 'SUCCESS',
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to persist AIUsageRecord to database: ${err?.message || err}`);
    }

    // Update local cache
    const currentCached = this.tenantDailySpend.get(params.tenantId);
    if (currentCached) {
      currentCached.amount += estimatedCostUsd;
    } else {
      this.tenantDailySpend.set(params.tenantId, {
        amount: estimatedCostUsd,
        resetAt: Date.now() + 24 * 3600 * 1000,
      });
    }

    return {
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens,
      estimatedCostUsd,
    };
  }

  /**
   * Retrieves aggregated usage statistics across models and purposes.
   */
  async getUsageSummary(tenantId?: string): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCostUsd: number;
    avgLatencyMs: number;
  }> {
    try {
      const prismaAny = this.prisma as any;
      if (!prismaAny.aIUsageRecord?.findMany) {
        return { totalRequests: 0, totalTokens: 0, totalCostUsd: 0, avgLatencyMs: 0 };
      }

      const where = tenantId ? { tenantId } : {};
      const records = await prismaAny.aIUsageRecord.findMany({
        where,
        select: {
          inputTokens: true,
          outputTokens: true,
          estimatedCost: true,
          latencyMs: true,
        },
      });

      const totalRequests = records.length;
      let totalTokens = 0;
      let totalCostUsd = 0;
      let totalLatency = 0;

      for (const r of records) {
        totalTokens += (r.inputTokens || 0) + (r.outputTokens || 0);
        totalCostUsd += r.estimatedCost || 0;
        totalLatency += r.latencyMs || 0;
      }

      const avgLatencyMs = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

      return {
        totalRequests,
        totalTokens,
        totalCostUsd: Number(totalCostUsd.toFixed(4)),
        avgLatencyMs,
      };
    } catch (err) {
      this.logger.error(`Error querying AI usage summary: ${err.message}`);
      return { totalRequests: 0, totalTokens: 0, totalCostUsd: 0, avgLatencyMs: 0 };
    }
  }
}
