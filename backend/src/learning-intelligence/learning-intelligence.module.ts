import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InsightEngineService } from './services/insight-engine.service';
import { KnowledgeQualityService } from './services/knowledge-quality.service';
import { CurriculumIntelligenceService } from './services/curriculum-intelligence.service';
import { RecommendationService } from './services/recommendation.service';
import { ExperimentService } from './services/experiment.service';
import { LearningGovernanceService } from './services/governance.service';
import { LearningIntelligenceService } from './services/learning-intelligence.service';
import { LearningIntelligenceController } from './controllers/learning-intelligence.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LearningIntelligenceController],
  providers: [
    InsightEngineService,
    KnowledgeQualityService,
    CurriculumIntelligenceService,
    RecommendationService,
    ExperimentService,
    LearningGovernanceService,
    LearningIntelligenceService,
  ],
  exports: [
    InsightEngineService,
    KnowledgeQualityService,
    CurriculumIntelligenceService,
    RecommendationService,
    ExperimentService,
    LearningGovernanceService,
    LearningIntelligenceService,
  ],
})
export class LearningIntelligenceModule {}
