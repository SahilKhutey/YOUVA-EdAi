import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { SystemOptimizationService, CreateSystemOptimizationPlanDto } from '../services/system-optimization.service';

@Controller('api/v1/institutional-intelligence/optimization/plans')
export class SystemOptimizationController {
  constructor(private readonly optimizationService: SystemOptimizationService) {}

  @Get()
  async listPlans(@Headers('x-tenant-id') tenantId = 'default-tenant') {
    return this.optimizationService.listPlans(tenantId);
  }

  @Post()
  async createPlan(
    @Body() dto: CreateSystemOptimizationPlanDto,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.optimizationService.createPlan(dto, tenantId);
  }

  @Post(':id/submit')
  async submitPlan(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.optimizationService.submitPlan(id, tenantId);
  }

  @Post(':id/approve')
  async approvePlan(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.optimizationService.approvePlan(id, approvedBy || 'governance-admin', tenantId);
  }

  @Post(':id/execute')
  async executePlan(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId = 'default-tenant',
  ) {
    return this.optimizationService.executePlan(id, tenantId);
  }
}
