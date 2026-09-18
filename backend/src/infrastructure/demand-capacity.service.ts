import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DemandClass, WorkloadCapacityProfile } from './n14-types';

@Injectable()
export class DemandCapacityService {
  private readonly logger = new Logger(DemandCapacityService.name);
  private currentDemandClass: DemandClass = 'D1_EARLY_PILOT';

  private readonly profiles: Record<DemandClass, WorkloadCapacityProfile> = {
    D0_NO_DEMAND: {
      demandClass: 'D0_NO_DEMAND',
      maxConcurrentLearners: 5,
      requestsPerMinuteLimit: 60,
      dbConnectionPoolSize: 5,
      redisPoolSize: 5,
      p50TargetMs: 200,
      p90TargetMs: 400,
      p95TargetMs: 600,
      p99TargetMs: 1500,
      monthlyAiBudgetUsd: 10,
      dedicatedDbRequired: false,
    },
    D1_EARLY_PILOT: {
      demandClass: 'D1_EARLY_PILOT',
      maxConcurrentLearners: 50,
      requestsPerMinuteLimit: 300,
      dbConnectionPoolSize: 15,
      redisPoolSize: 10,
      p50TargetMs: 150,
      p90TargetMs: 350,
      p95TargetMs: 500,
      p99TargetMs: 1200,
      monthlyAiBudgetUsd: 150,
      dedicatedDbRequired: false,
    },
    D2_REPEAT_PAID: {
      demandClass: 'D2_REPEAT_PAID',
      maxConcurrentLearners: 250,
      requestsPerMinuteLimit: 1500,
      dbConnectionPoolSize: 30,
      redisPoolSize: 25,
      p50TargetMs: 120,
      p90TargetMs: 300,
      p95TargetMs: 450,
      p99TargetMs: 1000,
      monthlyAiBudgetUsd: 500,
      dedicatedDbRequired: false,
    },
    D3_INSTITUTIONAL: {
      demandClass: 'D3_INSTITUTIONAL',
      maxConcurrentLearners: 1000,
      requestsPerMinuteLimit: 6000,
      dbConnectionPoolSize: 60,
      redisPoolSize: 50,
      p50TargetMs: 100,
      p90TargetMs: 250,
      p95TargetMs: 400,
      p99TargetMs: 900,
      monthlyAiBudgetUsd: 2000,
      dedicatedDbRequired: false,
    },
    D4_MULTI_INSTITUTION: {
      demandClass: 'D4_MULTI_INSTITUTION',
      maxConcurrentLearners: 5000,
      requestsPerMinuteLimit: 30000,
      dbConnectionPoolSize: 120,
      redisPoolSize: 100,
      p50TargetMs: 80,
      p90TargetMs: 200,
      p95TargetMs: 350,
      p99TargetMs: 800,
      monthlyAiBudgetUsd: 8000,
      dedicatedDbRequired: false,
    },
    D5_LARGE_SCALE: {
      demandClass: 'D5_LARGE_SCALE',
      maxConcurrentLearners: 20000,
      requestsPerMinuteLimit: 120000,
      dbConnectionPoolSize: 300,
      redisPoolSize: 250,
      p50TargetMs: 70,
      p90TargetMs: 180,
      p95TargetMs: 300,
      p99TargetMs: 700,
      monthlyAiBudgetUsd: 25000,
      dedicatedDbRequired: true,
    },
  };

  public getCapacityProfile(demandClass?: DemandClass): WorkloadCapacityProfile {
    const target = demandClass || this.currentDemandClass;
    return this.profiles[target];
  }

  public setDemandClass(newClass: DemandClass): void {
    this.currentDemandClass = newClass;
    this.logger.log(`Updated authoritative platform demand class to: ${newClass}`);
  }

