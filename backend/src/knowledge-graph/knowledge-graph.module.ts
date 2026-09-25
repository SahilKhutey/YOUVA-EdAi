import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { GraphValidationService } from './graph-validation.service';
import { GraphTraversalService } from './graph-traversal.service';
import { LearningPathService } from './learning-path.service';
import { GraphController } from './graph.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GraphController],
  providers: [
    KnowledgeGraphService,
    GraphValidationService,
    GraphTraversalService,
    LearningPathService,
  ],
  exports: [
    KnowledgeGraphService,
    GraphValidationService,
    GraphTraversalService,
    LearningPathService,
  ],
})
export class KnowledgeGraphModule {}
