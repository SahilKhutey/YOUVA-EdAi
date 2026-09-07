import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { CredentialController } from './credential.controller';
import { PublicCredentialController } from './public-credential.controller';

// Services
import { CredentialService } from './services/credential.service';
import { CredentialIssuanceService } from './services/credential-issuance.service';
import { CredentialVerificationService } from './services/credential-verification.service';
import { CredentialShareService } from './services/credential-share.service';
import { CredentialPublicVerificationService } from './services/credential-public-verification.service';
import { CredentialRevocationService } from './services/credential-revocation.service';
import { SkillsPassportService } from './services/skills-passport.service';
import { CredentialTemplateService } from './services/credential-template.service';
import { OpenBadgeExporter, CredentialAdapterService } from './services/credential-adapter.service';
import { CredentialRecommendationService } from './ai/credential-recommendation.service';
import { AntiGamingService } from './crypto/anti-gaming.service';

@Module({
  imports: [PrismaModule],
  controllers: [CredentialController, PublicCredentialController],
  providers: [
    CredentialService,
    CredentialIssuanceService,
    CredentialVerificationService,
    CredentialShareService,
    CredentialPublicVerificationService,
    CredentialRevocationService,
    SkillsPassportService,
    CredentialTemplateService,
    OpenBadgeExporter,
    CredentialAdapterService,
    CredentialRecommendationService,
    AntiGamingService,
  ],
  exports: [
    CredentialService,
    CredentialIssuanceService,
    CredentialVerificationService,
    SkillsPassportService,
    CredentialShareService,
    CredentialPublicVerificationService,
    CredentialRevocationService,
    CredentialTemplateService,
    CredentialAdapterService,
    CredentialRecommendationService,
  ],
})
export class CredentialNetworkModule {}
