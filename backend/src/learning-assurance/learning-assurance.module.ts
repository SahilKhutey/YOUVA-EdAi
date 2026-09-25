import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Policies
import { RepairPolicy } from './policies/repair-policy';
import { WaiverPolicy } from './policies/waiver-policy';

// Rule Registry
import { RuleRegistryService } from './rules/registry/rule-registry.service';

// Domain Evaluators
import { KnowledgeAssuranceEvaluator } from './rules/evaluators/knowledge-assurance.evaluator';
import { LearningAssuranceEvaluator } from './rules/evaluators/learning-assurance.evaluator';
import { AssessmentAssuranceEvaluator } from './rules/evaluators/assessment-assurance.evaluator';
import { AIAssuranceEvaluator } from './rules/evaluators/ai-assurance.evaluator';
import { PersonalizationAssuranceEvaluator } from './rules/evaluators/personalization-assurance.evaluator';
import { OrchestrationAssuranceEvaluator } from './rules/evaluators/orchestration-assurance.evaluator';
import { DataAssuranceEvaluator } from './rules/evaluators/data-assurance.evaluator';
import { SecurityAssuranceEvaluator } from './rules/evaluators/security-assurance.evaluator';
import { OperationsAssuranceEvaluator } from './rules/evaluators/operations-assurance.evaluator';

// Core Services
import { FindingService } from './services/finding.service';
import { AssuranceEvaluationService } from './services/assurance-evaluation.service';
import { AssuranceGatesService } from './services/assurance-gates.service';
import { ReconciliationService } from './services/reconciliation.service';
import { RepairService } from './services/repair.service';

// Controllers
import { AssuranceController } from './controllers/assurance.controller';
import { FindingController } from './controllers/finding.controller';
import { RuleRegistryController } from './controllers/rule-registry.controller';
import { ReconciliationController } from './controllers/reconciliation.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AssuranceController,
    FindingController,
    RuleRegistryController,
    ReconciliationController,
  ],
  providers: [
    // Policies
    RepairPolicy,
    WaiverPolicy,

    // Rule Registry
    RuleRegistryService,

    // Domain Evaluators
    KnowledgeAssuranceEvaluator,
    LearningAssuranceEvaluator,
    AssessmentAssuranceEvaluator,
    AIAssuranceEvaluator,
    PersonalizationAssuranceEvaluator,
    OrchestrationAssuranceEvaluator,
    DataAssuranceEvaluator,
    SecurityAssuranceEvaluator,
    OperationsAssuranceEvaluator,

    // Core Services
    FindingService,
    AssuranceEvaluationService,
    AssuranceGatesService,
    ReconciliationService,
    RepairService,
  ],
  exports: [
    RepairPolicy,
    WaiverPolicy,
    RuleRegistryService,
    FindingService,
    AssuranceEvaluationService,
    AssuranceGatesService,
    ReconciliationService,
    RepairService,
    KnowledgeAssuranceEvaluator,
    LearningAssuranceEvaluator,
    AssessmentAssuranceEvaluator,
    AIAssuranceEvaluator,
    PersonalizationAssuranceEvaluator,
    OrchestrationAssuranceEvaluator,
    DataAssuranceEvaluator,
    SecurityAssuranceEvaluator,
    OperationsAssuranceEvaluator,
  ],
})
export class LearningAssuranceModule {}
