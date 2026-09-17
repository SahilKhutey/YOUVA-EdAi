import { Controller, Get, Param } from '@nestjs/common';
import { SyntheticMonitoringService, SyntheticSummary, SyntheticProbeResult } from './synthetic-monitoring.service';

@Controller('api/synthetic')
export class SyntheticController {
  constructor(private readonly syntheticService: SyntheticMonitoringService) {}

  @Get('run')
  async runAllProbes(): Promise<SyntheticSummary> {
    return this.syntheticService.runAllProbes();
  }

  @Get('probe/:id')
  async runProbe(@Param('id') id: string): Promise<SyntheticProbeResult> {
    return this.syntheticService.runProbe(id);
  }
}
