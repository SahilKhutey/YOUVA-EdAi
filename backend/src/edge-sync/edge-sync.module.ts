import { Module } from '@nestjs/common';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeSyncController } from './edge-sync.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EdgeSyncController],
    providers: [EdgeSyncService],
    exports: [EdgeSyncService]
})
export class EdgeSyncModule { }
