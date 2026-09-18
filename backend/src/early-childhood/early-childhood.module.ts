import { Module } from '@nestjs/common';
import { AgePolicyService } from './age-policy.service';
import { PreschoolLearningService } from './preschool-learning.service';
import { ElementaryLearningService } from './elementary-learning.service';
import { PhysicalWorldLearningService } from './physical-world-learning.service';
import { ChildVoiceTutorService } from './child-voice-tutor.service';
import { ChildSafetyEngineService } from './child-safety-engine.service';
import { ParentConsentService } from './parent-consent.service';
import { ParentCoPilotService } from './parent-copilot.service';
import { ParentTeacherCoordinationService } from './parent-teacher-coordination.service';
import { ChildContentGovernanceService } from './child-content-governance.service';
import { DualPilotService } from './dual-pilot.service';
import { EarlyChildhoodController } from './early-childhood.controller';

@Module({
  controllers: [EarlyChildhoodController],
  providers: [
    AgePolicyService,
    PreschoolLearningService,
    ElementaryLearningService,
    PhysicalWorldLearningService,
    ChildVoiceTutorService,
    ChildSafetyEngineService,
    ParentConsentService,
    ParentCoPilotService,
    ParentTeacherCoordinationService,
    ChildContentGovernanceService,
    DualPilotService,
  ],
  exports: [
    AgePolicyService,
    PreschoolLearningService,
    ElementaryLearningService,
    PhysicalWorldLearningService,
    ChildVoiceTutorService,
    ChildSafetyEngineService,
    ParentConsentService,
    ParentCoPilotService,
    ParentTeacherCoordinationService,
    ChildContentGovernanceService,
    DualPilotService,
  ],
})
export class EarlyChildhoodModule {}
