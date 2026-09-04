import { Module } from '@nestjs/common';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [KnowledgeGraphService],
    exports: [KnowledgeGraphService],
})
export class KnowledgeGraphModule { }
