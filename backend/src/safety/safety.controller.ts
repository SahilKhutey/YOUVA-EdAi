import {
  Body,
  Controller,
  ForbiddenException,
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
   * Canonical N3 route for recording and classifying safety signals / events.
   */
  @Post('events')
  async recordSafetyEvent(
    @Req() req: any,
    @Body('learnerId') learnerId?: string,
    @Body('studentId') studentId?: string,
    @Body('category') category?: string,
    @Body('severity') severity?: any,
    @Body('source') source?: string,
    @Body('summary') summary?: string,
    @Body('evidence') evidence?: any,
    @Body('metadata') metadata?: Record<string, any>,
  ) {
    const targetStudentId = learnerId || studentId || req.user?.id;
    const effectiveCategory = category || 'GENERAL_SAFETY';
    return this.safetyEscalation.reportIncident({
      studentId: targetStudentId,
      category: effectiveCategory,
      summary: summary || `Safety event recorded for ${effectiveCategory}`,
      source: source || (req.user?.role ? `${req.user.role}_REPORT` : 'AI_INTERACTION_MONITOR'),
      severity,
      metadata: {
        ...(typeof evidence === 'object' ? evidence : { evidence }),
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
   * Canonical N3 route for open escalations queue.
   */
  @Get('escalations')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getOpenEscalations() {
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
    const userRole = (req.user?.role || req.user?.actorType || '').toUpperCase().trim();
    if (userRole === 'AI' || userRole === 'BOT' || userRole === 'SYSTEM') {
      throw new ForbiddenException(
        'SafetyGovernanceViolation: AI systems are strictly prohibited from closing safety incidents',
      );
    }

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
