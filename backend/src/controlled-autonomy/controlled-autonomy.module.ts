import { Module } from '@nestjs/common';
import { ControlledAutonomyController } from './controlled-autonomy.controller';
import { GovernedAiGatewayService } from './governed-ai-gateway.service';
import { AgentRegistryService } from './agent-registry.service';
import { ToolFirewallService } from './tool-firewall.service';
import { HumanAuthorizationService } from './human-authorization.service';
import { SpecializedAgentsService } from './specialized-agents.service';
import { AutonomyEvaluatorService } from './autonomy-evaluator.service';

@Module({
  controllers: [ControlledAutonomyController],
  providers: [
    GovernedAiGatewayService,
    AgentRegistryService,
    ToolFirewallService,
    HumanAuthorizationService,
    SpecializedAgentsService,
    AutonomyEvaluatorService,
  ],
  exports: [
    GovernedAiGatewayService,
    AgentRegistryService,
    ToolFirewallService,
    HumanAuthorizationService,
    SpecializedAgentsService,
    AutonomyEvaluatorService,
  ],
})
export class ControlledAutonomyModule {}
