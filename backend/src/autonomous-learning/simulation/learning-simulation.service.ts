import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SimulationResult {
  actionType: string;
  predictedMasteryDelta: number;
  predictedRiskDelta: number;
  confidence: number;
  assumptions: string[];
}

@Injectable()
export class LearningSimulationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Simulates expected outcome of a candidate learning action.
   * Invariant: Simulation is prediction, NOT fact. Completely isolated from authoritative state.
   */
  async simulateAction(
    learnerId: string,
    actionType: string,
    parameters: Record<string, any> = {},
  ): Promise<SimulationResult> {
    let predictedMasteryDelta = 0.05;
    let predictedRiskDelta = -0.10;
    let confidence = 0.85;

    if (actionType === 'REMEDIATION') {
      predictedMasteryDelta = 0.12;
      predictedRiskDelta = -0.25;
      confidence = 0.88;
    } else if (actionType === 'GENERATE_HINT') {
      predictedMasteryDelta = 0.03;
      predictedRiskDelta = -0.05;
      confidence = 0.92;
    }

    return {
      actionType,
      predictedMasteryDelta,
      predictedRiskDelta,
      confidence,
      assumptions: [
        'Learner completes recommended steps',
        'Prior prerequisite concepts are retained',
      ],
    };
  }

  /**
   * Snapshots current digital learning twin state.
   */
  async saveTwinSnapshot(learnerId: string, tenantId: string, version: number, state: Record<string, any>) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningTwinSnapshot.create({
      data: {
        learnerId,
        tenantId,
        version,
        stateJson: JSON.stringify(state),
        confidence: 0.9,
      },
    });
  }
}
