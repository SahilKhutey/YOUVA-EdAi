import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GovernedAiGatewayService } from './governed-ai-gateway.service';
import { AgentRegistryService } from './agent-registry.service';
import { ToolFirewallService } from './tool-firewall.service';
import { HumanAuthorizationService } from './human-authorization.service';
import { AutonomyEvaluatorService } from './autonomy-evaluator.service';
import { GovernedActionRequest, AgentIdentity } from './n15-types';

@Controller('api/v1/governed-autonomy')
export class ControlledAutonomyController {
  constructor(
    private readonly gateway: GovernedAiGatewayService,
    private readonly agentRegistry: AgentRegistryService,
    private readonly toolFirewall: ToolFirewallService,
    private readonly humanAuthorization: HumanAuthorizationService,
    private readonly evaluator: AutonomyEvaluatorService
  ) {}

  @Post('execute')
  async executeAction(@Body() request: GovernedActionRequest) {
    return this.gateway.execute(request);
  }

  @Post('recommend')
  async recommend(@Body() body: { tenantId: string; learnerId: string; purpose: string; context: any }) {
    return this.gateway.recommend(body);
  }

  @Post('generate')
  async generate(@Body() body: { tenantId: string; prompt: string; modality?: 'TEXT' | 'AUDIO' }) {
    return this.gateway.generate(body);
  }

  @Get('agents')
  async listAgents() {
    return this.agentRegistry.listAgents();
  }

  @Post('agents')
  async registerAgent(@Body() body: Omit<AgentIdentity, 'createdAt' | 'updatedAt' | 'lifecycleState'>) {
    return this.agentRegistry.registerAgent(body);
  }

  @Get('tickets/:ticketId')
  async getTicket(@Param('ticketId') ticketId: string) {
    return this.humanAuthorization.getTicket(ticketId);
  }

  @Post('tickets/:ticketId/review')
  async reviewTicket(
    @Param('ticketId') ticketId: string,
    @Body()
    body: {
      decision: 'APPROVED' | 'MODIFIED' | 'REJECTED';
      reviewerId: string;
      reviewerRole: string;
      reviewerNotes: string;
      modifiedParameters?: Record<string, any>;
    }
  ) {
    return this.humanAuthorization.reviewTicket({
      ticketId,
      ...body,
    });
  }

  @Post('tools/execute')
  async executeTool(
    @Body()
    body: {
      toolId: string;
      agentId: string;
      tenantId: string;
      inputPayload: Record<string, any>;
    }
  ) {
    return this.toolFirewall.executeTool(body);
  }

  @Get('scorecard/:tenantId')
  async getScorecard(@Param('tenantId') tenantId: string) {
    return this.evaluator.generateAutonomyScorecard(tenantId);
  }

  @Post('kill-switch')
  async setKillSwitch(@Body() body: { active: boolean }) {
    this.humanAuthorization.setGlobalKillSwitch(body.active);
    return { globalKillSwitchActive: this.humanAuthorization.isGlobalKillSwitchActive() };
  }

  @Get('audit')
  async getAudit(@Query('tenantId') tenantId?: string) {
    return this.gateway.getAuditRecords(tenantId);
  }
}
