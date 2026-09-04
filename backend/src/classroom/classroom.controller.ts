import { Controller, Post, Body, Req, UseGuards, Put, Param, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LessonPlanService } from './lesson-plan.service';
import { WorksheetService } from './worksheet.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('classroom')
@UseGuards(JwtAuthGuard)
export class ClassroomController {
    constructor(
        private lessonPlanService: LessonPlanService,
        private worksheetService: WorksheetService,
        private prisma: PrismaService
    ) { }

    // --- LESSON PLANS ---

    @Post('lesson-plan/generate')
    async generateLessonPlan(@Req() req: any, @Body() body: any) {
        return this.lessonPlanService.generateLessonPlan(req.user.id, body);
    }

    @Get('lesson-plan')
    async getLessonPlans(@Req() req: any) {
        return this.lessonPlanService.getLessonPlans(req.user.id);
    }

    @Get('lesson-plan/:id')
    async getLessonPlan(@Param('id') id: string) {
        return this.lessonPlanService.getLessonPlanById(id);
    }

    @Put('lesson-plan/:id/publish')
    async publishLessonPlan(@Param('id') id: string) {
        return this.lessonPlanService.publishLessonPlan(id);
    }

    // --- WORKSHEETS ---

    @Post('worksheet/generate')
    async generateWorksheet(@Req() req: any, @Body() body: any) {
        return this.worksheetService.generateWorksheet(req.user.id, body);
    }

    @Get('worksheet')
    async getWorksheets(@Req() req: any) {
        return this.worksheetService.getWorksheets(req.user.id);
    }

    @Get('worksheet/:id')
    async getWorksheet(@Param('id') id: string) {
        return this.worksheetService.getWorksheetById(id);
    }

    @Put('worksheet/:id/publish')
    async publishWorksheet(@Param('id') id: string) {
        return this.worksheetService.publishWorksheet(id);
    }

    @Post('worksheet/:id/submit')
    async submitWorksheet(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.worksheetService.submitWorksheet(req.user.id, id, body);
    }

    @Get('worksheet/submission/:id')
    async getSubmission(@Param('id') id: string) {
        return this.worksheetService.getSubmission(id);
    }

    // --- SESSIONS ---
    @Post('session/start')
    async startSession(@Req() req: any, @Body() body: { lessonPlanId?: string, studentId: string }) {
        return this.prisma.digitalClassroomSession.create({
            data: {
                teacherId: req.user.id,
                studentId: body.studentId,
                lessonPlanId: body.lessonPlanId,
                status: 'ACTIVE',
                startedAt: new Date(),
            }
        });
    }

    @Get('session/:id')
    async getSession(@Param('id') id: string) {
        return this.prisma.digitalClassroomSession.findUnique({
            where: { id },
            include: { lessonPlan: { include: { steps: { orderBy: { order: 'asc' } } } }, student: true, teacher: true }
        });
    }
}
