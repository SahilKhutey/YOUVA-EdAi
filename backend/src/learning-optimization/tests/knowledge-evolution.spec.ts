import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeEvolutionService } from '../services/knowledge-evolution.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('KnowledgeEvolutionService & Provenance (LKC-11)', () => {
  let service: KnowledgeEvolutionService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      knowledgeVersion: {
        findFirst: jest.fn(),
      },
      learningLineage: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      improvementPlan: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeEvolutionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KnowledgeEvolutionService>(KnowledgeEvolutionService);
  });

  it('should build a complete KnowledgeEvolutionTree for a knowledge object with version nodes', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'ko-linear',
      title: 'Linear Equations',
      currentVersion: 2,
      versions: [
        {
          id: 'v1-id',
          version: 1,
          authorId: 'teacher-1',
          sourceType: 'TEACHER',
          publishedAt: new Date('2026-01-01'),
        },
        {
          id: 'v2-id',
          version: 2,
          authorId: 'teacher-1',
          sourceType: 'TEACHER',
          publishedAt: new Date('2026-02-01'),
        },
      ],
    });

    mockPrisma.learningLineage.findMany.mockResolvedValue([
      {
        targetType: 'KNOWLEDGE_VERSION',
        targetId: 'v2-id',
        sourceType: 'IMPROVEMENT_PLAN',
        sourceId: 'plan-99',
        metadata: JSON.stringify({ actorType: 'TEACHER' }),
      },
    ]);

    const tree = await service.getKnowledgeEvolution('ko-linear', 'tenant-1');
    expect(tree.knowledgeObjectId).toBe('ko-linear');
    expect(tree.currentVersion).toBe(2);
    expect(tree.versions.length).toBe(2);
    expect(tree.versions[1].derivedFromVersionId).toBe('v1');
    expect(tree.versions[1].sourcePlanId).toBe('plan-99');
  });

  it('PROVENANCE: should explain why a specific version exists', async () => {
    mockPrisma.knowledgeVersion.findFirst.mockResolvedValue({
      id: 'v2-id',
      version: 2,
      authorId: 'teacher-1',
      sourceType: 'TEACHER',
      publishedAt: new Date('2026-02-01'),
      knowledgeObject: {
        title: 'Linear Equations',
      },
    });

    mockPrisma.learningLineage.findFirst.mockResolvedValue({
      sourceType: 'IMPROVEMENT_PLAN',
      sourceId: 'plan-99',
    });

    mockPrisma.improvementPlan.findFirst.mockResolvedValue({
      id: 'plan-99',
      objective: 'Address negative slope confusion',
      hypothesis: 'Adding interactive line manipulators clarifies slope signs',
      status: 'COMPLETED',
      sourceInsightIds: ['ins-1'],
      sourceRecommendationIds: ['rec-1'],
    });

    const prov = await service.getVersionProvenance('ko-linear', 2, 'tenant-1');
    expect(prov.version).toBe(2);
    expect(prov.parentVersion).toBe(1);
    expect(prov.improvementPlan.objective).toBe('Address negative slope confusion');
    expect(prov.reason).toContain('Adding interactive line manipulators');
  });

  it('HISTORICAL INTEGRITY & ROLLBACK: should update current pointer and log lineage without deleting versions', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'ko-linear',
      currentVersion: 2,
    });

    mockPrisma.knowledgeVersion.findFirst.mockResolvedValue({
      id: 'v1-id',
      version: 1,
    });

    mockPrisma.knowledgeObject.update.mockResolvedValue({
      id: 'ko-linear',
      currentVersion: 1,
    });

    const result = await service.rollbackKnowledgeVersion(
      'ko-linear',
      {
        executionId: 'exec-rb-1',
        strategy: 'RESTORE_VERSION',
        targetVersionId: 'v1-id',
        reason: 'Spike in confusion detected on V2',
        approvedBy: 'lead-teacher',
      },
      'tenant-1',
    );

    expect(result.restoredVersion).toBe(1);
    expect(result.status).toBe('ROLLED_BACK');
    expect(mockPrisma.knowledgeObject.update).toHaveBeenCalledWith({
      where: { id: 'ko-linear' },
      data: { currentVersion: 1, updatedBy: 'lead-teacher' },
    });
    expect(mockPrisma.learningLineage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          relation: 'CHANGED_BY',
          sourceType: 'ROLLBACK',
        }),
      }),
    );
  });
});
