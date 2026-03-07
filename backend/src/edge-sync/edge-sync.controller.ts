import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EdgeSyncService } from './edge-sync.service';

@Controller('edge-sync')
export class EdgeSyncController {
    constructor(private readonly edgeSyncService: EdgeSyncService) { }

    /**
     * Endpoint for PWA Service Workers or local Edge Nodes to flush offline telemetry.
     */
    @Post('flush')
    async flushOfflineData(@Body('compressedPayload') compressedPayload: string) {
        return this.edgeSyncService.processIntercalatedSync(compressedPayload);
    }

    /**
     * Endpoint to fetch a low-bandwidth curriculum pack for offline caching.
     */
    @Get('curriculum/:topicId')
    async getCurriculumPack(@Param('topicId') topicId: string) {
        return this.edgeSyncService.downloadCurriculumPack(topicId);
    }
}
