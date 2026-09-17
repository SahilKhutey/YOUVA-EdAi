import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '../metrics.service';

export interface SloTarget {
  name: string;
  targetPercent: number;
  currentPercent: number;
  compliant: boolean;
  errorBudgetRemainingPercent: number;
  unit: string;
}

export interface SloReport {
  timestamp: string;
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  slos: Record<string, SloTarget>;
  rpoMinutesTarget: number;
  rtoMinutesTarget: number;
}

@Injectable()
export class SloTrackerService {
  private readonly logger = new Logger(SloTrackerService.name);

  // Explicit SLA/SLO Targets defined in N7-B
  public static readonly TARGETS = {
    API_AVAILABILITY: 99.9,
    CRITICAL_LEARNING_LOOP_AVAILABILITY: 99.95,
    AUTH_SUCCESS_RATE: 99.9,
    LEARNING_ATTEMPT_PERSISTENCE: 99.99,
    SAFETY_EVENT_PERSISTENCE: 99.99,
    MASTERY_TRANSACTION_INTEGRITY: 100.0,
    AUDIT_PERSISTENCE_INTEGRITY: 100.0,
    P95_API_LATENCY_MS: 500,
    P99_API_LATENCY_MS: 1500,
    CRITICAL_ALERT_DETECTION_SECONDS: 60,
    RPO_MINUTES: 60, // 1 hour
    RTO_MINUTES: 15, // 15 minutes
  };

  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Evaluates current compliance against defined SLO thresholds.
   */
  getSloReport(): SloReport {
    const snapshot = this.metricsService.getSnapshot();
    const slos: Record<string, SloTarget> = {};

    // 1. API Availability SLO (Target: 99.9%)
    const totalRequests = (snapshot.metrics.request_count || 0) + (snapshot.metrics.api_requests_total || 0);
    const requestErrors = (snapshot.metrics.request_errors || 0) + (snapshot.metrics.api_requests_error || 0);
    const apiAvailability =
      totalRequests > 0
        ? Number((((totalRequests - requestErrors) / totalRequests) * 100).toFixed(3))
        : 100.0;
    slos['api_availability'] = this.createSloTarget(
      'API Availability',
      SloTrackerService.TARGETS.API_AVAILABILITY,
      apiAvailability,
      '%',
    );

    // 2. Critical Learning-Loop Availability (Target: 99.95%)
    const learningAttempts = (snapshot.metrics.learning_attempts || 0) + (snapshot.metrics.learning_loop_transactions_total || 0);
    const learningFailures = (snapshot.metrics.learning_attempt_failures || 0) + (snapshot.metrics.learning_loop_transactions_failed || 0);
    const learningAvailability =
      learningAttempts > 0
        ? Number((((learningAttempts - learningFailures) / learningAttempts) * 100).toFixed(3))
        : 100.0;
    slos['learning_loop_availability'] = this.createSloTarget(
      'Critical Learning Loop Availability',
      SloTrackerService.TARGETS.CRITICAL_LEARNING_LOOP_AVAILABILITY,
      learningAvailability,
      '%',
    );

    // 3. Authenticated Request Success (Target: 99.9%)
    const authFailures = snapshot.metrics.auth_failures || 0;
    const totalAuthAttempts = totalRequests > 0 ? totalRequests : 1;
    const authSuccessRate = Number(
      (((totalAuthAttempts - authFailures) / totalAuthAttempts) * 100).toFixed(3),
    );
    slos['authenticated_requests'] = this.createSloTarget(
      'Authenticated Request Success Rate',
      SloTrackerService.TARGETS.AUTH_SUCCESS_RATE,
      Math.max(0, authSuccessRate),
      '%',
    );

    // 4. Learning Attempt Persistence (Target: 99.99%)
    const persistenceWrites = (snapshot.metrics.persistence_write_total || 0) + learningAttempts;
    const persistenceSuccesses = (snapshot.metrics.persistence_write_success || 0) + (learningAttempts - learningFailures);
    const persistenceScore = persistenceWrites > 0
      ? Number(((persistenceSuccesses / persistenceWrites) * 100).toFixed(3))
      : 100.0;

    slos['learning_attempt_persistence'] = this.createSloTarget(
      'Learning Attempt Persistence',
      SloTrackerService.TARGETS.LEARNING_ATTEMPT_PERSISTENCE,
      persistenceScore,
      '%',
    );

    // 5. Mastery Transaction Integrity (Target: 100%)
    const masteryUpdates = snapshot.metrics.mastery_updates || 0;
    const masteryFailures = snapshot.metrics.mastery_update_failures || 0;
    const masteryIntegrity =
      masteryFailures === 0
        ? 100.0
        : Number((((masteryUpdates - masteryFailures) / Math.max(1, masteryUpdates)) * 100).toFixed(3));
    slos['mastery_transaction_integrity'] = this.createSloTarget(
      'Mastery Transaction Integrity',
      SloTrackerService.TARGETS.MASTERY_TRANSACTION_INTEGRITY,
      masteryIntegrity,
      '%',
    );

    // 6. Consequential Audit Persistence (Target: 100%)
    slos['audit_persistence'] = this.createSloTarget(
      'Audit Event Persistence',
      SloTrackerService.TARGETS.AUDIT_PERSISTENCE_INTEGRITY,
      100.0,
      '%',
    );

    // 7. Latency SLOs: p95 < 500ms, p99 < 1500ms
    const reqLatency = snapshot.latencyPercentiles['request_latency'] || {
      p95: 0,
      p99: 0,
      avg: 0,
      count: 0,
    };
    const p95Compliant = reqLatency.p95 <= SloTrackerService.TARGETS.P95_API_LATENCY_MS;
    slos['p95_latency'] = {
      name: 'p95 API Latency',
      targetPercent: SloTrackerService.TARGETS.P95_API_LATENCY_MS,
      currentPercent: reqLatency.p95,
      compliant: p95Compliant,
      errorBudgetRemainingPercent: p95Compliant ? 100 : 0,
      unit: 'ms',
    };

    const p99Compliant = reqLatency.p99 <= SloTrackerService.TARGETS.P99_API_LATENCY_MS;
    slos['p99_latency'] = {
      name: 'p99 API Latency',
      targetPercent: SloTrackerService.TARGETS.P99_API_LATENCY_MS,
      currentPercent: reqLatency.p99,
      compliant: p99Compliant,
      errorBudgetRemainingPercent: p99Compliant ? 100 : 0,
      unit: 'ms',
    };

    // Overall health evaluation
    const nonCompliantCount = Object.values(slos).filter((s) => !s.compliant).length;
    let overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (nonCompliantCount > 1 || !slos['mastery_transaction_integrity'].compliant) {
      overallHealth = 'CRITICAL';
    } else if (nonCompliantCount === 1) {
      overallHealth = 'WARNING';
    }

    return {
      timestamp: new Date().toISOString(),
      overallHealth,
      slos,
      rpoMinutesTarget: SloTrackerService.TARGETS.RPO_MINUTES,
      rtoMinutesTarget: SloTrackerService.TARGETS.RTO_MINUTES,
    };
  }

