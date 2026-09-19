import { Module } from '@nestjs/common';
import { SkillsGraphService } from './skills-graph.service';
import { EvidenceGraphService } from './evidence-graph.service';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { CredentialVerificationGatewayService } from './credential-verification-gateway.service';
import { CredentialWalletPassportService } from './credential-wallet-passport.service';
import { SkillsCredentialNetworkController } from './skills-credential-network.controller';

@Module({
  controllers: [SkillsCredentialNetworkController],
  providers: [
    SkillsGraphService,
    EvidenceGraphService,
    CredentialLifecycleService,
    CredentialVerificationGatewayService,
    CredentialWalletPassportService,
  ],
  exports: [
    SkillsGraphService,
    EvidenceGraphService,
    CredentialLifecycleService,
    CredentialVerificationGatewayService,
    CredentialWalletPassportService,
  ],
})
export class SkillsCredentialNetworkModule {}
