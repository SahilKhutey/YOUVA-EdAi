import { Module } from '@nestjs/common';
import { AgeiService } from './agei.service';
import { PedagogicalCoreService } from './pedagogical-core/pedagogical-core.service';
import { CognitivePredictionService } from './cognitive-prediction/cognitive-prediction.service';
import { KnowledgeSynthesisService } from './knowledge-synthesis/knowledge-synthesis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CognitiveTwinModule } from '../cognitive-twin/cognitive-twin.module';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [PrismaModule, CognitiveTwinModule, KnowledgeGraphModule, AiModule],
    providers: [
        AgeiService,
        PedagogicalCoreService,
        CognitivePredictionService,
        KnowledgeSynthesisService,
    ],
    exports: [AgeiService, PedagogicalCoreService, CognitivePredictionService, KnowledgeSynthesisService],
})
export class AgeiModule { }
