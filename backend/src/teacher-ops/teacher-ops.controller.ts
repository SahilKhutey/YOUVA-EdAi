import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { TeacherDashboardService } from './services/teacher-dashboard.service';
import { Student360Service } from './services/student-360.service';
import { TeacherRecommendationService } from './services/teacher-recommendation.service';
import { TeacherInterventionOpsService } from './services/teacher-intervention-ops.service';
import { TeacherContentOpsService } from './services/teacher-content-ops.service';
import { TeacherAnalyticsOpsService } from './services/teacher-analytics-ops.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { ResolveInterventionDto } from './dto/resolve-intervention.dto';
import { OverrideRecommendationDto } from './dto/override-recommendation.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { AssignContentDto } from './dto/assign-content.dto';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.ADMIN)
export class TeacherOpsController {
  constructor(
    private readonly dashboardService: TeacherDashboardService,
    private readonly student360Service: Student360Service,
    private readonly recommendationService: TeacherRecommendationService,
    private readonly interventionService: TeacherInterventionOpsService,
    private readonly contentOpsService: TeacherContentOpsService,
    private readonly analyticsService: TeacherAnalyticsOpsService,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Teacher Home / Dashboard Overview
   */
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    return this.dashboardService.getDashboardOverview(req.user.id);
  }

  /**
   * Scoped Student Roster
   */
  @Get('students')
  async getStudents(@Req() req: any) {
    return this.dashboardService.getScopedStudents(req.user.id);
  }

  /**
   * Student 360 Diagnostic View
   */
  @Get('students/:id')
  async getStudent360(@Req() req: any, @Param('id') studentId: string) {
    return this.student360Service.getStudent360(req.user.id, studentId);
  }

  /**
   * Intervention Queue (URGENT and REVIEW)
   */
  @Get('interventions')
  async getInterventions(@Req() req: any) {
    return this.interventionService.getInterventionQueue(req.user.id);
  }

  /**
   * Resolve Intervention
   */
  @Post('interventions/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveIntervention(
    @Req() req: any,
    @Param('id') interventionId: string,
    @Body() dto: ResolveInterventionDto,
  ) {
    return this.interventionService.resolveIntervention(req.user.id, interventionId, dto);
  }

  /**
   * AI Recommendations Queue
   */
  @Get('recommendations')
  async getRecommendations(@Req() req: any) {
    return this.recommendationService.getRecommendations(req.user.id);
  }

  /**
   * Approve AI Recommendation
   */
  @Post('recommendations/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveRecommendation(@Req() req: any, @Param('id') decisionId: string) {
    return this.recommendationService.approveRecommendation(req.user.id, decisionId);
  }

  /**
   * Authoritatively Override AI Recommendation
   */
  @Post('recommendations/:id/override')
  @HttpCode(HttpStatus.OK)
  async overrideRecommendation(
    @Req() req: any,
    @Param('id') decisionId: string,
    @Body() dto: OverrideRecommendationDto,
  ) {
    return this.recommendationService.overrideRecommendation(req.user.id, decisionId, dto);
  }

  /**
   * Instructional Classes
   */
  @Get('classes')
  async getClasses(@Req() req: any) {
    return this.prisma.teacherClass.findMany({
      where: req.user.role === Role.ADMIN ? {} : { teacherId: req.user.id },
      include: {
        enrollments: {
          include: { student: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create Instructional Class
   */
  @Post('classes')
  @HttpCode(HttpStatus.CREATED)
  async createClass(@Req() req: any, @Body() dto: CreateClassDto) {
    return this.prisma.teacherClass.create({
      data: {
        teacherId: req.user.id,
        name: dto.name,
        subject: dto.subject,
        gradeLevel: dto.gradeLevel || null,
      },
    });
  }

  /**
   * Enroll Students into Class
   */
  @Post('classes/:id/enroll')
  @HttpCode(HttpStatus.OK)
  async enrollStudents(
    @Req() req: any,
    @Param('id') classId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    await this.scopeAuth.assertTeacherClassScope(req.user.id, classId);

    const enrollmentPromises = dto.studentIds.map((studentId) =>
      this.prisma.teacherClassEnrollment.upsert({
        where: { classId_studentId: { classId, studentId } },
        update: {},
        create: { classId, studentId },
      }),
    );

    return Promise.all(enrollmentPromises);
  }

  /**
   * Teacher Analytics & Agreement Rate
   */
  @Get('analytics')
  async getAnalytics(@Req() req: any) {
    return this.analyticsService.getScopedAnalytics(req.user.id);
  }

  /**
   * Content Authoring & Assignments
   */
  @Get('content')
  async getContent(@Req() req: any) {
    return this.contentOpsService.getTeacherContent(req.user.id);
  }

  /**
   * Publish Content Draft
   */
  @Post('content/publish/:id')
  @HttpCode(HttpStatus.OK)
  async publishContent(@Req() req: any, @Param('id') contentId: string) {
    return this.contentOpsService.publishContent(req.user.id, contentId);
  }

  /**
   * Assign Published Content
   */
  @Post('content/assign')
  @HttpCode(HttpStatus.OK)
  async assignContent(@Req() req: any, @Body() dto: AssignContentDto) {
    return this.contentOpsService.assignContent(req.user.id, dto);
  }
}
