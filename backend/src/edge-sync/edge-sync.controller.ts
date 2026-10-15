import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { EdgeSyncService } from './edge-sync.service';

// Both endpoints used to be open to anyone on the internet.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('edge-sync')
export class EdgeSyncController {
    constructor(private readonly edgeSyncService: EdgeSyncService) { }

    /**
     * Endpoint for PWA Service Workers or local Edge Nodes to flush offline telemetry.
     */
    @Post('flush')
    async flushOfflineData(@Req() req: any, @Body('compressedPayload') compressedPayload: string) {
        return this.edgeSyncService.processIntercalatedSync(compressedPayload, req.user.id);
    }

    /**
     * Endpoint to fetch a low-bandwidth curriculum pack for offline caching.
     */
    // The pack includes correct answers, so students must not be able to fetch it.
    @Roles(Role.TEACHER, Role.ADMIN)
    @Get('curriculum/:topicId')
    async getCurriculumPack(@Param('topicId') topicId: string) {
        return this.edgeSyncService.downloadCurriculumPack(topicId);
    }
}
