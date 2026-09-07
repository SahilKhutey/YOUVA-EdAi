import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { EscalationService } from './escalation.service';

@Controller('safety-escalations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.ADMIN)
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  @Get()
  getEscalations(
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
    @Query('severity') severity?: string,
  ) {
    return this.escalationService.getEscalations({ status, studentId, severity });
  }

  @Get(':id')
  getEscalationById(@Param('id') id: string) {
    return this.escalationService.getEscalationById(id);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
    @Req() req: any,
  ) {
    const targetUserId = assignedToId || req.user.id;
    return this.escalationService.assign(id, targetUserId, req.user.role);
  }

  @Post(':id/review')
  review(@Param('id') id: string, @Req() req: any) {
    return this.escalationService.review(id, req.user.role);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Req() req: any,
  ) {
    return this.escalationService.resolve(
      id,
      req.user.id,
      resolution,
      req.user.role,
    );
  }
}
