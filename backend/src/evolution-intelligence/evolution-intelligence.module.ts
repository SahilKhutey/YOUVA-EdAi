import { Module } from '@nestjs/common';
import { LearningIntelligenceService } from './learning-intelligence.service';
import { ResearchEngineService } from './research-engine.service';
import { ContentIntelligenceService } from './content-intelligence.service';
import { AiTutorBenchmarkService } from './ai-tutor-benchmark.service';
import { EvolutionGovernanceService } from './evolution-governance.service';
import { EvolutionIntelligenceController } from './evolution-intelligence.controller';

@Module({
  controllers: [EvolutionIntelligenceController],
  providers: [
    LearningIntelligenceService,
    ResearchEngineService,
    ContentIntelligenceService,
    AiTutorBenchmarkService,
    EvolutionGovernanceService,
  ],
  exports: [
    LearningIntelligenceService,
    ResearchEngineService,
    ContentIntelligenceService,
    AiTutorBenchmarkService,
    EvolutionGovernanceService,
  ],
})
export class EvolutionIntelligenceModule {}
