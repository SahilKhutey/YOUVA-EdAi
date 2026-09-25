import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LearningPathService } from '../learning-path.service';
import { GraphTraversalService } from '../graph-traversal.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LearningPathService', () => {
  let service: LearningPathService;
  let prisma: any;
  let traversalService: any;

  beforeEach(async () => {
    prisma = {
      knowledgeObject: {
        findFirst: jest.fn(),
      },
      learnerKnowledgeState: {
        findMany: jest.fn(),
      },
    };

    traversalService = {
      getPrerequisites: jest.fn(),
      getDependents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningPathService,
        { provide: PrismaService, useValue: prisma },
        { provide: GraphTraversalService, useValue: traversalService },
      ],
    }).compile();

    service = module.get<LearningPathService>(LearningPathService);
  });

  it('should throw NotFoundException if target knowledge object is not found or not published', async () => {
    prisma.knowledgeObject.findFirst.mockResolvedValue(null);

    await expect(
      service.buildPath('learner-1', 'missing-id', { tenantId: 'tenant-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should produce READY status when target has no prerequisites', async () => {
    prisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'target-1',
      title: 'Introduction to Numbers',
      type: 'CONCEPT',
      status: 'PUBLISHED',
    });

    traversalService.getPrerequisites.mockResolvedValue([]);
    traversalService.getDependents.mockResolvedValue([
      { id: 'next-1', title: 'Integers', type: 'CONCEPT' },
    ]);

    prisma.learnerKnowledgeState.findMany.mockResolvedValue([]);

    const path = await service.buildPath('learner-1', 'target-1');

    expect(path.targetKnowledgeId).toBe('target-1');
    expect(path.readiness).toBe('READY');
    expect(path.nodes).toHaveLength(2); // target + 1 dependent
    expect(path.nodes[0].role).toBe('CURRENT');
    expect(path.nodes[1].role).toBe('NEXT');
  });

  it('should produce READY when all prerequisites have mastery >= 0.70', async () => {
    prisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'algebra-1',
      title: 'Linear Equations',
      type: 'LESSON',
      status: 'PUBLISHED',
    });

    traversalService.getPrerequisites.mockResolvedValue([
      { id: 'vars-1', title: 'Variables', type: 'CONCEPT' },
    ]);
    traversalService.getDependents.mockResolvedValue([]);

    prisma.learnerKnowledgeState.findMany.mockResolvedValue([
      {
        knowledgeObjectId: 'vars-1',
        masteryLevel: 0.85,
        confidence: 0.8,
        status: 'MASTERED',
      },
    ]);

    const path = await service.buildPath('learner-1', 'algebra-1');

    expect(path.readiness).toBe('READY');
    expect(path.weakestPrerequisiteId).toBeUndefined();
    expect(path.nodes[0].role).toBe('PREREQUISITE');
    expect(path.nodes[0].mastery).toBe(0.85);
    expect(path.nodes[1].role).toBe('CURRENT');
  });

  it('should produce NOT_READY and assign REMEDIATION role when a prerequisite is struggling or < 0.40', async () => {
    prisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'algebra-1',
      title: 'Linear Equations',
      type: 'LESSON',
      status: 'PUBLISHED',
    });

    traversalService.getPrerequisites.mockResolvedValue([
      { id: 'vars-1', title: 'Variables', type: 'CONCEPT' },
      { id: 'integers-1', title: 'Integers', type: 'CONCEPT' },
    ]);
    traversalService.getDependents.mockResolvedValue([]);

    prisma.learnerKnowledgeState.findMany.mockResolvedValue([
      {
        knowledgeObjectId: 'vars-1',
        masteryLevel: 0.80,
        confidence: 0.75,
        status: 'DEVELOPING',
      },
      {
        knowledgeObjectId: 'integers-1',
        masteryLevel: 0.25,
        confidence: 0.70,
        status: 'STRUGGLING',
      },
    ]);

    const path = await service.buildPath('learner-1', 'algebra-1');

    expect(path.readiness).toBe('NOT_READY');
    expect(path.weakestPrerequisiteId).toBe('integers-1');

    const integersNode = path.nodes.find((n) => n.knowledgeId === 'integers-1');
    expect(integersNode?.role).toBe('REMEDIATION');
    expect(integersNode?.reason).toContain('Active struggle detected');
  });
});
