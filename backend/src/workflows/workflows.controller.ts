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
import { WorkflowEngineService } from './workflow-engine.service';
import { CreateWorkflowDto, WorkflowStatus } from './workflow.types';
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

@Controller(['v1/workflows', 'workflows'])
export class WorkflowsController {
  constructor(private readonly workflowService: WorkflowEngineService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWorkflow(@Body() dto: CreateWorkflowDto) {
    return this.workflowService.createWorkflow(dto);
  }

  @Get(':key')
  @UseGuards(JwtAuthGuard)
  async getWorkflow(@Param('key') key: string) {
    return this.workflowService.getWorkflow(key);
  }

  @Post('executions/start')
  @UseGuards(JwtAuthGuard)
  async startExecution(
    @Body()
    body: {
      workflowKey: string;
      learnerId?: string;
      tenantId?: string;
      initialContext?: any;
    },
  ) {
    return this.workflowService.startExecution(
      body.workflowKey,
      body.learnerId,
      body.tenantId,
      body.initialContext,
    );
  }

  @Post('executions/:id/step')
  @UseGuards(JwtAuthGuard)
  async stepForward(
    @Param('id') id: string,
    @Body('stepContext') stepContext?: any,
  ) {
    return this.workflowService.stepForward(id, stepContext);
  }

  @Post('executions/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveGate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body('gateContext') gateContext?: any,
  ) {
    const approvedBy = req.user?.sub || req.user?.id || 'supervisor';
    return this.workflowService.approveGate(id, approvedBy, gateContext);
  }

  @Post('executions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelExecution(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.workflowService.cancelExecution(id, reason || 'Cancelled by user');
  }

  @Get('executions/:id')
  @UseGuards(JwtAuthGuard)
  async getExecution(@Param('id') id: string) {
    return this.workflowService.getExecution(id);
  }

  @Get('executions')
  @UseGuards(JwtAuthGuard)
  async listExecutions(
    @Query('workflowId') workflowId?: string,
    @Query('learnerId') learnerId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: WorkflowStatus,
    @Query('limit') limit?: string,
  ) {
    return this.workflowService.listExecutions({
      workflowId,
      learnerId,
      tenantId,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
