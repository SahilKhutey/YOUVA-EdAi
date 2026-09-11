import { Module } from '@nestjs/common';
import { SafetyPolicyService } from './safety-policy.service';
import { SafetyEscalationService } from './safety-escalation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SafetyPolicyService, SafetyEscalationService],
  exports: [SafetyPolicyService, SafetyEscalationService],
})
export class SafetyModule {}

