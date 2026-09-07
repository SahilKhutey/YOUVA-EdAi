import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InterventionOrchestrationService } from './intervention-orchestration.service';
import { ModelDriftService } from './model-drift.service';
import { AICostService } from './ai-cost.service';
import { AIGovernanceController } from './ai-governance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AIGovernanceController],
  providers: [
    InterventionOrchestrationService,
    ModelDriftService,
    AICostService,
  ],
  exports: [
    InterventionOrchestrationService,
    ModelDriftService,
    AICostService,
  ],
})
export class AIGovernanceModule {}
