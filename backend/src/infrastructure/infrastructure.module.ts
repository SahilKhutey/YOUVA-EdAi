import { Module } from '@nestjs/common';
import { DemandCapacityService } from './demand-capacity.service';
import { MultiTenantGovernanceService } from './multi-tenant-governance.service';
import { CommercialBillingService } from './commercial-billing.service';
import { AiFinOpsService } from './ai-finops.service';
import { DisasterRecoveryOrchestratorService } from './disaster-recovery-orchestrator.service';
import { OperationalResilienceService } from './operational-resilience.service';
import { InfrastructureController } from './infrastructure.controller';

@Module({
  controllers: [InfrastructureController],
  providers: [
    DemandCapacityService,
    MultiTenantGovernanceService,
    CommercialBillingService,
    AiFinOpsService,
    DisasterRecoveryOrchestratorService,
    OperationalResilienceService,
  ],
  exports: [
    DemandCapacityService,
    MultiTenantGovernanceService,
    CommercialBillingService,
    AiFinOpsService,
    DisasterRecoveryOrchestratorService,
    OperationalResilienceService,
  ],
})
export class InfrastructureModule {}
