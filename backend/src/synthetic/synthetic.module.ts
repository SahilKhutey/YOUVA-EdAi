import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthModule } from '../health/health.module';
import { SyntheticMonitoringService } from './synthetic-monitoring.service';
import { SyntheticController } from './synthetic.controller';

@Module({
  imports: [PrismaModule, HealthModule],
  controllers: [SyntheticController],
  providers: [SyntheticMonitoringService],
  exports: [SyntheticMonitoringService],
})
export class SyntheticModule {}
