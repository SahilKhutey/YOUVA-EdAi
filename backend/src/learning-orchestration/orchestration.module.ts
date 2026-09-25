import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';
import { PersonalizationModule } from '../personalization/personalization.module';
import { CandidateDeduplicator } from './candidate/candidate.deduplicator';
import { CandidateService } from './candidate/candidate.service';
import { ConstraintEngine } from './constraints/constraint.engine';
import { DecisionEngine } from './decision/decision.engine';
import { InterventionService } from './intervention/intervention.service';
import { RemediationService } from './remediation/remediation.service';
import { AdaptiveSessionService } from './session/adaptive-session.service';
import { OrchestrationService } from './orchestration.service';
import { OrchestrationController } from './orchestration.controller';

// LKC-13 Ecosystem Orchestrator (LEO) components
import { AutonomyPolicy } from './policies/autonomy-policy';
import { ScopePolicy } from './policies/scope-policy';
import { LoopPreventionPolicy } from './policies/loop-prevention.policy';
import { WorkflowRegistryService } from './workflows/workflow-registry.service';
import { WorkflowExecutorService } from './workflows/workflow-executor.service';
import { EscalationService } from './services/escalation.service';
import { EcosystemOrchestratorService } from './services/ecosystem-orchestrator.service';
import { EcosystemOrchestrationController } from './controllers/ecosystem-orchestration.controller';
import { WorkflowRegistryController } from './controllers/workflow-registry.controller';
import { EscalationController } from './controllers/escalation.controller';

@Module({
  imports: [PrismaModule, KnowledgeGraphModule, PersonalizationModule],
  controllers: [
    OrchestrationController,
    EcosystemOrchestrationController,
    WorkflowRegistryController,
    EscalationController,
  ],
  providers: [
    CandidateDeduplicator,
    CandidateService,
    ConstraintEngine,
    DecisionEngine,
    InterventionService,
    RemediationService,
    AdaptiveSessionService,
    OrchestrationService,
    // LKC-13
    AutonomyPolicy,
    ScopePolicy,
    LoopPreventionPolicy,
    WorkflowRegistryService,
    WorkflowExecutorService,
    EscalationService,
    EcosystemOrchestratorService,
  ],
  exports: [
    CandidateDeduplicator,
    CandidateService,
    ConstraintEngine,
    DecisionEngine,
    InterventionService,
    RemediationService,
    AdaptiveSessionService,
    OrchestrationService,
    // LKC-13
    AutonomyPolicy,
    ScopePolicy,
    LoopPreventionPolicy,
    WorkflowRegistryService,
    WorkflowExecutorService,
    EscalationService,
    EcosystemOrchestratorService,
  ],
})
export class OrchestrationModule {}
