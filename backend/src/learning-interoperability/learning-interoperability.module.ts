import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Controllers
import { LearningPassportController } from './passport/learning-passport.controller';
import { LearnerRecordController } from './ulr/learner-record.controller';
import { CredentialController } from './competency/credential.controller';
import { IntegrationController } from './integration/integration.controller';
import { LearningDataShareController } from './sharing/learning-data-share.controller';

// Services
import { UnifiedLearnerSnapshotService } from './ulr/unified-learner-snapshot.service';
import { LearningPassportService } from './passport/learning-passport.service';
import { CurriculumTranslationService } from './integration/curriculum-translation.service';
import { LearningPathwayService } from './pathway/learning-pathway.service';
import { LearningExportService } from './sharing/learning-export.service';
import { ExternalLearningEventService } from './integration/external-learning-event.service';
import { CredentialVerificationService } from './competency/credential-verification.service';
import { CompetencyService } from './competency/competency.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    LearningPassportController,
    LearnerRecordController,
    CredentialController,
    IntegrationController,
    LearningDataShareController,
  ],
  providers: [
    UnifiedLearnerSnapshotService,
    LearningPassportService,
    CurriculumTranslationService,
    LearningPathwayService,
    LearningExportService,
    ExternalLearningEventService,
    CredentialVerificationService,
    CompetencyService,
  ],
  exports: [
    UnifiedLearnerSnapshotService,
    LearningPassportService,
    LearningPathwayService,
    ExternalLearningEventService,
    CompetencyService,
    LearningExportService,
  ],
})
export class LearningInteroperabilityModule {}
