import { OutcomeClassification } from '../domain/outcome';
import { GuardrailMetric, SuccessCriteria } from '../domain/improvement-plan';
import { GuardrailEvaluationResult } from '../domain/evaluation';

export class EvaluationPolicy {
  public static readonly MINIMUM_EVALUATION_SAMPLE_SIZE = 10;

  /**
   * Evaluates if sample size is sufficient for statistical confidence.
   */
  static hasSufficientSample(sampleSize: number, criteriaMinSample?: number): boolean {
    const threshold = Math.max(
      this.MINIMUM_EVALUATION_SAMPLE_SIZE,
      criteriaMinSample || this.MINIMUM_EVALUATION_SAMPLE_SIZE,
    );
    return sampleSize >= threshold;
  }

  /**
   * Evaluates guardrail metrics against acceptable tolerance.
   */
  static evaluateGuardrails(
    guardrails: GuardrailMetric[],
    observedMetrics: Record<string, number>,
    baselineMetrics: Record<string, number>,
  ): GuardrailEvaluationResult[] {
    return guardrails.map((g) => {
      const baseline = baselineMetrics[g.metric] ?? 0;
      const observed = observedMetrics[g.metric] ?? baseline;
      const delta = observed - baseline;

      let passed = true;
      if (g.targetDirection === 'INCREASE') {
        // e.g., retention shouldn't drop by more than tolerance
        passed = delta >= -g.acceptableTolerance;
      } else if (g.targetDirection === 'DECREASE') {
        // e.g., abandonment shouldn't increase by more than tolerance
        passed = delta <= g.acceptableTolerance;
      } else {
        // STABILIZE: deviation within tolerance
        passed = Math.abs(delta) <= g.acceptableTolerance;
      }

      return {
        metric: g.metric,
        baselineValue: baseline,
        observedValue: observed,
        delta,
        acceptableTolerance: g.acceptableTolerance,
        passed,
      };
    });
  }

  /**
   * Classifies outcome based on primary metric delta and guardrail results.
   * Avoids false causality by classifying observed signals rather than definitive proof.
   */
  static classifyOutcome(
    criteria: SuccessCriteria,
    baselineValue: number,
    observedValue: number,
    sampleSize: number,
    guardrailResults: GuardrailEvaluationResult[],
  ): OutcomeClassification {
    if (!this.hasSufficientSample(sampleSize, criteria.minimumSampleSize)) {
      return 'INSUFFICIENT_DATA';
    }

    const delta = observedValue - baselineValue;
    const allGuardrailsPassed = guardrailResults.every((r) => r.passed);

    let primaryImproved = false;
    if (criteria.targetDirection === 'INCREASE') {
      primaryImproved = delta > 0 && observedValue >= criteria.targetValue;
    } else if (criteria.targetDirection === 'DECREASE') {
      primaryImproved = delta < 0 && observedValue <= criteria.targetValue;
    } else {
      primaryImproved = Math.abs(delta) <= 0.05;
    }

    if (primaryImproved && allGuardrailsPassed) {
      return 'POSITIVE_SIGNAL';
    }

    if (!primaryImproved && !allGuardrailsPassed) {
      return 'NEGATIVE_SIGNAL';
    }

    if (primaryImproved && !allGuardrailsPassed) {
      return 'MIXED_RESULT';
    }

    // delta negligible
    if (Math.abs(delta) < 0.02) {
      return 'NO_CLEAR_CHANGE';
    }

    return 'NEGATIVE_SIGNAL';
  }
}
