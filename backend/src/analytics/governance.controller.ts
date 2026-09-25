import {
  Controller,
  Get,
  Post,
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
import { GovernanceService } from './governance/governance.service';

@Controller(['v1/governance', 'governance'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('policies')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getPolicies(@Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.governanceService.getPolicies(tenantId);
  }

  @Post('policies/:id/activate')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async activatePolicy(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.governanceService.activatePolicy(id, tenantId);
  }

  @Get('issues')
  @Roles(Role.TEACHER, Role.ADMIN)
  async getIssues(@Req() req: any, @Query('status') status?: string) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.governanceService.getIssues(tenantId, status);
  }

  @Post('issues/:id/acknowledge')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async acknowledgeIssue(@Param('id') id: string, @Req() req: any) {
    const ownerId = req.user.id;
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.governanceService.acknowledgeIssue(id, ownerId, tenantId);
  }

  @Post('issues/:id/resolve')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resolveIssue(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.governanceService.resolveIssue(id, tenantId);
  }

  @Post('data-quality/run')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async runDataQualityChecks(@Req() req: any) {
    const tenantId = req.tenantId || req.user.tenantId || 'default-tenant';
    return this.governanceService.runDataQualityChecks(tenantId);
  }
}
