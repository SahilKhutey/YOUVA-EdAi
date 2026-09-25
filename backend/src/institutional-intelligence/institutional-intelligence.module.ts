import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstitutionalIntelligenceService } from './services/institutional-intelligence.service';
import { SystemicInsightService } from './services/systemic-insight.service';
import { LearningPatternService } from './services/learning-pattern.service';
import { LearningMemoryService } from './services/learning-memory.service';
import { BenchmarkService } from './services/benchmark.service';
import { KnowledgeNetworkService } from './services/knowledge-network.service';
import { SystemOptimizationService } from './services/system-optimization.service';
import { InstitutionalIntelligenceController } from './controllers/institutional-intelligence.controller';
import { NetworkController } from './controllers/network.controller';
import { BenchmarkController } from './controllers/benchmark.controller';
import { SystemOptimizationController } from './controllers/system-optimization.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    InstitutionalIntelligenceController,
    NetworkController,
    BenchmarkController,
    SystemOptimizationController,
  ],
  providers: [
    InstitutionalIntelligenceService,
    SystemicInsightService,
    LearningPatternService,
    LearningMemoryService,
    BenchmarkService,
    KnowledgeNetworkService,
    SystemOptimizationService,
  ],
  exports: [
    InstitutionalIntelligenceService,
    SystemicInsightService,
    LearningPatternService,
    LearningMemoryService,
    BenchmarkService,
    KnowledgeNetworkService,
    SystemOptimizationService,
  ],
})
export class InstitutionalIntelligenceModule {}
