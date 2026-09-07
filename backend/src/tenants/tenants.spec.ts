import { ForbiddenException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantGuard } from './guards/tenant.guard';
import { TenantContext } from './tenant.context';
import { Reflector } from '@nestjs/core';

describe('Tenants & Institutional Governance', () => {
  let mockPrisma: any;
  let tenantsService: TenantsService;
  let tenantGuard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    mockPrisma = {
      tenant: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'tenant-1', ...data })),
        findUnique: jest.fn(),
      },
      tenantMembership: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mem-1', ...data })),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([
          { role: 'STUDENT', _count: { userId: 25 } },
          { role: 'TEACHER', _count: { userId: 3 } },
        ]),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'mem-1', ...create })),
        delete: jest.fn().mockResolvedValue({ id: 'mem-1' }),
      },
      cohort: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'cohort-1', ...data })),
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: 'cohort-1' }),
      },
      cohortMembership: {
        upsert: jest.fn().mockResolvedValue({ id: 'cm-1', status: 'ACTIVE' }),
      },
      userTopicMastery: {
        aggregate: jest.fn().mockResolvedValue({ _avg: { mastery: 0.76 }, _count: { id: 50 } }),
        groupBy: jest.fn().mockResolvedValue([{ userId: 'student-risk-1' }]),
      },
      safetyEscalation: {
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    };

    reflector = new Reflector();
    tenantsService = new TenantsService(mockPrisma);
    tenantGuard = new TenantGuard(reflector, mockPrisma);
  });

  describe('TenantsService', () => {
    it('should create a new tenant and assign creator as TENANT_ADMIN', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await tenantsService.createTenant(
        { name: 'Apex Academy', slug: 'apex-academy' },
        'admin-user-1',
      );

      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Apex Academy', slug: 'apex-academy' }),
      });
      expect(mockPrisma.tenantMembership.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'admin-user-1',
          role: 'TENANT_ADMIN',
        }),
      });
      expect(result.id).toBe('tenant-1');
    });

    it('should reject tenant creation if slug already exists', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'existing-tenant', slug: 'apex-academy' });

      await expect(
        tenantsService.createTenant({ name: 'Apex Academy', slug: 'apex-academy' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should compute institutional KPIs including learner aggregates and risk metrics', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', name: 'Apex Academy' });
      mockPrisma.tenantMembership.findMany.mockResolvedValue([
        { userId: 'student-1' },
        { userId: 'student-risk-1' },
      ]);

      const analytics = await tenantsService.getInstitutionalKpis('tenant-1');

      expect(analytics.kpis.totalLearners).toBe(25);
      expect(analytics.kpis.totalTeachers).toBe(3);
      expect(analytics.kpis.averageMastery).toBe(0.76);
      expect(analytics.kpis.atRiskLearnersCount).toBe(1);
      expect(analytics.kpis.activeEscalationsCount).toBe(1);
    });
  });

  describe('TenantGuard', () => {
    it('should reject unauthenticated request', async () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { 'x-tenant-id': 'tenant-1' } }),
        }),
      };

      await expect(tenantGuard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject request missing tenant identifier', async () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-1' }, headers: {} }),
        }),
      };

      await expect(tenantGuard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should reject user who is not a member of the requested tenant', async () => {
      mockPrisma.tenantMembership.findUnique.mockResolvedValue(null);

      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-intruder', role: 'STUDENT' },
            headers: { 'x-tenant-id': 'tenant-1' },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      await expect(tenantGuard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should allow user with valid active membership', async () => {
      mockPrisma.tenantMembership.findUnique.mockResolvedValue({
        tenantId: 'tenant-1',
        userId: 'student-1',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const req: any = {
        user: { id: 'student-1', role: 'STUDENT' },
        headers: { 'x-tenant-id': 'tenant-1' },
      };

      const mockContext: any = {
        switchToHttp: () => ({ getRequest: () => req }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      const allowed = await tenantGuard.canActivate(mockContext);
      expect(allowed).toBe(true);
      expect(req.tenantContext.role).toBe('STUDENT');
    });

    it('should allow platform ADMIN universally', async () => {
      const req: any = {
        user: { id: 'admin-1', role: 'ADMIN' },
        headers: { 'x-tenant-id': 'tenant-any' },
      };

      const mockContext: any = {
        switchToHttp: () => ({ getRequest: () => req }),
        getHandler: () => ({}),
        getClass: () => ({}),
      };

      const allowed = await tenantGuard.canActivate(mockContext);
      expect(allowed).toBe(true);
      expect(req.tenantContext.role).toBe('TENANT_ADMIN');
    });
  });

  describe('TenantContext (AsyncLocalStorage)', () => {
    it('should isolate and return tenant ID inside context runner', () => {
      TenantContext.run({ tenantId: 'tenant-school-xyz' }, () => {
        expect(TenantContext.getTenantId()).toBe('tenant-school-xyz');
        expect(TenantContext.requireTenantId()).toBe('tenant-school-xyz');
      });

      expect(TenantContext.getTenantId()).toBeUndefined();
    });

    it('should throw ForbiddenException if requireTenantId called without context', () => {
      expect(() => TenantContext.requireTenantId()).toThrow(ForbiddenException);
    });
  });
});
