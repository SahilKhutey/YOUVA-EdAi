import {
    Controller,
    Get,
    Param,
    UseGuards,
    Request,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('teacher-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.ADMIN)
export class TeacherAnalyticsController {
    constructor(private readonly service: TeacherAnalyticsService) { }

    @Get('cohort')
    getCohortOverview() {
        return this.service.getCohortOverview();
    }

    @Get('students')
    getAllStudents() {
        return this.service.getAllStudents();
    }

    @Get('student/:studentId')
    getStudentDetail(@Param('studentId') studentId: string) {
        return this.service.getStudentDetail(studentId);
    }

    @Get('content-performance')
    getContentPerformance(@Request() req: any) {
        return this.service.getContentPerformance(req.user.userId);
    }

    @Get('worksheet-performance')
    getWorksheetPerformance(@Request() req: any) {
        return this.service.getWorksheetPerformance(req.user.userId);
    }

    @Get('export-csv')
    async exportCsv(@Res() res: Response) {
        const csv = await this.service.exportStudentsCsv();
        const filename = `students-${new Date().toISOString().slice(0, 10)}.csv`;
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compat
    }
}
