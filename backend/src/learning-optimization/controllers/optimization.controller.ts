import {
  Controller,
  Get,
  Headers,
} from '@nestjs/common';
import { OptimizationService } from '../services/optimization.service';

@Controller('api/v1/learning-optimization')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Get('overview')
  async getOverview(@Headers('x-tenant-id') tenantId = 'default-tenant') {
    return this.optimizationService.getOverview(tenantId);
  }
}
