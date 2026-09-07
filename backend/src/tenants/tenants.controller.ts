import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import { TenantRoles, TenantRole } from './decorators/tenant-roles.decorator';
import { TenantsService } from './tenants.service';
import {
  CreateTenantDto,
  AddTenantMemberDto,
  CreateCohortDto,
  EnrollCohortStudentDto,
} from './dto/tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Platform admin creates a new tenant.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTenant(@Body() dto: CreateTenantDto, @Request() req: any) {
    return this.tenantsService.createTenant(dto, req.user?.id);
  }

  /**
   * List all tenants the authenticated user belongs to.
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyTenants(@Request() req: any) {
    return this.tenantsService.listTenantsForUser(req.user.id);
  }

  /**
   * Get single tenant details.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  /**
   * Add or invite a member to a tenant.
   */
  @Post(':id/members')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @TenantRoles(TenantRole.TENANT_ADMIN, TenantRole.PRINCIPAL)
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddTenantMemberDto,
  ) {
    return this.tenantsService.addMember(id, dto);
  }

  /**
   * Remove a member from a tenant.
   */
  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @TenantRoles(TenantRole.TENANT_ADMIN, TenantRole.PRINCIPAL)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.tenantsService.removeMember(id, userId);
  }

  /**
   * Create an institutional cohort.
   */
  @Post(':id/cohorts')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @TenantRoles(
    TenantRole.TENANT_ADMIN,
    TenantRole.PRINCIPAL,
    TenantRole.CURRICULUM_DIRECTOR,
  )
  async createCohort(
    @Param('id') id: string,
    @Body() dto: CreateCohortDto,
  ) {
    return this.tenantsService.createCohort(id, dto);
  }

  /**
   * List cohorts for a tenant.
   */
  @Get(':id/cohorts')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listCohorts(@Param('id') id: string) {
    return this.tenantsService.listCohorts(id);
  }

  /**
   * Enroll a student into a cohort.
   */
  @Post(':id/cohorts/:cohortId/students')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @TenantRoles(
    TenantRole.TENANT_ADMIN,
    TenantRole.PRINCIPAL,
    TenantRole.TEACHER,
  )
  async enrollStudent(
    @Param('cohortId') cohortId: string,
    @Body() dto: EnrollCohortStudentDto,
  ) {
    return this.tenantsService.enrollStudentToCohort(cohortId, dto.studentId);
  }

  /**
   * Institutional KPIs and learning health telemetry.
   */
  @Get(':id/analytics/kpis')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @TenantRoles(
    TenantRole.TENANT_ADMIN,
    TenantRole.PRINCIPAL,
    TenantRole.CURRICULUM_DIRECTOR,
  )
  async getInstitutionalKpis(@Param('id') id: string) {
    return this.tenantsService.getInstitutionalKpis(id);
  }
}
