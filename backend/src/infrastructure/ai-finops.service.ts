import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { AiBudgetHierarchy, AiSpendRecord } from './n14-types';
import * as crypto from 'crypto';

@Injectable()
export class AiFinOpsService {
  private readonly logger = new Logger(AiFinOpsService.name);
  private budgets: Map<string, AiBudgetHierarchy> = new Map();
  private spendRecords: AiSpendRecord[] = [];

  // Kill switches
  private globalAiKillSwitch: boolean = false;
  private childVoiceKillSwitch: boolean = false;
  private generativeMediaKillSwitch: boolean = false;
  private tenantKillSwitches: Map<string, boolean> = new Map();

  constructor() {
    this.seedDefaultBudgets();
  }

  private seedDefaultBudgets() {
    this.budgets.set('tenant-dps-rkp', {
      tenantId: 'tenant-dps-rkp',
      allocatedMonthlyBudgetUsd: 1500.0,
      currentSpendUsd: 340.25,
      softWarningThresholdPercent: 80,
      hardCapReached: false,
      learnerPerSessionLimitUsd: 0.15,
    });

    this.budgets.set('tenant-modern-vv', {
      tenantId: 'tenant-modern-vv',
      allocatedMonthlyBudgetUsd: 750.0,
      currentSpendUsd: 120.5,
      softWarningThresholdPercent: 80,
      hardCapReached: false,
      learnerPerSessionLimitUsd: 0.15,
    });
  }

  // --- 1. AI Execution Eligibility & Kill Switches (Clauses N14.79 - N14.80) ---

  public isAiExecutionAllowed(params: {
    tenantId: string;
    modality: 'TEXT' | 'VOICE' | 'GENERATIVE_MEDIA';
    isChildTier: boolean;
  }): { allowed: boolean; reason?: string; fallbackRequired: boolean } {
    // 1. Global AI Kill Switch
    if (this.globalAiKillSwitch) {
      return {
        allowed: false,
        reason: 'GLOBAL_AI_KILL_SWITCH_ACTIVE: Operating in 100% deterministic fallback mode',
        fallbackRequired: true,
      };
    }

    // 2. Tenant-Specific Kill Switch
    if (this.tenantKillSwitches.get(params.tenantId) === true) {
      return {
        allowed: false,
        reason: `TENANT_AI_KILL_SWITCH_ACTIVE for [${params.tenantId}]`,
        fallbackRequired: true,
      };
    }

    // 3. Child Voice Kill Switch (Clause N14.80)
    if (params.isChildTier && params.modality === 'VOICE' && this.childVoiceKillSwitch) {
      return {
        allowed: false,
        reason: 'CHILD_VOICE_KILL_SWITCH_ACTIVE: Falling back to tactile touch controls',
        fallbackRequired: true,
      };
    }

    // 4. Generative Media Kill Switch
    if (params.modality === 'GENERATIVE_MEDIA' && this.generativeMediaKillSwitch) {
      return {
        allowed: false,
        reason: 'GENERATIVE_MEDIA_KILL_SWITCH_ACTIVE: Using vetted static curriculum assets',
        fallbackRequired: true,
      };
    }

    // 5. Budget Hard-Cap Check
    const budget = this.getBudget(params.tenantId);
    if (budget.hardCapReached) {
      return {
        allowed: false,
        reason: `AI_BUDGET_HARD_CAP_EXHAUSTED for tenant [${params.tenantId}]`,
        fallbackRequired: true,
      };
    }

    return { allowed: true, fallbackRequired: false };
  }

  public setKillSwitch(
    target: 'GLOBAL' | 'CHILD_VOICE' | 'GENERATIVE_MEDIA' | 'TENANT',
    active: boolean,
    tenantId?: string
  ): void {
    if (target === 'GLOBAL') {
      this.globalAiKillSwitch = active;
      this.logger.warn(`Global AI Kill Switch set to: ${active}`);
    } else if (target === 'CHILD_VOICE') {
      this.childVoiceKillSwitch = active;
      this.logger.warn(`Child Voice Kill Switch set to: ${active}`);
    } else if (target === 'GENERATIVE_MEDIA') {
      this.generativeMediaKillSwitch = active;
      this.logger.warn(`Generative Media Kill Switch set to: ${active}`);
    } else if (target === 'TENANT' && tenantId) {
      this.tenantKillSwitches.set(tenantId, active);
      this.logger.warn(`Tenant [${tenantId}] AI Kill Switch set to: ${active}`);
    }
  }

  // --- 2. Cost Tracking & Hierarchical Budgets (Clauses N14.21 - N14.22) ---

  public recordAiSpend(params: {
    tenantId: string;
    learnerId: string;
    modelName: string;
    provider: 'GEMINI' | 'OLLAMA_LOCAL' | 'DETERMINISTIC_FALLBACK';
    purpose: string;
    tokenCount: number;
    costUsd: number;
  }): AiSpendRecord {
    const record: AiSpendRecord = {
      recordId: `spend-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      learnerId: params.learnerId,
      modelName: params.modelName,
      provider: params.provider,
      purpose: params.purpose,
      tokenCount: params.tokenCount,
      costUsd: params.costUsd,
      timestamp: new Date().toISOString(),
    };

    this.spendRecords.push(record);

    // Update tenant budget consumption
    const budget = this.getBudget(params.tenantId);
    budget.currentSpendUsd = Number((budget.currentSpendUsd + params.costUsd).toFixed(4));

    if (budget.currentSpendUsd >= budget.allocatedMonthlyBudgetUsd) {
      budget.hardCapReached = true;
      this.logger.error(`AI FinOps Hard Cap Reached for tenant [${params.tenantId}]`);
    }

    this.budgets.set(params.tenantId, budget);
    return record;
  }

  public getBudget(tenantId: string): AiBudgetHierarchy {
    let b = this.budgets.get(tenantId);
    if (!b) {
      b = {
        tenantId,
        allocatedMonthlyBudgetUsd: 250.0,
        currentSpendUsd: 0.0,
        softWarningThresholdPercent: 80,
        hardCapReached: false,
        learnerPerSessionLimitUsd: 0.15,
      };
      this.budgets.set(tenantId, b);
    }
    return { ...b };
  }

  public setTenantBudget(budget: AiBudgetHierarchy): void {
    this.budgets.set(budget.tenantId, { ...budget });
  }

  public getTenantTotalSpend(tenantId: string): number {
    return this.spendRecords
      .filter((r) => r.tenantId === tenantId)
      .reduce((acc, r) => acc + r.costUsd, 0);
  }
}
