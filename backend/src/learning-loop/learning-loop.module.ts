import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LearningEngineModule } from '../learning-engine/learning-engine.module';
import { LearningLoopController } from './learning-loop.controller';
import { LearningLoopService } from './learning-loop.service';
import { PolicyEngineService } from './policy/policy-engine.service';
import { EvidenceProcessorService } from './evidence/evidence-processor.service';
import { PersonalizationEngineService } from './personalization/personalization-engine.service';
import { EscalationStateMachineService } from './escalation/escalation-state-machine.service';
import { TeacherInterventionService } from './intervention/teacher-intervention.service';
import { LearningLoopAuditService } from './audit/learning-loop-audit.service';

@Module({
  imports: [PrismaModule, LearningEngineModule],
  controllers: [LearningLoopController],
  providers: [
    LearningLoopService,
    PolicyEngineService,
    EvidenceProcessorService,
    PersonalizationEngineService,
    EscalationStateMachineService,
    TeacherInterventionService,
    LearningLoopAuditService,
  ],
  exports: [
    LearningLoopService,
    PolicyEngineService,
    EvidenceProcessorService,
    PersonalizationEngineService,
    EscalationStateMachineService,
    TeacherInterventionService,
    LearningLoopAuditService,
  ],
})
export class LearningLoopModule {}
