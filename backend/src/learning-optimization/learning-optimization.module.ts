import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActionPlannerService } from './services/action-planner.service';
import { ExecutionService } from './services/execution.service';
import { OutcomeService } from './services/outcome.service';
import { EvaluationService } from './services/evaluation.service';
import { KnowledgeEvolutionService } from './services/knowledge-evolution.service';
import { AutomationService } from './services/automation.service';
import { ImprovementOrchestratorService } from './services/improvement-orchestrator.service';
import { OptimizationService } from './services/optimization.service';
import { ImprovementController } from './controllers/improvement.controller';
import { EvaluationController } from './controllers/evaluation.controller';
import { KnowledgeEvolutionController } from './controllers/knowledge-evolution.controller';
import { AutomationController } from './controllers/automation.controller';
import { OptimizationController } from './controllers/optimization.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ImprovementController,
    EvaluationController,
    KnowledgeEvolutionController,
    AutomationController,
    OptimizationController,
  ],
  providers: [
    ActionPlannerService,
    ExecutionService,
    OutcomeService,
    EvaluationService,
    KnowledgeEvolutionService,
    AutomationService,
    ImprovementOrchestratorService,
    OptimizationService,
  ],
  exports: [
    ActionPlannerService,
    ExecutionService,
    OutcomeService,
    EvaluationService,
    KnowledgeEvolutionService,
    AutomationService,
    ImprovementOrchestratorService,
    OptimizationService,
  ],
})
export class LearningOptimizationModule {}
