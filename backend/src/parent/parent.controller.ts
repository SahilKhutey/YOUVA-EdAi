import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ParentAccessService } from './parent-access.service';

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentController {
  constructor(
    private readonly parentAccessService: ParentAccessService,
  ) {}

  @Get('children')
  getChildren(@Req() req: any) {
    return this.parentAccessService.getChildren(req.user.id);
  }

  /**
   * Canonical N3 route for linked learners.
   */
  @Get('learners')
  getLearners(@Req() req: any) {
    return this.parentAccessService.getChildren(req.user.id);
  }

  @Get('children/:studentId')
  getChild(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentAccessService.getChild(
      req.user.id,
      studentId,
    );
  }

  /**
   * Canonical N3 route for linked learner progress.
   */
  @Get('learners/:studentId/progress')
  getLearnerProgress(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentAccessService.getChild(
      req.user.id,
      studentId,
    );
  }

  /**
   * Canonical N3 route for recent learner learning activity.
   */
  @Get('learners/:studentId/activity')
  getLearnerActivity(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentAccessService.getChildActivity(
      req.user.id,
      studentId,
    );
  }

  /**
   * Canonical N3 route for learner DPDP consent status and verification evidence.
   */
  @Get('learners/:studentId/consent')
  getLearnerConsent(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentAccessService.getChildConsent(
      req.user.id,
      studentId,
    );
  }

  /**
   * Canonical N3 route for parent notifications.
   */
  @Get('notifications')
  getNotifications(@Req() req: any) {
    return this.parentAccessService.getParentNotifications(req.user.id);
  }
}
