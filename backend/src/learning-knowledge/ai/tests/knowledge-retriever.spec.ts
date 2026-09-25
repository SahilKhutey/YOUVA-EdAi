import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KnowledgeRetrieverService } from '../retrieval/knowledge-retriever.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { GraphTraversalService } from '../../../knowledge-graph/graph-traversal.service';
import { Role } from '../../../auth/role.enum';

describe('KnowledgeRetrieverService (LKC-6)', () => {
  let service: KnowledgeRetrieverService;
  let mockPrisma: any;
  let mockGraphTraversal: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findFirst: jest.fn(),
      },
      knowledgeVersion: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      learnerKnowledgeState: {
        findUnique: jest.fn(),
      },
    };

    mockGraphTraversal = {
      getPrerequisites: jest.fn().mockResolvedValue([]),
      getRelated: jest.fn().mockResolvedValue({ outgoing: [], incoming: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeRetrieverService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GraphTraversalService, useValue: mockGraphTraversal },
      ],
    }).compile();

    service = module.get<KnowledgeRetrieverService>(KnowledgeRetrieverService);
  });

  it('should throw NotFoundException if knowledge object does not exist', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue(null);

    await expect(
      service.retrieveContext('non-existent', 'user-1', Role.STUDENT, 'tenant-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should enforce status: PUBLISHED when accessed by a STUDENT', async () => {
    mockPrisma.knowledgeObject.findFirst.mockImplementation(async (query: any) => {
      // In student queries, where.status must be 'PUBLISHED'
      if (query.where.status === 'PUBLISHED') {
        return {
          id: 'k-1',
          title: 'Published Lesson',
          type: 'LESSON',
          status: 'PUBLISHED',
          versions: [{ id: 'v-1', content: 'Lesson content here' }],
        };
      }
      return null;
    });

    const context = await service.retrieveContext('k-1', 'student-1', Role.STUDENT, 'tenant-1');
    expect(context.targetKnowledge.id).toBe('k-1');
    expect(context.targetKnowledge.title).toBe('Published Lesson');
  });

  it('should allow TEACHER to retrieve DRAFT knowledge object', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'k-draft',
      title: 'Draft Lesson',
      type: 'LESSON',
      status: 'DRAFT',
      versions: [{ id: 'v-draft', content: 'Draft content in progress' }],
    });

    const context = await service.retrieveContext('k-draft', 'teacher-1', Role.TEACHER, 'tenant-1');
    expect(context.targetKnowledge.id).toBe('k-draft');
    expect(context.targetKnowledge.status).toBe('DRAFT');
  });

  it('should load prerequisites and learner state for student', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'k-target',
      title: 'Advanced Derivatives',
      type: 'LESSON',
      status: 'PUBLISHED',
      versions: [{ id: 'v-target', content: 'Derivative rules and chain rule' }],
    });

    mockGraphTraversal.getPrerequisites.mockResolvedValue([
      { id: 'k-prereq-1', title: 'Limits and Continuity' },
    ]);

    mockPrisma.knowledgeVersion.findMany.mockResolvedValue([
      {
        id: 'v-prereq-1',
        knowledgeObjectId: 'k-prereq-1',
        content: 'Limits introduction',
        knowledgeObject: {
          title: 'Limits and Continuity',
          type: 'LESSON',
          status: 'PUBLISHED',
        },
      },
    ]);

    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      masteryLevel: 0.75,
      confidence: 0.8,
      status: 'PRACTICING',
    });

    const context = await service.retrieveContext('k-target', 'student-1', Role.STUDENT, 'tenant-1');
    expect(context.prerequisites?.length).toBe(1);
    expect(context.prerequisites?.[0].title).toBe('Limits and Continuity');
    expect(context.learnerState).toBeDefined();
    expect(context.learnerState?.masteryLevel).toBe(0.75);
  });
});
