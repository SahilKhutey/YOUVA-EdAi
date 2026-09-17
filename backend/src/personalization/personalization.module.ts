import { Module } from '@nestjs/common';
import { PersonalizationController } from './personalization.controller';
import { PersonalizationEngineService } from './personalization-engine.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { PersonalizationPolicyService } from './personalization-policy.service';
import { TeacherFeedbackLoopService } from './teacher-feedback-loop.service';
import { SpacedRepetitionService } from './spaced-repetition.service';

@Module({
  controllers: [PersonalizationController],
  providers: [
    PersonalizationEngineService,
    KnowledgeGraphService,
    PersonalizationPolicyService,
    TeacherFeedbackLoopService,
    SpacedRepetitionService,
  ],
  exports: [
    PersonalizationEngineService,
    KnowledgeGraphService,
    PersonalizationPolicyService,
    TeacherFeedbackLoopService,
    SpacedRepetitionService,
  ],
})
export class PersonalizationModule {}
