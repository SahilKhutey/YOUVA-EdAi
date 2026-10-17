import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AssessmentIntelligenceService } from './assessment-intelligence.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AiFeaturesGuard } from '../common/guards/ai-features.guard';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';

@Controller('assessment-intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentIntelligenceController {
    constructor(
        private readonly assessmentService: AssessmentIntelligenceService,
        private readonly scope: ScopeAuthorizationService,
    ) { }

    /** Teachers assign projects, and only to students in their own class (admins to anyone). */
    @Roles(Role.TEACHER, Role.ADMIN)
    @Post('assign')
    async assignProject(
        @Req() req: any,
        @Body() body: { userId: string; topicId: string; prompt: string; gradingRubric: string }
    ) {
        if (req.user.role !== Role.ADMIN) await this.scope.assertTeacherStudentScope(req.user.id, body.userId);
        return this.assessmentService.assignProject(
            body.userId,
            body.topicId,
            body.prompt,
            body.gradingRubric
        );
    }

    /** Sends the submission to the AI, so it is off unless ENABLE_AI_FEATURES=true; the project's student, their teacher, or an admin only. */
    @UseGuards(AiFeaturesGuard)
    @Post('evaluate/:id')
    async evaluateSubmission(
        @Req() req: any,
        @Param('id') projectId: string,
        @Body('submissionContent') submissionContent: string
    ) {
        return this.assessmentService.evaluateSubmission(projectId, submissionContent, { id: req.user.id, role: req.user.role });
    }
}
