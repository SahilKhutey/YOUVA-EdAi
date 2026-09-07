import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AutonomyPolicyService } from './autonomy-policy.service';
import { AgentExecutionService } from './agent-execution.service';
import { AutonomyController } from './autonomy.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AutonomyController],
  providers: [AutonomyPolicyService, AgentExecutionService],
  exports: [AutonomyPolicyService, AgentExecutionService],
})
export class AutonomyModule {}
