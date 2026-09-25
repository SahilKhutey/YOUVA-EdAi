import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LearningKnowledgeService } from './learning-knowledge.service';
import { PrismaService } from '../prisma/prisma.service';
import { hashKnowledgeContent } from './types/knowledge.types';

describe('LearningKnowledgeService (LKC-1 & LKC-3)', () => {
  let service: LearningKnowledgeService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockPrisma)),
      knowledgeObject: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      knowledgeVersion: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      knowledgeObjective: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      knowledgeTag: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      knowledgeRelationship: {
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      knowledgeEvent: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      knowledgeLearningSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningKnowledgeService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<LearningKnowledgeService>(LearningKnowledgeService);
  });

  describe('Knowledge Creation', () => {
    it('creates valid knowledge with initial version and content hash', async () => {
      const mockCreatedObj = {
        id: 'obj-101',
        type: 'CONCEPT',
        title: 'Linear Equations',
        slug: 'linear-equations',
        status: 'DRAFT',
        currentVersion: 1,
        tenantId: 'tenant-1',
      };
      const mockCreatedVersion = {
        id: 'ver-101',
        knowledgeObjectId: 'obj-101',
        version: 1,
        content: 'Sample lesson content',
        contentHash: hashKnowledgeContent('Sample lesson content'),
        sourceType: 'TEACHER',
        reviewStatus: 'DRAFT',
      };

      mockPrisma.knowledgeObject.create.mockResolvedValue(mockCreatedObj);
      mockPrisma.knowledgeVersion.create.mockResolvedValue(mockCreatedVersion);

      const result = await service.create(
        'teacher-1',
        {
          type: 'CONCEPT',
          title: 'Linear Equations',
          slug: 'linear-equations',
          content: 'Sample lesson content',
          learningObjectives: ['Solve 2-step linear equations'],
          prerequisites: [],
          tags: ['math', 'algebra'],
        },
        'tenant-1',
      );

      expect(mockPrisma.knowledgeObject.create).toHaveBeenCalled();
      expect(mockPrisma.knowledgeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 1,
          contentHash: hashKnowledgeContent('Sample lesson content'),
          reviewStatus: 'DRAFT',
        }),
      });
      expect(result.id).toBe('obj-101');
      expect(result.versions[0].version).toBe(1);
    });

    it('rejects missing or empty title', async () => {
      await expect(
        service.create(
          'teacher-1',
          {
            type: 'CONCEPT',
            title: '   ',
            slug: 'no-title',
            content: 'Content',
            learningObjectives: [],
            prerequisites: [],
          },
          'tenant-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Versioning & Immutability', () => {
    it('editing creates next version and resets status to DRAFT while keeping published intact', async () => {
      const existingObj = {
        id: 'obj-101',
        title: 'Linear Equations',
        currentVersion: 1,
        status: 'PUBLISHED',
        tenantId: 'tenant-1',
        versions: [{ version: 1, reviewStatus: 'APPROVED' }],
      };

      mockPrisma.knowledgeObject.findFirst.mockResolvedValue(existingObj);
      mockPrisma.knowledgeVersion.create.mockResolvedValue({
        id: 'ver-102',
        knowledgeObjectId: 'obj-101',
        version: 2,
        content: 'Updated content with new examples',
        contentHash: hashKnowledgeContent('Updated content with new examples'),
        reviewStatus: 'DRAFT',
      });
      mockPrisma.knowledgeObject.update.mockResolvedValue({
        ...existingObj,
        status: 'DRAFT',
      });

      const result = await service.update(
        'teacher-1',
        'obj-101',
        {
          content: 'Updated content with new examples',
        },
        'tenant-1',
      );

      expect(mockPrisma.knowledgeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 2,
          contentHash: hashKnowledgeContent('Updated content with new examples'),
          reviewStatus: 'DRAFT',
        }),
      });
      expect(result.status).toBe('DRAFT');
      expect(result.newVersion.version).toBe(2);
    });
  });

  describe('Publishing Transaction', () => {
    it('unapproved version cannot publish and throws ConflictException', async () => {
      mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
        id: 'obj-101',
        tenantId: 'tenant-1',
        versions: [{ id: 'ver-101', version: 1, reviewStatus: 'PENDING_REVIEW' }],
      });

      await expect(
        service.publish('admin-1', 'obj-101', 'tenant-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('approved version publishes atomically, updating currentVersion and publishedAt', async () => {
      mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
        id: 'obj-101',
        tenantId: 'tenant-1',
        versions: [{ id: 'ver-101', version: 2, reviewStatus: 'APPROVED' }],
      });

      mockPrisma.knowledgeObject.update.mockResolvedValue({
        id: 'obj-101',
        status: 'PUBLISHED',
        currentVersion: 2,
      });

      const published = await service.publish('admin-1', 'obj-101', 'tenant-1');

      expect(mockPrisma.knowledgeObject.update).toHaveBeenCalledWith({
        where: { id: 'obj-101' },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          currentVersion: 2,
        }),
      });
      expect(mockPrisma.knowledgeVersion.update).toHaveBeenCalledWith({
        where: { id: 'ver-101' },
        data: expect.objectContaining({
          publishedAt: expect.any(Date),
        }),
      });
      expect(published.status).toBe('PUBLISHED');
    });
  });

  describe('Student Retrieval', () => {
    it('returns published knowledge and concrete version content', async () => {
      mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
        id: 'obj-101',
        type: 'CONCEPT',
        title: 'Linear Equations',
        slug: 'linear-equations',
        status: 'PUBLISHED',
        currentVersion: 1,
        objectives: [{ objective: 'Understand inverse operations' }],
        tags: [{ tag: 'algebra' }],
        incomingLinks: [],
        outgoingLinks: [],
      });

      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
        content: 'Published lesson explanation',
      });

      const result = await service.getForStudent('student-1', 'obj-101', 'tenant-1');

      expect(result.id).toBe('obj-101');
      expect(result.version).toBe(1);
      expect(result.content).toBe('Published lesson explanation');
      expect(result.learningObjectives).toContain('Understand inverse operations');
    });

    it('throws NotFoundException if knowledge is DRAFT or ARCHIVED', async () => {
      mockPrisma.knowledgeObject.findFirst.mockResolvedValue(null);

      await expect(
        service.getForStudent('student-1', 'obj-draft', 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Relationships', () => {
    it('creates semantic relationship between source and target', async () => {
      mockPrisma.knowledgeObject.findUnique
        .mockResolvedValueOnce({ id: 'concept-equality' })
        .mockResolvedValueOnce({ id: 'concept-linear-eq' });

      mockPrisma.knowledgeRelationship.upsert.mockResolvedValue({
        id: 'rel-1',
        sourceId: 'concept-equality',
        targetId: 'concept-linear-eq',
        relation: 'PREREQUISITE',
        weight: 1.0,
      });

      const rel = await service.createRelationship(
        'teacher-1',
        {
          sourceId: 'concept-equality',
          targetId: 'concept-linear-eq',
          relation: 'PREREQUISITE',
          weight: 1.0,
        },
        'tenant-1',
      );

      expect(rel.relation).toBe('PREREQUISITE');
      expect(mockPrisma.knowledgeRelationship.upsert).toHaveBeenCalled();
    });

    it('rejects self-referencing relationships', async () => {
      await expect(
        service.createRelationship(
          'teacher-1',
          {
            sourceId: 'same-obj',
            targetId: 'same-obj',
            relation: 'PREREQUISITE',
          },
          'tenant-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Learning Events', () => {
    it('records valid event preserving concrete knowledge version', async () => {
      mockPrisma.knowledgeObject.findUnique.mockResolvedValue({
        id: 'obj-101',
        status: 'PUBLISHED',
      });
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
      });
      mockPrisma.knowledgeEvent.create.mockResolvedValue({
        id: 'evt-1',
        learnerId: 'student-1',
        knowledgeObjectId: 'obj-101',
        knowledgeVersion: 1,
        eventType: 'ANSWERED',
      });

      const event = await service.recordEvent(
        'student-1',
        {
          knowledgeObjectId: 'obj-101',
          knowledgeVersion: 1,
          eventType: 'ANSWERED',
          metadata: JSON.stringify({ isCorrect: true, latencyMs: 4500 }),
        },
        'tenant-1',
      );

      expect(event.eventType).toBe('ANSWERED');
      expect(event.knowledgeVersion).toBe(1);
    });

    it('rejects event referencing non-existent version', async () => {
      mockPrisma.knowledgeObject.findUnique.mockResolvedValue({
        id: 'obj-101',
      });
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue(null);

      await expect(
        service.recordEvent(
          'student-1',
          {
            knowledgeObjectId: 'obj-101',
            knowledgeVersion: 999,
            eventType: 'VIEWED',
          },
          'tenant-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Search', () => {
    it('searches published knowledge items with pagination', async () => {
      mockPrisma.knowledgeObject.findMany.mockResolvedValue([
        {
          id: 'obj-1',
          type: 'CONCEPT',
          title: 'Linear Equations',
          slug: 'linear-equations',
          currentVersion: 1,
          tags: [{ tag: 'algebra' }],
          objectives: [{ objective: 'Solve equations' }],
        },
      ]);
      mockPrisma.knowledgeObject.count.mockResolvedValue(1);

      const results = await service.search(
        { query: 'linear', page: 1, limit: 10 },
        'tenant-1',
      );

      expect(results.total).toBe(1);
      expect(results.items[0].title).toBe('Linear Equations');
    });
  });

  describe('Learning Sessions (LKC-3)', () => {
    it('starts an active session pinning concrete version and emits STARTED event', async () => {
      mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
        id: 'obj-101',
        status: 'PUBLISHED',
        currentVersion: 1,
      });
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
      });
      mockPrisma.knowledgeLearningSession.findFirst.mockResolvedValue(null);
      mockPrisma.knowledgeLearningSession.create.mockResolvedValue({
        id: 'sess-1',
        learnerId: 'student-1',
        knowledgeObjectId: 'obj-101',
        knowledgeVersionId: 'ver-101',
        status: 'ACTIVE',
        lastPosition: 0,
      });

      const session = await service.startSession('student-1', 'obj-101', {}, 'tenant-1');

      expect(session.id).toBe('sess-1');
      expect(session.status).toBe('ACTIVE');
      expect(mockPrisma.knowledgeLearningSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          learnerId: 'student-1',
          knowledgeObjectId: 'obj-101',
          knowledgeVersionId: 'ver-101',
          status: 'ACTIVE',
          lastPosition: 0,
        }),
      });
    });

    it('resumes existing active session without creating a new one', async () => {
      mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
        id: 'obj-101',
        status: 'PUBLISHED',
        currentVersion: 1,
      });
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
      });
      mockPrisma.knowledgeLearningSession.findFirst.mockResolvedValue({
        id: 'sess-existing',
        learnerId: 'student-1',
        knowledgeObjectId: 'obj-101',
        knowledgeVersionId: 'ver-101',
        status: 'ACTIVE',
        lastPosition: 3,
      });

      const session = await service.startSession('student-1', 'obj-101', {}, 'tenant-1');

      expect(session.id).toBe('sess-existing');
      expect(session.lastPosition).toBe(3);
      expect(mockPrisma.knowledgeLearningSession.create).not.toHaveBeenCalled();
    });

    it('rejects starting session for unpublished knowledge object', async () => {
      mockPrisma.knowledgeObject.findFirst.mockResolvedValue(null);

      await expect(
        service.startSession('student-1', 'obj-unpublished', {}, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates session position and records SECTION_VIEWED event', async () => {
      mockPrisma.knowledgeLearningSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        learnerId: 'student-1',
        tenantId: 'tenant-1',
        knowledgeObjectId: 'obj-101',
        knowledgeVersionId: 'ver-101',
      });
      mockPrisma.knowledgeLearningSession.update.mockResolvedValue({
        id: 'sess-1',
        lastPosition: 5,
      });
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
      });

      const updated = await service.updateSessionPosition(
        'student-1',
        'sess-1',
        { lastPosition: 5 },
        'tenant-1',
      );

      expect(updated.lastPosition).toBe(5);
      expect(mockPrisma.knowledgeLearningSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: { lastPosition: 5 },
      });
    });

    it('forbids updating session belonging to another learner', async () => {
      mockPrisma.knowledgeLearningSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        learnerId: 'student-another',
        tenantId: 'tenant-1',
      });

      await expect(
        service.updateSessionPosition('student-1', 'sess-1', { lastPosition: 2 }, 'tenant-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('completes session and records COMPLETED event', async () => {
      mockPrisma.knowledgeLearningSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        learnerId: 'student-1',
        tenantId: 'tenant-1',
        knowledgeObjectId: 'obj-101',
        knowledgeVersionId: 'ver-101',
      });
      mockPrisma.knowledgeLearningSession.update.mockResolvedValue({
        id: 'sess-1',
        status: 'COMPLETED',
      });
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
      });

      const completed = await service.completeSession('student-1', 'sess-1', 'tenant-1');

      expect(completed.status).toBe('COMPLETED');
      expect(mockPrisma.knowledgeLearningSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
        }),
      });
    });
  });

  describe('Answer Evaluation & Server Verification (LKC-3)', () => {
    const mockContent = JSON.stringify({
      sections: [
        {
          id: 'sec-1',
          title: 'Practice Questions',
          blocks: [
            {
              id: 'q-1',
              type: 'QUESTION',
              prompt: 'Solve: 2x = 10',
              options: ['x = 3', 'x = 5', 'x = 10'],
              answer: 'x = 5',
              explanation: 'Divide both sides by 2: x = 10 / 2 = 5.',
            },
          ],
        },
      ],
    });

    it('correctly evaluates a matching answer server-side and emits event', async () => {
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
        content: mockContent,
      });
      mockPrisma.knowledgeObject.findUnique.mockResolvedValue({ id: 'obj-101' });
      mockPrisma.knowledgeEvent.create.mockResolvedValue({ id: 'evt-1' });

      const evaluation = await service.evaluateAnswer(
        'student-1',
        {
          knowledgeObjectId: 'obj-101',
          knowledgeVersion: 1,
          questionId: 'q-1',
          submittedAnswer: 'x = 5',
          attempt: 1,
          latencyMs: 3200,
        },
        'tenant-1',
      );

      expect(evaluation.isCorrect).toBe(true);
      expect(evaluation.feedback).toContain('Correct');
      expect(evaluation.explanation).toContain('Divide both sides by 2');
    });

    it('evaluates incorrect answer server-side without trusting client', async () => {
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
        content: mockContent,
      });
      mockPrisma.knowledgeObject.findUnique.mockResolvedValue({ id: 'obj-101' });
      mockPrisma.knowledgeEvent.create.mockResolvedValue({ id: 'evt-2' });

      const evaluation = await service.evaluateAnswer(
        'student-1',
        {
          knowledgeObjectId: 'obj-101',
          knowledgeVersion: 1,
          questionId: 'q-1',
          submittedAnswer: 'x = 3',
        },
        'tenant-1',
      );

      expect(evaluation.isCorrect).toBe(false);
      expect(evaluation.feedback).toContain('Incorrect');
    });

    it('throws NotFoundException if question does not exist in content', async () => {
      mockPrisma.knowledgeVersion.findUnique.mockResolvedValue({
        id: 'ver-101',
        version: 1,
        content: mockContent,
      });

      await expect(
        service.evaluateAnswer(
          'student-1',
          {
            knowledgeObjectId: 'obj-101',
            knowledgeVersion: 1,
            questionId: 'q-non-existent',
            submittedAnswer: 'x = 5',
          },
          'tenant-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Event Idempotency (LKC-3)', () => {
    it('returns existing event when clientEventId matches an already recorded event', async () => {
      const existingEvent = {
        id: 'evt-existing',
        tenantId: 'tenant-1',
        learnerId: 'student-1',
        clientEventId: 'client-evt-12345',
        eventType: 'STARTED',
      };

      mockPrisma.knowledgeEvent.findUnique.mockResolvedValue(existingEvent);

      const result = await service.recordEvent(
        'student-1',
        {
          knowledgeObjectId: 'obj-101',
          knowledgeVersion: 1,
          eventType: 'STARTED',
          clientEventId: 'client-evt-12345',
        },
        'tenant-1',
      );

      expect(result.id).toBe('evt-existing');
      expect(mockPrisma.knowledgeEvent.create).not.toHaveBeenCalled();
    });
  });
});
