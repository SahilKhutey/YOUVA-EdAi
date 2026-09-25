import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ImprovementOrchestratorService } from '../services/improvement-orchestrator.service';
import { ActionPlannerService, CreatePlanDto } from '../services/action-planner.service';
import { PlanStatus } from '../domain/improvement-plan';

@Controller('api/v1/learning-optimization/plans')
export class ImprovementController {
  constructor(
    private readonly orchestrator: ImprovementOrchestratorService,
    private readonly actionPlanner: ActionPlannerService,
  ) {}

  @Post()
  async createPlan(
    @Body() dto: CreatePlanDto,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.orchestrator.createPlan(dto, tenantId);
  }

  @Get()
  async listPlans(
    @Query('status') status?: PlanStatus,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.orchestrator.listPlans(tenantId, status);
  }

  @Get(':id')
  async getPlan(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.actionPlanner.getPlanWithDetails(id, tenantId);
  }

  @Post(':id/submit')
  async submitPlan(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.orchestrator.submitForApproval(id, tenantId);
  }

  @Post(':id/approve')
  async approvePlan(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.orchestrator.approvePlan(id, approvedBy || 'authorized-teacher', tenantId);
  }

  @Post(':id/execute')
  async executePlan(
    @Param('id') id: string,
    @Body('actorId') actorId: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.orchestrator.executePlan(id, actorId || 'teacher-1', tenantId);
  }

  @Post(':id/reopen')
  async reopenPlan(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('ownerId') ownerId: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.orchestrator.reopenPlan(id, reason, ownerId || 'teacher-1', tenantId);
  }

  @Post(':id/cancel')
  async cancelPlan(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.orchestrator.cancelPlan(id, tenantId);
  }
}
