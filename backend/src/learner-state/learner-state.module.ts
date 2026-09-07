import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LearnerStateService } from './learner-state.service';
import { LearnerStateController } from './learner-state.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LearnerStateController],
  providers: [LearnerStateService],
  exports: [LearnerStateService],
})
export class LearnerStateModule {}
