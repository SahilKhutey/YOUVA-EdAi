import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves immutable audit events with actor, resource, and action filtering.
   */
  @Get('events')
  @Roles(Role.ADMIN)
  async getEvents(
    @Query('actorId') actorId?: string,
    @Query('resource') resource?: string,
    @Query('resourceId') resourceId?: string,
    @Query('action') action?: string,
    @Query('outcome') outcome?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getEvents({
      actorId,
      resource,
      resourceId,
      action,
      outcome,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  /**
   * Verifies cryptographic HMAC-SHA256 hash chain integrity of the ledger.
   */
  @Get('verify-chain')
  @Roles(Role.ADMIN)
  async verifyChain(@Query('limit') limit?: string) {
    const maxEntries = limit ? parseInt(limit, 10) : 1000;
    return this.auditService.verifyLedgerIntegrity(maxEntries);
  }
}
