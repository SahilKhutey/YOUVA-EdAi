import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { LearnerStateService } from './learner-state.service';
import { LearnerKnowledgeStateService } from './learner-knowledge-state.service';

@Controller(['v1/learner-state', 'learner-state'])
export class LearnerStateController {
  constructor(
    private readonly learnerStateService: LearnerStateService,
    private readonly knowledgeStateService: LearnerKnowledgeStateService,
  ) {}

  /**
   * Retrieves all canonical knowledge states for the authenticated learner.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyKnowledgeStates(
    @Request() req: any,
    @Headers('x-tenant-id') headerTenant?: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = headerTenant || req.user?.tenantId || 'default-tenant';
    return this.knowledgeStateService.getAllStatesForLearner(tenantId, learnerId);
  }

  /**
   * Retrieves learner state for a specific canonical knowledge object.
   */
  @Get('knowledge/:id')
  @UseGuards(JwtAuthGuard)
  async getKnowledgeState(
    @Param('id') knowledgeObjectId: string,
    @Request() req: any,
    @Headers('x-tenant-id') headerTenant?: string,
  ) {
    const learnerId = req.user.id;
    const tenantId = headerTenant || req.user?.tenantId || 'default-tenant';
    return this.knowledgeStateService.getState(tenantId, learnerId, knowledgeObjectId);
  }

  /**
   * Retrieves teacher class-level analytics on a knowledge object.
   */
  @Get('teacher/:knowledgeId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async getTeacherAnalytics(
    @Param('knowledgeId') knowledgeObjectId: string,
    @Request() req: any,
    @Headers('x-tenant-id') headerTenant?: string,
  ) {
    const tenantId = headerTenant || req.user?.tenantId || 'default-tenant';
    return this.knowledgeStateService.getTeacherAnalytics(tenantId, knowledgeObjectId);
  }

  /**
   * Retrieve the complete, authoritative Unified Learner State dossier.
   */
  @Get(':studentId')
  @UseGuards(JwtAuthGuard)
  async getLearnerState(
    @Param('studentId') studentId: string,
    @Headers('x-tenant-id') tenantId: string | undefined,
    @Request() req: any,
  ) {
    const user = req.user;

    // Authorization: Students may only access their own state
    if (user.role === 'STUDENT' && user.id !== studentId) {
      throw new ForbiddenException('Students can only access their own learning state');
    }

    return this.learnerStateService.getUnifiedLearnerSnapshot(studentId, tenantId);
  }

  /**
   * Evaluate learning readiness and zone of proximal development for a specific topic.
   */
  @Get(':studentId/readiness/:topicId')
  @UseGuards(JwtAuthGuard)
  async evaluateReadiness(
    @Param('studentId') studentId: string,
    @Param('topicId') topicId: string,
    @Headers('x-tenant-id') tenantId: string | undefined,
    @Request() req: any,
  ) {
    const user = req.user;

    if (user.role === 'STUDENT' && user.id !== studentId) {
      throw new ForbiddenException('Students can only query their own readiness');
    }

    return this.learnerStateService.evaluateReadiness(studentId, topicId, tenantId);
  }
}
