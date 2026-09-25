import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PersonalizationController } from './personalization.controller';
import { PersonalizationEngineService } from './personalization-engine.service';
import { KnowledgePersonalizationService } from './knowledge-personalization.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { PersonalizationPolicyService } from './personalization-policy.service';
import { TeacherFeedbackLoopService } from './teacher-feedback-loop.service';
import { SpacedRepetitionService } from './spaced-repetition.service';

import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';

@Module({
  imports: [PrismaModule, KnowledgeGraphModule],
  controllers: [PersonalizationController],
  providers: [
    PersonalizationEngineService,
    KnowledgePersonalizationService,
    KnowledgeGraphService,
    PersonalizationPolicyService,
    TeacherFeedbackLoopService,
    SpacedRepetitionService,
  ],
  exports: [
    PersonalizationEngineService,
    KnowledgePersonalizationService,
    KnowledgeGraphService,
    PersonalizationPolicyService,
    TeacherFeedbackLoopService,
    SpacedRepetitionService,
  ],
})
export class PersonalizationModule {}
