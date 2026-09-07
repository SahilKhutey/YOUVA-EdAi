import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { LearningOperationsController } from './operations/learning-operations.controller';

// Services
import { LearningOperationsService } from './operations/learning-operations.service';
import { LearningSignalService } from './signals/signal.service';
import { RiskDetectionService } from './risk/risk.service';
import { OpportunityDetectionService } from './opportunity/opportunity.service';
import { InterventionOrchestratorService } from './intervention/intervention-orchestrator.service';
import { InterventionEvaluationService } from './evaluation/intervention-evaluation.service';
import { TeacherPriorityService } from './teacher-priority/teacher-priority.service';
import { InstitutionalSignalService } from './institutional/institutional.service';
import { PolicyRecommendationService } from './policy/policy-recommendation.service';
import { LearningOperationsWorker } from './operations/learning-operations-worker.service';

@Module({
  imports: [PrismaModule],
  controllers: [LearningOperationsController],
  providers: [
    LearningOperationsService,
    LearningSignalService,
    RiskDetectionService,
    OpportunityDetectionService,
    InterventionOrchestratorService,
    InterventionEvaluationService,
    TeacherPriorityService,
    InstitutionalSignalService,
    PolicyRecommendationService,
    LearningOperationsWorker,
  ],
  exports: [
    LearningOperationsService,
    LearningSignalService,
    RiskDetectionService,
    OpportunityDetectionService,
    InterventionOrchestratorService,
    InterventionEvaluationService,
  ],
})
export class LearningOperationsModule {}
