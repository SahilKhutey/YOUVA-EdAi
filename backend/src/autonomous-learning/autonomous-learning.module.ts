import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { AutonomousLearningController } from './autonomous-learning.controller';

// Services
import { LearningPolicyService } from './policy/learning-policy.service';
import { NextBestActionService } from './optimization/next-best-action.service';
import { PredictiveLearningService } from './prediction/predictive-state.service';
import { LearningSimulationService } from './simulation/learning-simulation.service';
import { AutonomousActionService } from './actions/action.service';
import { ActionPolicyRegistryService } from './actions/action-policy.service';
import { HumanApprovalService } from './approval/human-approval.service';
import { DecisionProvenanceService } from './provenance/decision-provenance.service';
import { AgentService } from './agents/agent.service';
import { AgentToolsService } from './agents/agent-tools.service';

@Module({
  imports: [PrismaModule],
  controllers: [AutonomousLearningController],
  providers: [
    LearningPolicyService,
    NextBestActionService,
    PredictiveLearningService,
    LearningSimulationService,
    AutonomousActionService,
    ActionPolicyRegistryService,
    HumanApprovalService,
    DecisionProvenanceService,
    AgentService,
    AgentToolsService,
  ],
  exports: [
    LearningPolicyService,
    NextBestActionService,
    AutonomousActionService,
    HumanApprovalService,
    DecisionProvenanceService,
    AgentService,
  ],
})
export class AutonomousLearningModule {}
