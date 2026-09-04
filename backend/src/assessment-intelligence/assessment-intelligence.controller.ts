import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AssessmentIntelligenceService } from './assessment-intelligence.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('assessment-intelligence')
@UseGuards(JwtAuthGuard)
export class AssessmentIntelligenceController {
    constructor(private readonly assessmentService: AssessmentIntelligenceService) { }

    @Post('assign')
    async assignProject(
        @Body() body: { userId: string; topicId: string; prompt: string; gradingRubric: string }
    ) {
        return this.assessmentService.assignProject(
            body.userId,
            body.topicId,
            body.prompt,
            body.gradingRubric
        );
    }

    @Post('evaluate/:id')
    async evaluateSubmission(
        @Param('id') projectId: string,
        @Body('submissionContent') submissionContent: string
    ) {
        return this.assessmentService.evaluateSubmission(projectId, submissionContent);
    }
}
