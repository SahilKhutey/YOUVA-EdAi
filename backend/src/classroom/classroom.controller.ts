import { Controller, Post, Body, Req, UseGuards, Put, Param, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { LessonPlanService } from './lesson-plan.service';
import { WorksheetService } from './worksheet.service';
import { ClassroomSessionService } from './classroom-session.service';

const actor = (req: any) => ({ id: req.user.id, role: req.user.role });

@Controller('classroom')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomController {
    constructor(
        private lessonPlanService: LessonPlanService,
        private worksheetService: WorksheetService,
        private sessions: ClassroomSessionService,
    ) { }

    // --- LESSON PLANS (teachers create and publish; others can read published plans) ---

    @Roles(Role.TEACHER, Role.ADMIN)
    @Post('lesson-plan/generate')
    async generateLessonPlan(@Req() req: any, @Body() body: any) {
        return this.lessonPlanService.generateLessonPlan(req.user.id, body);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @Get('lesson-plan')
    async getLessonPlans(@Req() req: any) {
        return this.lessonPlanService.getLessonPlans(req.user.id);
    }

    @Get('lesson-plan/:id')
    async getLessonPlan(@Req() req: any, @Param('id') id: string) {
        return this.lessonPlanService.getLessonPlanById(id, actor(req));
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @Put('lesson-plan/:id/publish')
    async publishLessonPlan(@Req() req: any, @Param('id') id: string) {
        return this.lessonPlanService.publishLessonPlan(id, actor(req));
    }

    // --- WORKSHEETS ---

    @Roles(Role.TEACHER, Role.ADMIN)
    @Post('worksheet/generate')
    async generateWorksheet(@Req() req: any, @Body() body: any) {
        return this.worksheetService.generateWorksheet(req.user.id, body);
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @Get('worksheet')
    async getWorksheets(@Req() req: any) {
        return this.worksheetService.getWorksheets(req.user.id);
    }

    @Get('worksheet/:id')
    async getWorksheet(@Req() req: any, @Param('id') id: string) {
        return this.worksheetService.getWorksheetById(id, actor(req));
    }

    @Roles(Role.TEACHER, Role.ADMIN)
    @Put('worksheet/:id/publish')
    async publishWorksheet(@Req() req: any, @Param('id') id: string) {
        return this.worksheetService.publishWorksheet(id, actor(req));
    }

    @Post('worksheet/:id/submit')
    async submitWorksheet(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.worksheetService.submitWorksheet(req.user.id, id, body);
    }

    @Get('worksheet/submission/:id')
    async getSubmission(@Req() req: any, @Param('id') id: string) {
        return this.worksheetService.getSubmission(id, actor(req));
    }

    // --- SESSIONS ---

    @Roles(Role.TEACHER, Role.ADMIN)
    @Post('session/start')
    async startSession(@Req() req: any, @Body() body: { lessonPlanId?: string, studentId: string }) {
        return this.sessions.start(actor(req), body);
    }

    @Get('session/:id')
    async getSession(@Req() req: any, @Param('id') id: string) {
        return this.sessions.get(id, actor(req));
    }
}
