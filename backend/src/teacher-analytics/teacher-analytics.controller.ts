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
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';

@Controller('teacher-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.ADMIN)
export class TeacherAnalyticsController {
    constructor(
        private readonly service: TeacherAnalyticsService,
        private readonly scope: ScopeAuthorizationService,
    ) { }

    // Teachers see only students in their own classes or assignments; admins see everyone.
    @Get('cohort')
    async getCohortOverview(@Request() req: any) {
        return this.service.getCohortOverview(await this.scope.getScopedStudentIds(req.user.id));
    }

    @Get('students')
    async getAllStudents(@Request() req: any) {
        return this.service.getAllStudents(await this.scope.getScopedStudentIds(req.user.id));
    }

    @Get('student/:studentId')
    async getStudentDetail(@Request() req: any, @Param('studentId') studentId: string) {
        await this.scope.assertTeacherStudentScope(req.user.id, studentId);
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
    async exportCsv(@Request() req: any, @Res() res: Response) {
        const csv = await this.service.exportStudentsCsv(await this.scope.getScopedStudentIds(req.user.id));
        const filename = `students-${new Date().toISOString().slice(0, 10)}.csv`;
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compat
    }
}
