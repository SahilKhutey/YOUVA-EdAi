import { Injectable } from '@nestjs/common';
import { DriftReport, ModelMetrics } from './governance.types';

@Injectable()
export class ModelDriftService {
  public static readonly SAFETY_DRIFT_THRESHOLD = 0.05; // 5% maximum allowable drop in safety
  public static readonly GENERAL_DRIFT_THRESHOLD = 0.15; // 15% maximum allowable drop before rollback
  public static readonly MONITORING_THRESHOLD = 0.08; // 8% drift triggers active monitoring

  /**
   * Calculates relative drift between baseline and current metric.
   */
  calculateRelativeDrift(baseline: number, current: number): number {
    if (baseline === 0) {
      return Number(Math.abs(current).toFixed(4));
    }
    const drift = Math.abs(baseline - current) / baseline;
    return Number(drift.toFixed(4));
  }

  /**
   * Evaluates drift across model dimensions and recommends operational actions.
   */
  evaluateDrift(baseline: ModelMetrics, current: ModelMetrics): DriftReport {
    const drift: Record<string, number> = {
      correctness: this.calculateRelativeDrift(baseline.correctness, current.correctness),
      safety: this.calculateRelativeDrift(baseline.safety, current.safety),
      helpfulness: this.calculateRelativeDrift(baseline.helpfulness, current.helpfulness),
    };

    if (baseline.ageAppropriateness !== undefined && current.ageAppropriateness !== undefined) {
      drift.ageAppropriateness = this.calculateRelativeDrift(
        baseline.ageAppropriateness,
        current.ageAppropriateness,
      );
    }

    // Safety is an invariant: any drop in safety exceeding 5% triggers immediate rollback recommendation
    const safetyDegraded = current.safety < baseline.safety && drift.safety > ModelDriftService.SAFETY_DRIFT_THRESHOLD;
    const maxGeneralDrift = Math.max(...Object.values(drift));

    let criticalViolation = false;
    let healthy = true;
    let recommendation: DriftReport['recommendation'] = 'NORMAL_OPERATION';

    if (safetyDegraded) {
      criticalViolation = true;
      healthy = false;
      recommendation = 'TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION';
    } else if (maxGeneralDrift > ModelDriftService.GENERAL_DRIFT_THRESHOLD) {
      healthy = false;
      recommendation = 'TRIGGER_ROLLBACK_TO_PREVIOUS_VERSION';
    } else if (maxGeneralDrift > ModelDriftService.MONITORING_THRESHOLD) {
      recommendation = 'FLAG_FOR_MONITORING';
    }

    return {
      healthy,
      criticalViolation,
      drift,
      recommendation,
      timestamp: new Date().toISOString(),
    };
  }
}
