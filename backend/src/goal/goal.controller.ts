import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GoalService } from './goal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalController {
    constructor(private readonly service: GoalService) { }

    @Get()
    getActiveGoal(@Request() req: any) {
        return this.service.getActiveGoal(req.user.userId);
    }

    @Get('progress')
    getProgress(@Request() req: any) {
        return this.service.getProgress(req.user.userId);
    }

    @Post()
    setGoal(
        @Request() req: any,
        @Body() body: { weeklyXpTarget: number; weeklyStudyMinutes: number },
    ) {
        return this.service.setGoal(
            req.user.userId,
            body.weeklyXpTarget,
            body.weeklyStudyMinutes,
        );
    }
}
