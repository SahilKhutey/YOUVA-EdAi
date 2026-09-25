import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GraphValidationService } from '../graph-validation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GraphValidationService', () => {
  let service: GraphValidationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      knowledgeObject: {
        findUnique: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      knowledgeRelationship: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphValidationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GraphValidationService>(GraphValidationService);
  });

  describe('wouldCreateCycle & isReachable', () => {
    it('should return true for self-referencing relationship', async () => {
      const result = await service.wouldCreateCycle('node-A', 'node-A', 'PREREQUISITE');
      expect(result).toBe(true);
    });

    it('should return false for non-progression relations', async () => {
      const result = await service.wouldCreateCycle('node-A', 'node-B', 'RELATED_TO');
      expect(result).toBe(false);
    });

    it('should detect a direct cycle (A -> B, then trying to add B -> A)', async () => {
      // Trying to add B -> A as PREREQUISITE.
      // wouldCreateCycle(sourceId='B', targetId='A'): checks if A can reach B.
      // In DB, A -> B already exists:
      prisma.knowledgeRelationship.findMany.mockImplementation((args: any) => {
        if (args.where.sourceId === 'A' && args.where.relation === 'PREREQUISITE') {
          return Promise.resolve([{ targetId: 'B' }]);
        }
        return Promise.resolve([]);
      });

      const cycle = await service.wouldCreateCycle('B', 'A', 'PREREQUISITE');
      expect(cycle).toBe(true);
    });

    it('should detect a multi-hop cycle (A -> B -> C, then trying to add C -> A)', async () => {
      // Trying to add C -> A. Checks if A can reach C.
      // In DB: A -> B, and B -> C
      prisma.knowledgeRelationship.findMany.mockImplementation((args: any) => {
        if (args.where.sourceId === 'A') return Promise.resolve([{ targetId: 'B' }]);
        if (args.where.sourceId === 'B') return Promise.resolve([{ targetId: 'C' }]);
        return Promise.resolve([]);
      });

      const cycle = await service.wouldCreateCycle('C', 'A', 'PREREQUISITE');
      expect(cycle).toBe(true);
    });

    it('should return false when no cycle is created', async () => {
      prisma.knowledgeRelationship.findMany.mockResolvedValue([]);
      const cycle = await service.wouldCreateCycle('A', 'B', 'PREREQUISITE');
      expect(cycle).toBe(false);
    });
  });

  describe('validateRelationship', () => {
    it('should throw BadRequestException if source equals target', async () => {
      await expect(
        service.validateRelationship('node-1', 'node-1', 'PREREQUISITE'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if source does not exist', async () => {
      prisma.knowledgeObject.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'target' });

      await expect(
        service.validateRelationship('missing-source', 'target', 'PREREQUISITE'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target does not exist', async () => {
      prisma.knowledgeObject.findUnique
        .mockResolvedValueOnce({ id: 'source', tenantId: 'tenant-1' })
        .mockResolvedValueOnce(null);

      await expect(
        service.validateRelationship('source', 'missing-target', 'PREREQUISITE'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for cross-tenant relationships', async () => {
      prisma.knowledgeObject.findUnique
        .mockResolvedValueOnce({ id: 's', tenantId: 'tenant-A', title: 'Source' })
        .mockResolvedValueOnce({ id: 't', tenantId: 'tenant-B', title: 'Target' });

      await expect(
        service.validateRelationship('s', 't', 'PREREQUISITE', 'tenant-A'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when relationship creates a cycle', async () => {
      prisma.knowledgeObject.findUnique
        .mockResolvedValueOnce({ id: 'B', tenantId: 'tenant-1', title: 'B' })
        .mockResolvedValueOnce({ id: 'A', tenantId: 'tenant-1', title: 'A' });

      // Simulate A reaches B
      prisma.knowledgeRelationship.findMany.mockResolvedValue([{ targetId: 'B' }]);

      await expect(
        service.validateRelationship('B', 'A', 'PREREQUISITE', 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should pass validation for a valid relationship and return warnings for unpublished nodes', async () => {
      prisma.knowledgeObject.findUnique
        .mockResolvedValueOnce({ id: 'A', tenantId: 'tenant-1', title: 'A', status: 'DRAFT' })
        .mockResolvedValueOnce({ id: 'B', tenantId: 'tenant-1', title: 'B', status: 'PUBLISHED' });

      prisma.knowledgeRelationship.findMany.mockResolvedValue([]);

      const result = await service.validateRelationship('A', 'B', 'PREREQUISITE', 'tenant-1');
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateGraphHealth', () => {
    it('should correctly aggregate graph metrics and identify orphan nodes', async () => {
      prisma.knowledgeObject.count.mockResolvedValue(3);
      prisma.knowledgeObject.findMany.mockResolvedValue([
        { id: 'n1', status: 'PUBLISHED', title: 'N1' },
        { id: 'n2', status: 'PUBLISHED', title: 'N2' },
        { id: 'orphan-1', status: 'DRAFT', title: 'Orphan' },
      ]);

      prisma.knowledgeRelationship.findMany.mockResolvedValue([
        {
          id: 'edge-1',
          sourceId: 'n1',
          targetId: 'n2',
          relation: 'PREREQUISITE',
          source: { id: 'n1', status: 'PUBLISHED', title: 'N1' },
          target: { id: 'n2', status: 'PUBLISHED', title: 'N2' },
        },
      ]);

      const health = await service.validateGraphHealth('tenant-1');
      expect(health.totalNodes).toBe(3);
      expect(health.totalRelationships).toBe(1);
      expect(health.prerequisiteRelationships).toBe(1);
      expect(health.orphanNodes).toBe(1);
      expect(health.brokenRelationships).toBe(0);
      expect(health.potentialCycles).toBe(0);
    });
  });
});
