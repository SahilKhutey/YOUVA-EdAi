import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvidenceProcessorService } from './evidence-processor.service';
import { MasteryModule } from '../mastery/mastery.module';
import { LearnerStateModule } from '../learner-state/learner-state.module';

@Module({
  imports: [PrismaModule, MasteryModule, LearnerStateModule],
  providers: [EvidenceProcessorService],
  exports: [EvidenceProcessorService],
})
export class LearningEvidenceModule {}
