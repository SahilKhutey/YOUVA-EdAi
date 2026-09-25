import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CalibrationService } from './calibration/calibration.service';
import { DriftController } from './controllers/drift.controller';
import { EvaluationController } from './controllers/evaluation.controller';
import { EvolutionMemoryController } from './controllers/evolution-memory.controller';
import { ExperimentController } from './controllers/experiment.controller';
import { ImprovementController } from './controllers/improvement.controller';
import { MethodologyController } from './controllers/methodology.controller';
import { RolloutController } from './controllers/rollout.controller';
import { ImprovementDiscoveryService } from './discovery/improvement-discovery.service';
import { DriftDetectionService } from './drift/drift-detection.service';
import { ContinuousEvaluationService } from './evaluation/continuous-evaluation.service';
import { ExperimentService } from './experiments/experiment.service';
import { EvolutionMemoryService } from './memory/evolution-memory.service';
import { EvolutionPolicyService } from './policies/evolution-policy.service';
import { ExperimentGuardrailsPolicy } from './policies/experiment-guardrails.policy';
import { MethodologyRegistryService } from './registry/methodology-registry.service';
import { RollbackService } from './rollout/rollback.service';
import { RolloutService } from './rollout/rollout.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    EvaluationController,
    ImprovementController,
    ExperimentController,
    MethodologyController,
    DriftController,
    RolloutController,
    EvolutionMemoryController,
  ],
  providers: [
    EvolutionPolicyService,
    ExperimentGuardrailsPolicy,
    ContinuousEvaluationService,
    ImprovementDiscoveryService,
    ExperimentService,
    MethodologyRegistryService,
    DriftDetectionService,
    CalibrationService,
    RolloutService,
    RollbackService,
    EvolutionMemoryService,
  ],
  exports: [
    EvolutionPolicyService,
    ExperimentGuardrailsPolicy,
    ContinuousEvaluationService,
    ImprovementDiscoveryService,
    ExperimentService,
    MethodologyRegistryService,
    DriftDetectionService,
    CalibrationService,
    RolloutService,
    RollbackService,
    EvolutionMemoryService,
  ],
})
export class ContinuousLearningModule {}
