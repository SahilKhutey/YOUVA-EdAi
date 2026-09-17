import { Controller, Get, Param, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { SloTrackerService } from './slo/slo-tracker.service';

@Controller('observability')
export class ObservabilityController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly sloTrackerService: SloTrackerService,
  ) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getPrometheusMetrics(): string {
    return this.metricsService.toPrometheusFormat();
  }

  @Get('snapshot')
  getSnapshot() {
    return this.metricsService.getSnapshot();
  }

  @Get('slo')
  getSloReport() {
    return this.sloTrackerService.getSloReport();
  }

  @Get('dashboard/:role')
  getRoleDashboard(@Param('role') role: string) {
    const snapshot = this.metricsService.getSnapshot();
    const slo = this.sloTrackerService.getSloReport();

    switch (role.toLowerCase()) {
      case 'executive':
        return {
          role: 'executive',
          timestamp: snapshot.timestamp,
          overallHealth: slo.overallHealth,
          apiAvailability: slo.slos.api_availability?.currentPercent,
          learningLoopAvailability: slo.slos.learning_loop_availability?.currentPercent,
          totalLearningAttempts: snapshot.metrics.learning_attempts,
          totalAiCostUsd: snapshot.metrics.ai_cost,
          totalSafetyEvents: snapshot.metrics.safety_events,
          criticalAlerts: 0,
        };

      case 'safety':
        return {
          role: 'safety',
          timestamp: snapshot.timestamp,
          safetyEvents: snapshot.metrics.safety_events,
          safetyEscalations: snapshot.metrics.safety_escalations,
          teacherInterventions: snapshot.metrics.teacher_interventions,
          authFailures: snapshot.metrics.auth_failures,
          tenantIsolationFailures: snapshot.metrics.tenant_isolation_failures,
          unresolvedCriticalEvents: 0,
        };

      case 'learning':
        return {
          role: 'learning',
          timestamp: snapshot.timestamp,
          learningAttempts: snapshot.metrics.learning_attempts,
          learningAttemptFailures: snapshot.metrics.learning_attempt_failures,
          masteryUpdates: snapshot.metrics.mastery_updates,
          masteryIntegrity: slo.slos.mastery_transaction_integrity?.currentPercent,
          teacherInterventions: snapshot.metrics.teacher_interventions,
        };

      case 'engineering':
      default:
        return {
          role: 'engineering',
          timestamp: snapshot.timestamp,
          slo,
          latency: snapshot.latencyPercentiles,
          gauges: snapshot.gauges,
          counters: snapshot.metrics,
        };
    }
  }
}
