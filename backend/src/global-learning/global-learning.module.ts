import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LearningGraphService } from './graph/learning-graph.service';
import { GlobalGraphController } from './graph/learning-graph.controller';
import { CurriculumService } from './curriculum/curriculum.service';
import { CurriculumController } from './curriculum/curriculum.controller';
import { ModelRoutingService } from './models/model-routing.service';
import { ModelEvaluationService } from './models/model-evaluation.service';
import { ExperimentService } from './research/experiment.service';
import { LearnerIntelligenceService } from './learner/learner-intelligence.service';
import { OfflineService } from './offline/offline.service';
import { GlobalLearningController } from './global-learning.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    GlobalGraphController,
    CurriculumController,
    GlobalLearningController,
  ],
  providers: [
    LearningGraphService,
    CurriculumService,
    ModelRoutingService,
    ModelEvaluationService,
    ExperimentService,
    LearnerIntelligenceService,
    OfflineService,
  ],
  exports: [
    LearningGraphService,
    CurriculumService,
    ModelRoutingService,
    ModelEvaluationService,
    ExperimentService,
    LearnerIntelligenceService,
    OfflineService,
  ],
})
export class GlobalLearningModule {}
