import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { LearningLoopService } from './learning-loop.service';
import { TeacherInterventionService } from './intervention/teacher-intervention.service';
import { EscalationStateMachineService } from './escalation/escalation-state-machine.service';
import { LearningLoopAuditService } from './audit/learning-loop-audit.service';
import { SubmitEvidenceDto } from './dto/submit-evidence.dto';
import { PersonalizationRequestDto } from './dto/personalization-request.dto';
import { TeacherInterventionDto } from './dto/teacher-intervention.dto';
import { ResolveEscalationDto } from './dto/escalation-action.dto';
import { ActorType } from './domain/enums';

@Controller('learning-loop')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LearningLoopController {
  constructor(
    private readonly learningLoopService: LearningLoopService,
    private readonly teacherInterventionService: TeacherInterventionService,
    private readonly escalationStateMachine: EscalationStateMachineService,
    private readonly auditService: LearningLoopAuditService,
    private readonly scopeAuth: ScopeAuthorizationService,
  ) {}

  /**
   * Builds dynamic learning context for the current student.
   */
  @Post('context')
  @HttpCode(HttpStatus.OK)
  async getContext(@Req() req: any, @Body() body: { topicId: string; studentId?: string }) {
    const staff = req.user.role === Role.TEACHER || req.user.role === Role.ADMIN;
    const studentId = body.studentId && staff ? body.studentId : req.user.id;
    if (studentId !== req.user.id) await this.scopeAuth.assertTeacherStudentScope(req.user.id, studentId);

    return this.learningLoopService.getContext(studentId, body.topicId);
  }

  /**
   * Requests deterministic next-action recommendation.
   */
  @Post('personalize')
  @HttpCode(HttpStatus.OK)
  async getPersonalization(@Req() req: any, @Body() body: PersonalizationRequestDto) {
    return this.learningLoopService.personalize(req.user.id, body.topicId);
  }

  /**
   * Submits student learning evidence with idempotency check,
   * updates mastery deterministically, and triggers policy gates.
   */
  @Post('evidence')
  @HttpCode(HttpStatus.OK)
  async submitEvidence(@Req() req: any, @Body() dto: SubmitEvidenceDto) {
    return this.learningLoopService.processEvidenceAndAdvance(req.user.id, dto);
  }

  /**
   * Checks current policy safety gate state for a student.
   */
  @Get('gate/:studentId')
  async getGateStatus(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Body() body?: { topicId?: string },
  ) {
    // Scope check: Student can only view their own gate status unless Teacher/Admin
    if (req.user.role === Role.STUDENT && req.user.id !== studentId) {
      throw new ForbiddenException('Access denied: Cannot query policy gate for another student.');
    }
    if (req.user.role === Role.TEACHER) {
      await this.scopeAuth.assertTeacherStudentScope(req.user.id, studentId);
    }

    const topicId = body?.topicId || 'default-topic';
    return this.learningLoopService.getGateStatus(studentId, topicId);
  }

  /**
   * TEACHER-ONLY: Retrieves review queue of students requiring human intervention.
   */
  @Get('teacher/queue')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeacherQueue(@Req() req: any) {
    return this.teacherInterventionService.getTeacherQueue(req.user.id);
  }

  /**
   * TEACHER-ONLY: Executes approval, override, or intervention on a student's learning loop.
   */
  @Post('teacher/intervention')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async executeTeacherIntervention(@Req() req: any, @Body() dto: TeacherInterventionDto) {
    return this.teacherInterventionService.executeIntervention(req.user.id, dto);
  }

  /**
   * TEACHER/ADMIN-ONLY: Resolves or reviews an open safety escalation.
   */
  @Post('escalation/:id/resolve')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resolveEscalation(
    @Req() req: any,
    @Param('id') escalationId: string,
    @Body() dto: ResolveEscalationDto,
  ) {
    // A teacher can resolve an escalation only for a student in their own scope.
    const studentId = await this.escalationStateMachine.getEscalationStudentId(escalationId);
    await this.scopeAuth.assertTeacherStudentScope(req.user.id, studentId);
    return this.escalationStateMachine.transitionState(
      escalationId,
      dto.status,
      req.user.role === Role.ADMIN ? ActorType.SYSTEM : ActorType.TEACHER,
      req.user.id,
      dto.resolutionNotes,
    );
  }

  /**
   * Retrieves append-only audit trail for a student.
   */
  @Get('audit/:studentId')
  async getAuditTrail(@Req() req: any, @Param('studentId') studentId: string) {
    if (req.user.role === Role.STUDENT && req.user.id !== studentId) {
      throw new ForbiddenException('Access denied: Students can only view their own audit trail.');
    }
    // Teachers can read the trail only for students in their own class or assignment.
    if (req.user.role === Role.TEACHER) {
      await this.scopeAuth.assertTeacherStudentScope(req.user.id, studentId);
    }

    return this.auditService.getStudentAuditTrail(studentId);
  }
}
