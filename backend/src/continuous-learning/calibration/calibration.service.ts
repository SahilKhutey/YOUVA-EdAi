import { Injectable, Logger } from '@nestjs/common';
import { ImprovementDiscoveryService } from '../discovery/improvement-discovery.service';

export interface CalibrationResult {
  methodologyId: string;
  divergence: number;
  requiresRecalibration: boolean;
  calibrationCandidateId?: string;
  message: string;
}

@Injectable()
export class CalibrationService {
  private readonly logger = new Logger(CalibrationService.name);

  constructor(private readonly discoveryService: ImprovementDiscoveryService) {}

  async calibrateMethodology(dto: {
    tenantId?: string;
    methodologyId: string;
    simulatedMetric: number;
    actualMetric: number;
    sampleSize: number;
  }): Promise<CalibrationResult> {
    const tenantId = dto.tenantId ?? 'default-tenant';
    const divergence =
      dto.simulatedMetric !== 0
        ? Math.abs(dto.actualMetric - dto.simulatedMetric) / dto.simulatedMetric
        : 0;

    const divergencePct = (divergence * 100).toFixed(1);
    this.logger.log(`Calibrating methodology '${dto.methodologyId}': divergence=${divergencePct}% (n=${dto.sampleSize})`);

    // If divergence > 10%, flag for recalibration and create an improvement candidate
    if (divergence > 0.1) {
      const candidate = await this.discoveryService.createCandidate({
        tenantId,
        sourceType: 'MODEL_ERROR',
        sourceIds: [dto.methodologyId],
        targetType: 'METHODOLOGY_CALIBRATION',
        targetId: dto.methodologyId,
        proposal: {
          recommendedAdjustment: 'REWEIGHT_DIFFICULTY_COEFFICIENT',
          currentDivergencePct: divergencePct,
          observedSampleSize: dto.sampleSize,
        },
        expectedBenefits: ['Reduce simulation-actual discrepancy', 'Enhance predictive accuracy'],
        risks: ['Model recalibration requires offline validation'],
        assumptions: ['Learner population distribution stable across window'],
        evolutionLevel: 2, // Assistive level
      });

      return {
        methodologyId: dto.methodologyId,
        divergence: Number(divergence.toFixed(3)),
        requiresRecalibration: true,
        calibrationCandidateId: candidate.id,
        message: `Simulation-Actual divergence of ${divergencePct}% exceeds threshold (10%). Generated calibration candidate '${candidate.id}'.`,
      };
    }

    return {
      methodologyId: dto.methodologyId,
      divergence: Number(divergence.toFixed(3)),
      requiresRecalibration: false,
      message: `Simulation-Actual divergence of ${divergencePct}% is within acceptable tolerance (<=10%).`,
    };
  }
}
