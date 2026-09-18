import { Injectable, Logger } from '@nestjs/common';
import { MultimodalCostRecord, TenantMediaBudget, LearningModality } from './multimodal-types';

@Injectable()
export class MultimodalFinopsService {
  private readonly logger = new Logger(MultimodalFinopsService.name);

  // In-memory cost store (tenantId -> records)
  private readonly costRecords = new Map<string, MultimodalCostRecord[]>();

  // Tenant budgets (tenantId -> budget)
  private readonly tenantBudgets = new Map<string, TenantMediaBudget>();

  // Default limits
  private readonly DEFAULT_DAILY_LIMIT_USD = 50.0;
  private readonly DEFAULT_MONTHLY_LIMIT_USD = 500.0;

  /**
   * Initializes or retrieves tenant budget.
   */
  getTenantBudget(tenantId: string): TenantMediaBudget {
    let budget = this.tenantBudgets.get(tenantId);
    if (!budget) {
      budget = {
        tenantId,
        dailySpendLimitUsd: this.DEFAULT_DAILY_LIMIT_USD,
        currentDailySpendUsd: 0.0,
        monthlySpendLimitUsd: this.DEFAULT_MONTHLY_LIMIT_USD,
        currentMonthlySpendUsd: 0.0,
        generationAllowed: true,
      };
      this.tenantBudgets.set(tenantId, budget);
    }
    return budget;
  }

  /**
   * Checks if tenant has remaining budget to execute media generation (N11.44, N11.45).
   */
  checkBudgetCeiling(tenantId: string, estimatedCostUsd: number): { allowed: boolean; remainingDailyUsd: number } {
    const budget = this.getTenantBudget(tenantId);
    const projectedDaily = budget.currentDailySpendUsd + estimatedCostUsd;

    if (projectedDaily > budget.dailySpendLimitUsd) {
      this.logger.warn(
        `FinOps budget ceiling hit for tenant [${tenantId}]. Spend: $${budget.currentDailySpendUsd}, Limit: $${budget.dailySpendLimitUsd}`,
      );
      budget.generationAllowed = false;
      return { allowed: false, remainingDailyUsd: Math.max(0, budget.dailySpendLimitUsd - budget.currentDailySpendUsd) };
    }

    return { allowed: true, remainingDailyUsd: budget.dailySpendLimitUsd - projectedDaily };
  }

  /**
   * Records media generation cost and increments tenant spend (N11.44).
   */
  recordCost(params: {
    requestId: string;
    tenantId: string;
    modality: LearningModality;
    provider: string;
    model: string;
    costUsd: number;
  }): MultimodalCostRecord {
    const record: MultimodalCostRecord = {
      requestId: params.requestId,
      tenantId: params.tenantId,
      modality: params.modality,
      provider: params.provider,
      model: params.model,
      costUsd: params.costUsd,
      timestamp: new Date().toISOString(),
    };

    const records = this.costRecords.get(params.tenantId) || [];
    records.push(record);
    this.costRecords.set(params.tenantId, records);

    // Update budget spend
    const budget = this.getTenantBudget(params.tenantId);
    budget.currentDailySpendUsd = Math.round((budget.currentDailySpendUsd + params.costUsd) * 1000) / 1000;
    budget.currentMonthlySpendUsd = Math.round((budget.currentMonthlySpendUsd + params.costUsd) * 1000) / 1000;

    return record;
  }

  /**
   * Resets daily budgets (simulated daily cron).
   */
  resetDailySpend(tenantId: string): void {
    const budget = this.getTenantBudget(tenantId);
    budget.currentDailySpendUsd = 0.0;
    budget.generationAllowed = true;
  }

  /**
   * Resets monthly budgets (simulated monthly cron).
   */
  resetMonthlySpend(tenantId: string): void {
    const budget = this.getTenantBudget(tenantId);
    budget.currentMonthlySpendUsd = 0.0;
    budget.generationAllowed = true;
  }

  /**
   * Sets custom budget limits for a tenant.
   */
  setTenantBudget(tenantId: string, dailyLimitUsd: number, monthlyLimitUsd: number): TenantMediaBudget {
    const budget = this.getTenantBudget(tenantId);
    budget.dailySpendLimitUsd = dailyLimitUsd;
    budget.monthlySpendLimitUsd = monthlyLimitUsd;
    return budget;
  }

  /**
   * Retrieves all cost records for a tenant.
   */
  getCostRecords(tenantId: string): MultimodalCostRecord[] {
    return this.costRecords.get(tenantId) || [];
  }

  /**
   * Computes spend summary breakdown by modality and cache savings.
   */
  getSpendSummary(tenantId: string) {
    const records = this.getCostRecords(tenantId);
    const breakdown: Record<string, number> = {
      IMAGE: 0,
      AUDIO: 0,
      VIDEO: 0,
      VOICE: 0,
      VISION: 0,
    };

    let totalSpend = 0;
    let cacheHits = 0;
    let totalRequests = records.length;

    for (const r of records) {
      breakdown[r.modality] = (breakdown[r.modality] || 0) + r.costUsd;
      totalSpend += r.costUsd;
      if (r.costUsd === 0.0) {
        cacheHits++;
      }
    }

    const cacheHitRatio = totalRequests > 0 ? cacheHits / totalRequests : 0.0;
    const estimatedSavingsUsd = cacheHits * 0.02; // Avg base asset cost

    return {
      tenantId,
      totalSpendUsd: Math.round(totalSpend * 1000) / 1000,
      breakdown,
      cacheHits,
      totalRequests,
      cacheHitRatio: Math.round(cacheHitRatio * 100) / 100,
      estimatedSavingsUsd: Math.round(estimatedSavingsUsd * 1000) / 1000,
    };
  }
}
