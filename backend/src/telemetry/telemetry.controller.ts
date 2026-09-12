import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * Exports privacy-scrubbed pedagogical telemetry for a given cohort.
   * Access restricted to educators and administrators.
   */
  @Get('cohort/:cohortId/export')
  @Roles(Role.TEACHER, Role.ADMIN)
  exportCohortTelemetry(@Param('cohortId') cohortId: string) {
    return this.telemetryService.exportCohortTelemetry(cohortId);
  }

  /**
   * Returns telemetry summary count for a cohort.
   */
  @Get('cohort/:cohortId/summary')
  @Roles(Role.TEACHER, Role.ADMIN)
  getCohortSummary(@Param('cohortId') cohortId: string) {
    const data = this.telemetryService.exportCohortTelemetry(cohortId);
    return {
      cohortId: data.cohortId,
      totalEvents: data.totalEvents,
      exportedAt: data.exportedAt,
    };
  }
}
