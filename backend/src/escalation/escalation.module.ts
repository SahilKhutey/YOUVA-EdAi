import { Module } from '@nestjs/common';
import { EscalationController } from './escalation.controller';
import { EscalationService } from './escalation.service';
import { EscalationStateMachineService } from './escalation-state-machine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [PrismaModule, SafetyModule],
  controllers: [EscalationController],
  providers: [EscalationService, EscalationStateMachineService],
  exports: [EscalationService, EscalationStateMachineService],
})
export class EscalationModule {}
