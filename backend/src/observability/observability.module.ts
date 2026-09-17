import { Module, Global } from '@nestjs/common';
import { StructuredLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { SloTrackerService } from './slo/slo-tracker.service';
import { ObservabilityController } from './observability.controller';

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [StructuredLoggerService, MetricsService, SloTrackerService],
  exports: [StructuredLoggerService, MetricsService, SloTrackerService],
})
export class ObservabilityModule {}
