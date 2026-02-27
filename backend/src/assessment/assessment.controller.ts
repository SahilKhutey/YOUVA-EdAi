import { Controller, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { AssessmentService } from './services/assessment/assessment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AntiCheatingService } from './services/anti-cheating/anti-cheating.service';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
    constructor(
        private readonly assessmentService: AssessmentService,
        private readonly antiCheatingService: AntiCheatingService,
    ) { }

    @Post('start')
    async startAssessment(@Req() req: any, @Body('topicId') topicId: string) {
        return this.assessmentService.generateAssessment(req.user.id, topicId);
    }

    @Post(':sessionId/submit')
    async submitAssessment(
        @Req() req: any,
        @Param('sessionId') sessionId: string,
        @Body('answers') answers: any[],
    ) {
        return this.assessmentService.submitAssessment(sessionId, req.user.id, answers);
    }

    @Post(':sessionId/log-anomaly')
    async logAnomaly(
        @Req() req: any,
        @Param('sessionId') sessionId: string,
        @Body('anomalyType') anomalyType: string,
        @Body('metadata') metadata?: any,
    ) {
        return this.antiCheatingService.logAnomaly(sessionId, anomalyType, metadata);
    }
}
