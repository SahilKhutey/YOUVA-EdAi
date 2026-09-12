import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  AddTenantMemberDto,
  CreateCohortDto,
} from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new institutional tenant.
   */
  async createTenant(dto: CreateTenantDto, creatorUserId?: string) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Tenant slug '${dto.slug}' is already taken`);
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          type: dto.type || 'SCHOOL',
          settings: dto.settings ? JSON.stringify(dto.settings) : null,
        },
      });

      if (creatorUserId) {
        await tx.tenantMembership.create({
          data: {
            tenantId: tenant.id,
            userId: creatorUserId,
            role: 'TENANT_ADMIN',
            status: 'ACTIVE',
          },
        });
      }

      return tenant;
    });
  }

  /**
   * Retrieve a tenant by ID.
   */
  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memberships: true,
            cohorts: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant [${id}] not found`);
    }

    return {
      ...tenant,
      settings: tenant.settings ? JSON.parse(tenant.settings) : null,
    };
  }

  /**
   * Retrieve a tenant by slug.
   */
  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant slug '${slug}' not found`);
    }

    return {
      ...tenant,
      settings: tenant.settings ? JSON.parse(tenant.settings) : null,
    };
  }

  /**
   * List all tenants that a user belongs to.
   */
  async listTenantsForUser(userId: string) {
    const memberships = await this.prisma.tenantMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { tenant: true },
    });

    return memberships.map((m) => ({
      tenantId: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      type: m.tenant.type,
      status: m.tenant.status,
      userRole: m.role,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Provision or invite a user into a tenant.
   */
  async addMember(tenantId: string, dto: AddTenantMemberDto) {
    await this.getTenantById(tenantId);

    return this.prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId,
          userId: dto.userId,
        },
      },
      update: {
        role: dto.role,
        status: dto.status || 'ACTIVE',
      },
      create: {
        tenantId,
        userId: dto.userId,
        role: dto.role,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  /**
   * Remove a user from a tenant.
   */
  async removeMember(tenantId: string, userId: string) {
    return this.prisma.tenantMembership.delete({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });
  }

  /**
   * Create an institutional cohort (class / grade section).
   */
  async createCohort(tenantId: string, dto: CreateCohortDto) {
    await this.getTenantById(tenantId);

    return this.prisma.cohort.create({
      data: {
        tenantId,
        name: dto.name,
        academicYear: dto.academicYear,
        gradeLevel: dto.gradeLevel || null,
      },
    });
  }

  /**
   * Enroll a student into a cohort.
   */
  async enrollStudentToCohort(cohortId: string, studentId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort [${cohortId}] not found`);
    }

    return this.prisma.cohortMembership.upsert({
      where: {
        cohortId_studentId: {
          cohortId,
          studentId,
        },
      },
      update: { status: 'ACTIVE' },
      create: {
        cohortId,
        studentId,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * List all cohorts for a tenant.
   */
  async listCohorts(tenantId: string) {
    return this.prisma.cohort.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Compute institutional KPIs and learning health aggregates.
   */
  async getInstitutionalKpis(tenantId: string) {
    await this.getTenantById(tenantId);

    const [totalMembers, cohortsCount] = await Promise.all([
      this.prisma.tenantMembership.groupBy({
        by: ['role'],
        where: { tenantId, status: 'ACTIVE' },
        _count: { userId: true },
      }),
      this.prisma.cohort.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    const roleBreakdown: Record<string, number> = {};
    let totalLearners = 0;
    let totalTeachers = 0;

    for (const group of totalMembers) {
      roleBreakdown[group.role] = group._count.userId;
      if (group.role === 'STUDENT') totalLearners += group._count.userId;
      if (group.role === 'TEACHER') totalTeachers += group._count.userId;
    }

    // Get active students list in this tenant
    const studentMemberships = await this.prisma.tenantMembership.findMany({
      where: { tenantId, role: 'STUDENT', status: 'ACTIVE' },
      select: { userId: true },
    });
    const studentIds = studentMemberships.map((s) => s.userId);

    // Calculate aggregated mastery stats across tenant students
    let averageMastery = 0;
    let atRiskLearnersCount = 0;

    if (studentIds.length > 0) {
      const masteryAggregate = await this.prisma.userTopicMastery.aggregate({
        where: { userId: { in: studentIds } },
        _avg: { masteryProbability: true },
        _count: { id: true },
      });

      const avgProb = (masteryAggregate._avg as any)?.masteryProbability;
      averageMastery = avgProb
        ? Math.round(avgProb * 100) / 100
        : 0;

      // Identify students whose average mastery is below 0.5
      const lowMasteryStudents = await (this.prisma.userTopicMastery as any).groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds } },
        _avg: { masteryProbability: true },
        having: {
          masteryProbability: { _avg: { lt: 0.5 } },
        },
      });
      atRiskLearnersCount = lowMasteryStudents.length;
    }

    // Active open safety escalations for tenant learners
    const activeEscalationsCount =
      studentIds.length > 0
        ? await this.prisma.safetyEscalation.count({
            where: {
              studentId: { in: studentIds },
              status: { in: ['OPEN', 'IN_REVIEW'] },
            },
          })
        : 0;

    return {
      tenantId,
      kpis: {
        totalLearners,
        totalTeachers,
        cohortsCount,
        averageMastery,
        atRiskLearnersCount,
        activeEscalationsCount,
        roleBreakdown,
      },
      computedAt: new Date().toISOString(),
    };
  }
}
