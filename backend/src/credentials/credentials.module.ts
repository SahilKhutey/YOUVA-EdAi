import { Module } from '@nestjs/common';
import { CredentialsController } from './credentials.controller';
import { PublicVerifyController } from './public-verify.controller';
import { SkillTaxonomyService } from './skill-taxonomy.service';
import { LearningEvidenceService } from './learning-evidence.service';
import { ProjectAssessmentService } from './project-assessment.service';
import { TeacherRubricService } from './teacher-rubric.service';
import { CredentialPolicyService } from './credential-policy.service';
import { CryptoKeyService } from './crypto-key.service';
import { OpenBadgesService } from './open-badges.service';
import { VerifiableCredentialsService } from './verifiable-credentials.service';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { PublicVerificationService } from './public-verification.service';
import { CareerPathwaysService } from './career-pathways.service';
import { HighSchoolPilotService } from './highschool-pilot.service';
import { SkillsPassportService } from './skills-passport.service';

@Module({
  controllers: [CredentialsController, PublicVerifyController],
  providers: [
    SkillTaxonomyService,
    LearningEvidenceService,
    ProjectAssessmentService,
    TeacherRubricService,
    CredentialPolicyService,
    CryptoKeyService,
    OpenBadgesService,
    VerifiableCredentialsService,
    CredentialLifecycleService,
    PublicVerificationService,
    CareerPathwaysService,
    HighSchoolPilotService,
    SkillsPassportService,
  ],
  exports: [
    SkillTaxonomyService,
    LearningEvidenceService,
    ProjectAssessmentService,
    TeacherRubricService,
    CredentialPolicyService,
    CryptoKeyService,
    OpenBadgesService,
    VerifiableCredentialsService,
    CredentialLifecycleService,
    PublicVerificationService,
    CareerPathwaysService,
    HighSchoolPilotService,
    SkillsPassportService,
  ],
})
export class CredentialsModule {}
