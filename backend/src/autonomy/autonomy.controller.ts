import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AgentExecutionService } from './agent-execution.service';
import {
  AgentAction,
  AgentRegistrationDto,
  AgeTier,
  LearningAgentRequest,
} from './autonomy.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    userId?: string;
    role?: string;
    email?: string;
  };
}

@Controller(['v1/autonomy', 'autonomy'])
export class AutonomyController {
  constructor(private readonly agentExecutionService: AgentExecutionService) {}

  @Post('agents')
  @UseGuards(JwtAuthGuard)
  async registerAgent(@Body() dto: AgentRegistrationDto) {
    return this.agentExecutionService.registerAgent(dto);
  }

  @Get('agents/:key')
  @UseGuards(JwtAuthGuard)
  async getAgent(@Param('key') key: string) {
    return this.agentExecutionService.getAgent(key);
  }

  @Post('execute')
  @UseGuards(JwtAuthGuard)
  async executeAction(@Body() body: LearningAgentRequest) {
    return this.agentExecutionService.executeAction(body);
  }

  @Post('executions/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveExecution(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id || 'system-admin';
    return this.agentExecutionService.approveExecution(id, userId);
  }

  @Post('executions/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectExecution(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id || 'system-admin';
    return this.agentExecutionService.rejectExecution(id, userId, reason || 'Rejected by human operator');
  }

  @Get('audit')
  @UseGuards(JwtAuthGuard)
  async getAuditHistory(
    @Query('agentId') agentId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentExecutionService.getAuditHistory({
      agentId,
      learnerId,
      tenantId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
