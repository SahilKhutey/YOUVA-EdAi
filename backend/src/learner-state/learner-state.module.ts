import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LearnerStateService } from './learner-state.service';
import { LearnerKnowledgeStateService } from './learner-knowledge-state.service';
import { LearnerStateController } from './learner-state.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LearnerStateController],
  providers: [LearnerStateService, LearnerKnowledgeStateService],
  exports: [LearnerStateService, LearnerKnowledgeStateService],
})
export class LearnerStateModule {}
