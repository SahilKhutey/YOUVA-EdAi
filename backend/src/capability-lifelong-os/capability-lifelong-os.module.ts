import { Module } from '@nestjs/common';
import { CapabilityGraphService } from './capability-graph.service';
import { LearnerGoalsPathwayService } from './learner-goals-pathway.service';
import { OpportunityOutcomeIntelligenceService } from './opportunity-outcome-intelligence.service';
import { AiCapabilityCoachService } from './ai-capability-coach.service';
import { CapabilityLifelongOsController } from './capability-lifelong-os.controller';

@Module({
  controllers: [CapabilityLifelongOsController],
  providers: [
    CapabilityGraphService,
    LearnerGoalsPathwayService,
    OpportunityOutcomeIntelligenceService,
    AiCapabilityCoachService,
  ],
  exports: [
    CapabilityGraphService,
    LearnerGoalsPathwayService,
    OpportunityOutcomeIntelligenceService,
    AiCapabilityCoachService,
  ],
})
export class CapabilityLifelongOsModule {}
