import { Module } from '@nestjs/common';
import { CapabilityTranslationService } from './capability-translation.service';
import { CapabilityMobilityService } from './capability-mobility.service';
import { CollectiveLearningContributionService } from './collective-learning-contribution.service';
import { KnowledgeNetworkCurriculumService } from './knowledge-network-curriculum.service';
import { CapabilityMobilityController } from './capability-mobility.controller';

@Module({
  controllers: [CapabilityMobilityController],
  providers: [
    CapabilityTranslationService,
    CapabilityMobilityService,
    CollectiveLearningContributionService,
    KnowledgeNetworkCurriculumService,
  ],
  exports: [
    CapabilityTranslationService,
    CapabilityMobilityService,
    CollectiveLearningContributionService,
    KnowledgeNetworkCurriculumService,
  ],
})
export class CapabilityMobilityModule {}
