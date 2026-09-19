import { Module } from '@nestjs/common';
import { LearningStateEngineService } from './learning-state-engine.service';
import { MisconceptionInterventionService } from './misconception-intervention.service';
import { CognitiveMetacognitionService } from './cognitive-metacognition.service';
import { ThreeEvidenceGovernanceService } from './three-evidence-governance.service';
import { CognitivePersonalizationController } from './cognitive-personalization.controller';

@Module({
  controllers: [CognitivePersonalizationController],
  providers: [
    LearningStateEngineService,
    MisconceptionInterventionService,
    CognitiveMetacognitionService,
    ThreeEvidenceGovernanceService,
  ],
  exports: [
    LearningStateEngineService,
    MisconceptionInterventionService,
    CognitiveMetacognitionService,
    ThreeEvidenceGovernanceService,
  ],
})
export class CognitivePersonalizationModule {}
