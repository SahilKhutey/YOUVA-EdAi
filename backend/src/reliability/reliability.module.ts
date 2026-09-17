import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { RetryPolicyService } from './retry/retry-policy.service';
import { IncidentManagerService } from './incident/incident-manager.service';
import { AlertManagerService } from './incident/alert-manager.service';
import { DrVerificationService } from './dr/dr-verification.service';

import { ReliabilityController } from './reliability.controller';

@Global()
@Module({
  controllers: [ReliabilityController],
  providers: [
    CircuitBreakerService,
    RetryPolicyService,
    IncidentManagerService,
    AlertManagerService,
    DrVerificationService,
  ],
  exports: [
    CircuitBreakerService,
    RetryPolicyService,
    IncidentManagerService,
    AlertManagerService,
    DrVerificationService,
  ],
})
export class ReliabilityModule {}