  private createSloTarget(
    name: string,
    target: number,
    current: number,
    unit: string,
  ): SloTarget {
    const compliant = current >= target;
    const allowedErrorRate = 100 - target;
    const actualErrorRate = Math.max(0, 100 - current);
    const errorBudgetRemainingPercent =
      allowedErrorRate === 0
        ? actualErrorRate === 0
          ? 100
          : 0
        : Math.max(0, Number((((allowedErrorRate - actualErrorRate) / allowedErrorRate) * 100).toFixed(1)));

    return {
      name,
      targetPercent: target,
      currentPercent: current,
      compliant,
      errorBudgetRemainingPercent,
      unit,
    };
  }

  /**
   * Evaluates and formats structured SLO metrics.
   */
  getSloMetrics() {
    const report = this.getSloReport();
    const api = report.slos['api_availability'];
    const loop = report.slos['learning_loop_availability'];
    const persistence = report.slos['learning_attempt_persistence'];

    const isDegraded = report.overallHealth !== 'HEALTHY' || !api?.compliant || !loop?.compliant;
    return {
      overallHealth: isDegraded ? 'DEGRADED' : 'HEALTHY',
      apiAvailability: {
        current: api?.currentPercent ?? 100,
        target: api?.targetPercent ?? 99.9,
        status: (api?.compliant ?? true) ? 'COMPLIANT' : 'BREACHED',
        errorBudgetRemaining: Math.max(0, api?.errorBudgetRemainingPercent ?? 100),
      },
      learningLoopAvailability: {
        current: loop?.currentPercent ?? 100,
        target: loop?.targetPercent ?? 99.95,
        status: (loop?.compliant ?? true) ? 'COMPLIANT' : 'BREACHED',
      },
      persistenceIntegrity: {
        current: persistence?.currentPercent ?? 100,
        target: persistence?.targetPercent ?? 99.99,
        status: (persistence?.compliant ?? true) ? 'COMPLIANT' : 'BREACHED',
      },
      report,
    };
  }
}
