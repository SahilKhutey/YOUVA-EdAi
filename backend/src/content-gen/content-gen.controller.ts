import { Controller, Post, Body, Req, UseGuards, Put, Param, Get } from '@nestjs/common';
import { PromptOrchestratorService } from './services/prompt-orchestrator/prompt-orchestrator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

// Content generation is a teacher tool: students could otherwise send their own text to the AI.
@Controller('content-gen')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.ADMIN)
export class ContentGenController {
    constructor(private promptOrchestrator: PromptOrchestratorService) { }

    @Post('generate')
    async orchestratePrompt(
        @Req() req: any,
        @Body() payload: {
            topicId?: string;
            customTopic?: string;
            type: 'LESSON_PLAN' | 'WORKSHEET' | 'QUIZ' | 'HOMEWORK';
            difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
            targetDuration: number;
            learningObjective: string;
        }
    ) {
        // In a full implementation, we would check if req.user.role === 'TEACHER' here
        return this.promptOrchestrator.generateContent({
            ...payload,
            teacherId: req.user.id
        });
    }

    @Get('drafts')
    async getMyDrafts(@Req() req: any) {
        return this.promptOrchestrator.getDrafts(req.user.id);
    }

    @Put('publish/:draftId')
    async approveAndPublish(
        @Req() req: any,
        @Param('draftId') draftId: string,
        @Body('overrides') overrides: any
    ) {
        return this.promptOrchestrator.publishContent(draftId, overrides, { id: req.user.id, role: req.user.role });
    }
}
