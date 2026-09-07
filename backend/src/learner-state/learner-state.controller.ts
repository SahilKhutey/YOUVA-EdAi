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
import { LearnerStateService } from './learner-state.service';

@Controller('learner-state')
export class LearnerStateController {
  constructor(private readonly learnerStateService: LearnerStateService) {}

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
