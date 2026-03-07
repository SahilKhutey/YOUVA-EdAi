import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { StudyPlannerService } from './study-planner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class SchedulerController {
    constructor(
        private readonly service: SchedulerService,
        private readonly plannerService: StudyPlannerService,
    ) { }

    @Get()
    findAll(@Request() req: any) {
        return this.service.findAll(req.user.userId);
    }

    @Post()
    create(
        @Request() req: any,
        @Body()
        body: {
            topicId?: string;
            title: string;
            scheduledAt: string;
            durationMinutes: number;
            notes?: string;
        },
    ) {
        return this.service.create(
            req.user.userId,
            body.topicId ?? null,
            body.title,
            new Date(body.scheduledAt),
            body.durationMinutes,
            body.notes,
        );
    }

    @Patch(':id/complete')
    complete(@Param('id') id: string, @Request() req: any) {
        return this.service.complete(id, req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.service.remove(id, req.user.userId);
    }

    @Post('generate-plan')
    generatePlan(@Request() req: any) {
        return this.plannerService.generateWeeklyPlan(req.user.userId);
    }

    @Get('suggested')
    getSuggested(@Request() req: any) {
        return this.plannerService.getSuggestedPlan(req.user.userId);
    }
}
