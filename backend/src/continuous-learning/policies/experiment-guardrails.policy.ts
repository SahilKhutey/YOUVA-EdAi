import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LearningExperimentDto } from '../domain/evolution.types';

export interface GuardrailCheckResult {
  breached: boolean;
  reason?: string;
  metric?: string;
  threshold?: number;
  observed?: number;
}

@Injectable()
export class ExperimentGuardrailsPolicy {
  private readonly logger = new Logger(ExperimentGuardrailsPolicy.name);

  validateExperimentDefinition(dto: Partial<LearningExperimentDto>): void {
    if (!dto.hypothesis || dto.hypothesis.trim().length === 0) {
      throw new BadRequestException('Experiment requires an explicit testable hypothesis.');
    }

    if (!dto.successMetrics || dto.successMetrics.length === 0) {
      throw new BadRequestException('Experiment requires at least one primary success metric.');
    }

    if (!dto.guardrails || dto.guardrails.length === 0) {
      throw new BadRequestException('Experiment requires non-degradation guardrails before activation.');
    }
  }

  checkGuardrails(
    experiment: LearningExperimentDto,
    currentMetrics: Record<string, number>,
  ): GuardrailCheckResult {
    // 1. Abandonment threshold guardrail
    const abandonmentRate = currentMetrics['abandonmentRate'] ?? 0;
    if (abandonmentRate > 0.15) {
      const reason = `Guardrail Breached: Observed abandonment rate (${(abandonmentRate * 100).toFixed(1)}%) exceeded critical safety threshold (15.0%).`;
      this.logger.warn(`Experiment '${experiment.id}' guardrail failure: ${reason}`);
      return {
        breached: true,
        reason,
        metric: 'abandonmentRate',
        threshold: 0.15,
        observed: abandonmentRate,
      };
    }

    // 2. Failure rate surge guardrail
    const failureRateDelta = currentMetrics['failureRateDelta'] ?? 0;
    if (failureRateDelta > 0.05) {
      const reason = `Guardrail Breached: Failure rate surge (+${(failureRateDelta * 100).toFixed(1)}%) exceeds allowable limit (+5.0%).`;
      this.logger.warn(`Experiment '${experiment.id}' guardrail failure: ${reason}`);
      return {
        breached: true,
        reason,
        metric: 'failureRateDelta',
        threshold: 0.05,
        observed: failureRateDelta,
      };
    }

    // 3. Minimum sample size for statistical validity
    const sampleSize = currentMetrics['sampleSize'] ?? 0;
    if (sampleSize > 0 && sampleSize < 30) {
      // Not a breach causing auto-stop, but noted in telemetry
      this.logger.debug(`Experiment '${experiment.id}' sample size (${sampleSize}) below standard sample limit (30).`);
    }

    return { breached: false };
  }
}
