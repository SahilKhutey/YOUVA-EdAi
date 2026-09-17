import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PersonalizationPolicy, PolicyRegistryEntry } from './personalization-types';

@Injectable()
export class PersonalizationPolicyService {
  private readonly logger = new Logger(PersonalizationPolicyService.name);
  private activePolicyVersion = 'POLICY_V2_ENHANCED';
  private readonly registry = new Map<string, PolicyRegistryEntry>();

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry(): void {
    const policyV1: PersonalizationPolicy = {
      version: 'POLICY_V1_BASELINE',
      remediationThreshold: 0.50,
      guidedPracticeThreshold: 0.70,
      standardPracticeThreshold: 0.80,
      extensionThreshold: 0.85,
      maxDifficultyJump: 0.25,
      retentionWindowDays: 14,
      confidenceThreshold: 0.50,
    };

    const policyV2: PersonalizationPolicy = {
      version: 'POLICY_V2_ENHANCED',
      remediationThreshold: 0.60,
      guidedPracticeThreshold: 0.75,
      standardPracticeThreshold: 0.85,
      extensionThreshold: 0.85,
      maxDifficultyJump: 0.20,
      retentionWindowDays: 7,
      confidenceThreshold: 0.70,
    };

    this.registerPolicy(policyV1, 'DEPRECATED');
    this.registerPolicy(policyV2, 'ACTIVE');
  }

  private registerPolicy(policy: PersonalizationPolicy, status: 'ACTIVE' | 'CANDIDATE' | 'DEPRECATED'): void {
    const serialized = JSON.stringify(policy);
    const checksumSha256 = crypto.createHash('sha256').update(serialized).digest('hex');
    const entry: PolicyRegistryEntry = {
      version: policy.version,
      status,
      deployedAt: new Date().toISOString(),
      policy,
      checksumSha256,
    };
    this.registry.set(policy.version, entry);
  }

  getActivePolicy(): PersonalizationPolicy {
    const entry = this.registry.get(this.activePolicyVersion);
    if (!entry) {
      throw new Error(`Active policy '${this.activePolicyVersion}' not found in registry`);
    }
    return entry.policy;
  }

  getActivePolicyVersion(): string {
    return this.activePolicyVersion;
  }

  getPolicyByVersion(version: string): PersonalizationPolicy | undefined {
    return this.registry.get(version)?.policy;
  }

  getAllPolicies(): PolicyRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Reversible Rollback (N10.34): Reverts active policy to verified prior version.
   */
  rollbackPolicy(targetVersion: string, authorizedBy = 'PersonalizationReviewBoard'): { success: boolean; activeVersion: string; timestamp: string } {
    const targetEntry = this.registry.get(targetVersion);
    if (!targetEntry) {
      throw new Error(`Rollback target version '${targetVersion}' does not exist in registry`);
    }

    const previousVersion = this.activePolicyVersion;
    const currentEntry = this.registry.get(previousVersion);
    if (currentEntry) {
      currentEntry.status = 'CANDIDATE';
    }

    targetEntry.status = 'ACTIVE';
    this.activePolicyVersion = targetVersion;

    const timestamp = new Date().toISOString();
    this.logger.warn(`Policy rollback executed by ${authorizedBy}: ${previousVersion} -> ${targetVersion} at ${timestamp}`);

    return {
      success: true,
      activeVersion: this.activePolicyVersion,
      timestamp,
    };
  }
}
