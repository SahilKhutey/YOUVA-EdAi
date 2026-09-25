import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
} from '@nestjs/common';
import { AutomationService } from '../services/automation.service';

@Controller('api/v1/learning-optimization/automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('policies')
  getPolicy() {
    return this.automationService.getPolicy();
  }

  @Post('level')
  updateLevel(
    @Body('level') level: number,
    @Body('approvedBy') approvedBy: string,
  ) {
    return this.automationService.updateAutomationLevel(level, approvedBy || 'governance-admin');
  }

  @Get('executions')
  getExecutions(
    @Headers('x-tenant-id') tenantId = 'default-tenant',
    @Query('limit') limit?: string,
  ) {
    return this.automationService.getExecutions(tenantId, limit ? parseInt(limit, 10) : 20);
  }
}
