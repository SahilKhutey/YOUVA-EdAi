import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { GovernanceService } from '../governance/governance.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GovernanceService (LKC-8)', () => {
  let service: GovernanceService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      governancePolicy: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      governanceIssue: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      adaptiveDecision: {
        count: jest.fn(),
      },
      knowledgeObject: {
        findMany: jest.fn(),
      },
      teacherClassEnrollment: {
        count: jest.fn(),
      },
      analyticsExport: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
  });

  describe('Policy Governance', () => {
    it('should activate policy and retire existing active policies of that type', async () => {
      mockPrisma.governancePolicy.findUnique.mockResolvedValue({
        id: 'pol-2',
        policyType: 'ADAPTIVE_RULES',
        version: 'v2',
      });
      mockPrisma.governancePolicy.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.governancePolicy.update.mockResolvedValue({
        id: 'pol-2',
        status: 'ACTIVE',
      });

      const activated = await service.activatePolicy('pol-2', 'tenant-1');

      expect(mockPrisma.governancePolicy.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          policyType: 'ADAPTIVE_RULES',
          status: 'ACTIVE',
        },
        data: { status: 'RETIRED' },
      });
      expect(activated.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException when activating non-existent policy', async () => {
      mockPrisma.governancePolicy.findUnique.mockResolvedValue(null);

      await expect(service.activatePolicy('pol-missing', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Data Quality Checks', () => {
    it('should detect stale adaptive decisions and published objects without versions', async () => {
      // 2 stale decisions (> 14 days)
      mockPrisma.adaptiveDecision.count.mockResolvedValue(2);
      // 1 published object without versions
      mockPrisma.knowledgeObject.findMany.mockResolvedValue([
        { id: 'ko-1', title: 'Empty Published', status: 'PUBLISHED', versions: [] },
        { id: 'ko-2', title: 'Valid Published', status: 'PUBLISHED', versions: [{ id: 'v-1' }] },
      ]);
      mockPrisma.governanceIssue.create
        .mockResolvedValueOnce({ id: 'iss-1', code: 'STALE_ADAPTIVE_DECISIONS' })
        .mockResolvedValueOnce({ id: 'iss-2', code: 'PUBLISHED_WITHOUT_VERSION' });

      const result = await service.runDataQualityChecks('tenant-1');

      expect(result.issuesDetected).toBe(2);
      expect(result.issues).toHaveLength(2);
      expect(mockPrisma.governanceIssue.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Small-Cohort Privacy Protection', () => {
    it('should suppress export and throw ForbiddenException when cohort size < 5', async () => {
      mockPrisma.teacherClassEnrollment.count.mockResolvedValue(3); // Cohort size 3 < 5

      await expect(
        service.createExport('teacher-1', 'CLASS_PROGRESS', 'class-1', 'CSV', 'tenant-1'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.analyticsExport.create).not.toHaveBeenCalled();
    });

    it('should allow export when cohort size >= 5', async () => {
      mockPrisma.teacherClassEnrollment.count.mockResolvedValue(25); // Cohort size 25 >= 5
      mockPrisma.analyticsExport.create.mockResolvedValue({
        id: 'exp-1',
        status: 'COMPLETED',
        requesterId: 'teacher-1',
      });

      const exp = await service.createExport(
        'teacher-1',
        'CLASS_PROGRESS',
        'class-1',
        'CSV',
        'tenant-1',
      );

      expect(exp.id).toBe('exp-1');
      expect(mockPrisma.analyticsExport.create).toHaveBeenCalled();
    });
  });
});
