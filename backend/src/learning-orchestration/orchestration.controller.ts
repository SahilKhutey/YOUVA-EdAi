import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { OrchestrationService } from './orchestration.service';
import { DEFAULT_ADAPTIVE_POLICY, CURRENT_POLICY_VERSION } from './decision/decision.policy';

@Controller(['v1/learning-orchestration', 'learning-orchestration'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  // ==========================================================================
  // STUDENT ENDPOINTS
  // ==========================================================================

  /**
   * Primary adaptive endpoint: "What should happen next for this learner right now?"
   */
  @Get('next')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getNext(
    @Req() req: any,
    @Query('currentKnowledgeId') currentKnowledgeId?: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.getNextAction(
      learnerId,
      currentKnowledgeId,
      tenantId,
    );
  }

  /**
   * Retrieves active adaptive session context for the learner.
   */
  @Get('context')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getContext(@Req() req: any) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.getContext(learnerId, tenantId);
  }

  /**
   * Diagnostic lookup of an adaptive decision by ID.
   */
  @Get('decisions/:id')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getDecision(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.getDecision(id, tenantId);
  }

  /**
   * Triggers an adaptive recalculation.
   */
  @Post('recalculate')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async recalculate(
    @Req() req: any,
    @Body() body: { currentKnowledgeId?: string; triggerEvent?: string },
  ) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.recalculate(
      learnerId,
      body.currentKnowledgeId,
      body.triggerEvent,
      tenantId,
    );
  }

  /**
   * Marks an adaptive action as completed.
   */
  @Post('actions/:id/complete')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async completeAction(@Param('id') id: string, @Req() req: any) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.completeAction(id, learnerId, tenantId);
  }

  /**
   * Skips an adaptive action.
   */
  @Post('actions/:id/skip')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async skipAction(@Param('id') id: string, @Req() req: any) {
    const learnerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.skipAction(id, learnerId, tenantId);
  }

  /**
   * Returns active adaptive policy configuration and version.
   */
  @Get('policies')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  async getPolicies() {
    return {
      version: CURRENT_POLICY_VERSION,
      policy: DEFAULT_ADAPTIVE_POLICY,
    };
  }

  // ==========================================================================
  // TEACHER ENDPOINTS
  // ==========================================================================

  /**
   * Teacher view of a learner's adaptive status, recent mastery, and active overrides.
   */
  @Get('teacher/learners/:learnerId')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeacherLearnerView(
    @Param('learnerId') learnerId: string,
    @Req() req: any,
  ) {
    const teacherId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.getTeacherLearnerView(
      teacherId,
      learnerId,
      tenantId,
    );
  }

  /**
   * Teacher override on learner's adaptive progression.
   */
  @Post('teacher/override')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async teacherOverride(
    @Req() req: any,
    @Body()
    body: {
      learnerId: string;
      action: string;
      targetKnowledgeId?: string;
      reason?: string;
    },
  ) {
    const teacherId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.orchestrationService.recordTeacherOverride(
      teacherId,
      body.learnerId,
      body,
      tenantId,
    );
  }
}
