import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../../ai/ai.module';
import { KnowledgeGraphModule } from '../../knowledge-graph/knowledge-graph.module';
import { KnowledgeRetrieverService } from './retrieval/knowledge-retriever.service';
import { GroundingValidatorService } from './grounding/grounding-validator.service';
import { AiGuardrailService } from './guardrails/ai-guardrail.service';
import { AiProvenanceService } from './provenance/ai-provenance.service';
import { AiKnowledgeService } from './ai-knowledge.service';
import { AiKnowledgeController } from './ai-knowledge.controller';

@Module({
  imports: [PrismaModule, AiModule, KnowledgeGraphModule],
  controllers: [AiKnowledgeController],
  providers: [
    KnowledgeRetrieverService,
    GroundingValidatorService,
    AiGuardrailService,
    AiProvenanceService,
    AiKnowledgeService,
  ],
  exports: [
    KnowledgeRetrieverService,
    GroundingValidatorService,
    AiGuardrailService,
    AiProvenanceService,
    AiKnowledgeService,
  ],
})
export class AiKnowledgeModule {}
