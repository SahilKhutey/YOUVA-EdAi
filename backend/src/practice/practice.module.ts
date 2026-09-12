import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';

import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { LearningEngineModule } from '../learning-engine/learning-engine.module';
import { ConsentModule } from '../consent/consent.module';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [
    AiModule,
    PrismaModule,
    GamificationModule,
    LearningEngineModule,
    ConsentModule,
    TelemetryModule,
  ],
  providers: [PracticeService],
  controllers: [PracticeController],
  exports: [PracticeService],
})
export class PracticeModule {}
