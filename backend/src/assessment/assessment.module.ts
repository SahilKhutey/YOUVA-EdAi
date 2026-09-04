import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './services/assessment/assessment.service';
import { AntiCheatingService } from './services/anti-cheating/anti-cheating.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [AssessmentController],
  providers: [AssessmentService, AntiCheatingService],
  exports: [AssessmentService, AntiCheatingService],
})
export class AssessmentModule { }
