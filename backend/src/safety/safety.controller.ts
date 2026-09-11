import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { SafetyEscalationService } from './safety-escalation.service';

@Controller('safety')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SafetyController {
  constructor(private readonly safetyEscalation: SafetyEscalationService) {}

  /**
   * Reports a safety incident (from client monitoring, teacher flag, or student report).
   */
  @Post('report')
  async reportIncident(
    @Req() req: any,
    @Body('studentId') studentId: string,
    @Body('category') category: string,
    @Body('summary') summary: string,
    @Body('severity') severity?: any,
    @Body('metadata') metadata?: Record<string, any>,
  ) {
    return this.safetyEscalation.reportIncident({
      studentId,
      category,
      summary,
      source: req.user?.role ? `${req.user.role}_REPORT` : 'AI_INTERACTION_MONITOR',
      severity,
      metadata: {
        ...metadata,
        reportedByUserId: req.user?.id,
      },
    });
  }

  /**
   * Retrieves open safety incidents for teacher / pastoral review.
   */
  @Get('incidents')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getOpenIncidents() {
    return this.safetyEscalation.getOpenIncidents();
  }

  /**
   * Resolves a safety incident.
   * STRICT GOVERNANCE INVARIANT:
   * Only human educators or counselors can authorize incident resolution.
   * AI systems are strictly prohibited.
   */
  @Post('resolve')
  @Roles(Role.TEACHER, Role.ADMIN)
  async resolveIncident(
    @Req() req: any,
    @Body('incidentId') incidentId: string,
    @Body('rationale') rationale: string,
    @Body('signature') signature: string,
  ) {
    return this.safetyEscalation.resolveIncident({
      incidentId,
      actor: {
        userId: req.user.id,
        role: req.user.role,
        name: req.user.name,
      },
      rationale,
      signature,
    });
  }
}
