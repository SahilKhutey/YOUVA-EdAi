import { Module, Global } from '@nestjs/common';
import { StructuredLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  providers: [StructuredLoggerService, MetricsService],
  exports: [StructuredLoggerService, MetricsService],
})
export class ObservabilityModule {}
