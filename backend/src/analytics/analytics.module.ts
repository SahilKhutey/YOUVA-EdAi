import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentIntelligenceModule } from '../content-intelligence/content-intelligence.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, ContentIntelligenceModule, AiModule],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
