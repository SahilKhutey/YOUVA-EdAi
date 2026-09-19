import { Module } from '@nestjs/common';
import { JurisdictionEngineService } from './jurisdiction-engine.service';
import { InstitutionalPolicyEngineService } from './institutional-policy-engine.service';
import { CurriculumMappingService } from './curriculum-mapping.service';
import { CredentialNetworkService } from './credential-network.service';
import { IntegrationGatewayService } from './integration-gateway.service';
import { InstitutionalTrustService } from './institutional-trust.service';
import { InstitutionalGovernanceController } from './institutional-governance.controller';

@Module({
  controllers: [InstitutionalGovernanceController],
  providers: [
    JurisdictionEngineService,
    InstitutionalPolicyEngineService,
    CurriculumMappingService,
    CredentialNetworkService,
    IntegrationGatewayService,
    InstitutionalTrustService,
  ],
  exports: [
    JurisdictionEngineService,
    InstitutionalPolicyEngineService,
    CurriculumMappingService,
    CredentialNetworkService,
    IntegrationGatewayService,
    InstitutionalTrustService,
  ],
})
export class InstitutionalGovernanceModule {}
