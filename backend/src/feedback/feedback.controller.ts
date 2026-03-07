import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    @Post()
    async submitFeedback(@Req() req: any, @Body() body: { rating: number; comments?: string; context: string; sessionId?: string }) {
        return this.feedbackService.submitFeedback(req.user.id, body);
    }

    @Get('overview')
    @UseGuards(RolesGuard)
    @Roles(Role.TEACHER, Role.ADMIN)
    async getOverview() {
        return this.feedbackService.getFeedbackOverview();
    }
}
