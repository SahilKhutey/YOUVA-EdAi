import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmotionScoringService } from './services/emotion-scoring.service';

@Controller('engagement')
@UseGuards(JwtAuthGuard)
export class EngagementController {
    constructor(private emotionScoringService: EmotionScoringService) { }

    @Post('telemetry')
    async logTelemetry(
        @Req() req: any,
        @Body() payload: {
            topicId: string,
            telemetry: {
                cpm: number;
                errorSpike: number;
                hesitationGapMs: number;
                sessionDurationMs: number;
            }
        }
    ) {
        return this.emotionScoringService.processTelemetry(
            req.user.id,
            payload.topicId,
            payload.telemetry
        );
    }
}