  public evaluateWorkloadDemand(concurrentLearners: number, requestsPerMinute: number): {
    evaluatedClass: DemandClass;
    recommendedProfile: WorkloadCapacityProfile;
    isCapacityUpgradeJustified: boolean;
  } {
    let evaluatedClass: DemandClass = 'D0_NO_DEMAND';

    if (concurrentLearners > 5000 || requestsPerMinute > 30000) {
      evaluatedClass = 'D5_LARGE_SCALE';
    } else if (concurrentLearners > 1000 || requestsPerMinute > 6000) {
      evaluatedClass = 'D4_MULTI_INSTITUTION';
    } else if (concurrentLearners > 250 || requestsPerMinute > 1500) {
      evaluatedClass = 'D3_INSTITUTIONAL';
    } else if (concurrentLearners > 50 || requestsPerMinute > 300) {
      evaluatedClass = 'D2_REPEAT_PAID';
    } else if (concurrentLearners > 5 || requestsPerMinute > 60) {
      evaluatedClass = 'D1_EARLY_PILOT';
    }

    const recommendedProfile = this.profiles[evaluatedClass];
    const isCapacityUpgradeJustified =
      this.getNumericTier(evaluatedClass) > this.getNumericTier(this.currentDemandClass);

    return {
      evaluatedClass,
      recommendedProfile,
      isCapacityUpgradeJustified,
    };
  }

  public assertDemandGateApproval(requestedFeature: 'DEDICATED_DATABASE' | 'ENTERPRISE_AI_CLUSTER'): boolean {
    // Invariant Clause N14.2: Dedicated hardware or massive clusters cannot be provisioned under low demand
    if (requestedFeature === 'DEDICATED_DATABASE') {
      if (this.currentDemandClass !== 'D5_LARGE_SCALE') {
        throw new BadRequestException(
          `DEMAND-GATE-REJECTED: Dedicated database requires demonstrated demand tier D5_LARGE_SCALE (Current: ${this.currentDemandClass})`
        );
      }
    }
    if (requestedFeature === 'ENTERPRISE_AI_CLUSTER') {
      if (
        this.currentDemandClass !== 'D4_MULTI_INSTITUTION' &&
        this.currentDemandClass !== 'D5_LARGE_SCALE'
      ) {
        throw new BadRequestException(
          `DEMAND-GATE-REJECTED: Dedicated enterprise AI cluster requires D4+ demand (Current: ${this.currentDemandClass})`
        );
      }
    }
    return true;
  }

  public calculateCostPerLearningOutcome(params: {
    totalInfrastructureCostUsd: number;
    totalAiCostUsd: number;
    validatedMasteryProgressionsCount: number;
  }): { costPerOutcomeUsd: number; efficiencyRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_OPTIMIZATION' } {
    if (params.validatedMasteryProgressionsCount <= 0) {
      return { costPerOutcomeUsd: 0, efficiencyRating: 'NEEDS_OPTIMIZATION' };
    }

    const totalCost = params.totalInfrastructureCostUsd + params.totalAiCostUsd;
    const costPerOutcome = Number(
      (totalCost / params.validatedMasteryProgressionsCount).toFixed(4)
    );

    let efficiencyRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_OPTIMIZATION' = 'GOOD';
    if (costPerOutcome <= 0.05) {
      efficiencyRating = 'EXCELLENT';
    } else if (costPerOutcome > 0.25) {
      efficiencyRating = 'NEEDS_OPTIMIZATION';
    }

    return {
      costPerOutcomeUsd: costPerOutcome,
      efficiencyRating,
    };
  }

  private getNumericTier(demandClass: DemandClass): number {
    switch (demandClass) {
      case 'D0_NO_DEMAND': return 0;
      case 'D1_EARLY_PILOT': return 1;
      case 'D2_REPEAT_PAID': return 2;
      case 'D3_INSTITUTIONAL': return 3;
      case 'D4_MULTI_INSTITUTION': return 4;
      case 'D5_LARGE_SCALE': return 5;
    }
  }
}
