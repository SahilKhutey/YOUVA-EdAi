import { Module } from '@nestjs/common';
import { SafetyPolicyService } from './safety-policy.service';

@Module({
  providers: [SafetyPolicyService],
  exports: [SafetyPolicyService],
})
export class SafetyModule {}
