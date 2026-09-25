import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LearningKnowledgeService } from './learning-knowledge.service';
import { LearningKnowledgeController } from './learning-knowledge.controller';
import { LearningEvidenceModule } from '../learning-evidence/learning-evidence.module';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';
import { AiKnowledgeModule } from './ai/ai-knowledge.module';

@Module({
  imports: [
    PrismaModule,
    LearningEvidenceModule,
    KnowledgeGraphModule,
    AiKnowledgeModule,
  ],
  controllers: [LearningKnowledgeController],
  providers: [LearningKnowledgeService],
  exports: [LearningKnowledgeService, AiKnowledgeModule],
})
export class LearningKnowledgeModule {}

