import { Injectable, Logger } from '@nestjs/common';
import {
  AutonomyLevel,
  AUTONOMY_LEVEL_VALUES,
  KillSwitchStatusDto,
} from '../domain/orchestration.types';

export interface AutonomyEvaluationResult {
  allowed: boolean;
  effectiveAutonomyLevel: AutonomyLevel;
  requiresHumanApproval: boolean;
  killSwitchActive: boolean;
  reason: string;
}

@Injectable()
export class AutonomyPolicy {
  private readonly logger = new Logger(AutonomyPolicy.name);
  private automationEnabled: boolean;
  private lastUpdated: string;
  private lastUpdatedBy: string;

  constructor() {
    const envVal = process.env.LEARNING_ORCHESTRATION_AUTOMATION_ENABLED;
    this.automationEnabled = envVal === undefined ? true : envVal !== 'false';
    this.lastUpdated = new Date().toISOString();
    this.lastUpdatedBy = 'SYSTEM_STARTUP';
    this.logger.log(`AutonomyPolicy initialized. Automation enabled: ${this.automationEnabled}`);
  }

  isAutomationEnabled(): boolean {
    return this.automationEnabled;
  }

  setAutomationEnabled(enabled: boolean, updatedBy = 'ADMIN'): KillSwitchStatusDto {
    this.automationEnabled = enabled;
    this.lastUpdated = new Date().toISOString();
    this.lastUpdatedBy = updatedBy;
    this.logger.warn(`Emergency Kill Switch status updated: automationEnabled=${enabled} by ${updatedBy}`);
    return this.getKillSwitchStatus();
  }

  getKillSwitchStatus(): KillSwitchStatusDto {
    return {
      enabled: this.automationEnabled,
      lastUpdated: this.lastUpdated,
      updatedBy: this.lastUpdatedBy,
    };
  }

  evaluate(requestedLevel: AutonomyLevel, isSensitiveAction = false): AutonomyEvaluationResult {
    const killSwitchActive = !this.automationEnabled;

    if (killSwitchActive) {
      this.logger.warn(`Kill switch active: Forcing human approval for requested level ${requestedLevel}`);
      return {
        allowed: true,
        effectiveAutonomyLevel: 'RECOMMEND',
        requiresHumanApproval: true,
        killSwitchActive: true,
        reason: 'Emergency Kill Switch is ACTIVE. All automated executions downgraded to RECOMMEND (requires human approval).',
      };
    }

    const numericLevel = AUTONOMY_LEVEL_VALUES[requestedLevel] ?? 1;

    // Level 0: OBSERVE - purely telemetry, no execution
    if (numericLevel === 0) {
      return {
        allowed: true,
        effectiveAutonomyLevel: 'OBSERVE',
        requiresHumanApproval: false,
        killSwitchActive: false,
        reason: 'Autonomy Level OBSERVE: Telemetry and passive observation only.',
      };
    }

    // Level 1: RECOMMEND - always requires human approval
    if (numericLevel === 1) {
      return {
        allowed: true,
        effectiveAutonomyLevel: 'RECOMMEND',
        requiresHumanApproval: true,
        killSwitchActive: false,
        reason: 'Autonomy Level RECOMMEND: Workflow requires human-in-the-loop approval before execution.',
      };
    }

    // Level 2: SAFE_EXECUTE - automated low-risk actions
    if (numericLevel === 2) {
      if (isSensitiveAction) {
        return {
          allowed: true,
          effectiveAutonomyLevel: 'RECOMMEND',
          requiresHumanApproval: true,
          killSwitchActive: false,
          reason: 'Action marked sensitive. Level 2 SAFE_EXECUTE requires human approval for sensitive steps.',
        };
      }
      return {
        allowed: true,
        effectiveAutonomyLevel: 'SAFE_EXECUTE',
        requiresHumanApproval: false,
        killSwitchActive: false,
        reason: 'Autonomy Level SAFE_EXECUTE: Low-risk bounded action approved for automatic execution.',
      };
    }

    // Level 3: GOVERNED_ADAPTIVE - full ecosystem orchestration
    return {
      allowed: true,
      effectiveAutonomyLevel: 'GOVERNED_ADAPTIVE',
      requiresHumanApproval: isSensitiveAction,
      killSwitchActive: false,
      reason: isSensitiveAction
        ? 'Autonomy Level GOVERNED_ADAPTIVE requires human approval for designated high-impact action.'
        : 'Autonomy Level GOVERNED_ADAPTIVE: Governed multi-step coordination approved for automatic execution.',
    };
  }
}
