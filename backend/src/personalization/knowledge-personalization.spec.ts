import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KnowledgePersonalizationService } from './knowledge-personalization.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KnowledgePersonalizationService (LKC-4)', () => {
  let service: KnowledgePersonalizationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      learnerKnowledgeState: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      personalizationDecision: {
        create: jest.fn().mockImplementation((args) => ({
          id: 'dec-101',
          createdAt: new Date(),
          ...args.data,
        })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgePersonalizationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KnowledgePersonalizationService>(
      KnowledgePersonalizationService,
    );
  });

  it('recommends REMEDIATE on weak prerequisite when learner has not mastered foundational topic', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'ko-linear-equations',
      title: 'Linear Equations',
      type: 'CONCEPT',
      status: 'PUBLISHED',
      incomingLinks: [
        {
          relation: 'PREREQUISITE',
          source: {
            id: 'ko-integer-operations',
            title: 'Integer Operations',
            type: 'CONCEPT',
            status: 'PUBLISHED',
          },
        },
      ],
      outgoingLinks: [],
    });

    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      knowledgeObjectId: 'ko-linear-equations',
      status: 'STRUGGLING',
      masteryLevel: 0.35,
    });

    mockPrisma.learnerKnowledgeState.findMany.mockResolvedValue([
      {
        knowledgeObjectId: 'ko-integer-operations',
        masteryLevel: 0.45, // Weak prerequisite (< 0.70)
        status: 'DEVELOPING',
      },
    ]);

    const decision = await service.getNextRecommendation(
      'tenant-1',
      'student-1',
      'ko-linear-equations',
    );

    expect(decision.decisionType).toBe('REMEDIATE');
    expect(decision.targetKnowledge.id).toBe('ko-integer-operations');
    expect(decision.reason.code).toBe('PREREQUISITE_WEAK');
    expect(decision.reason.message).toContain('Integer Operations');
    expect(mockPrisma.personalizationDecision.create).toHaveBeenCalled();
  });

  it('recommends REVIEW when knowledge object is flagged as NEEDS_REVIEW', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'ko-fractions',
      title: 'Fractions',
      type: 'CONCEPT',
      status: 'PUBLISHED',
      incomingLinks: [],
      outgoingLinks: [],
    });

    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      knowledgeObjectId: 'ko-fractions',
      status: 'NEEDS_REVIEW',
      masteryLevel: 0.75,
    });

    const decision = await service.getNextRecommendation(
      'tenant-1',
      'student-1',
      'ko-fractions',
    );

    expect(decision.decisionType).toBe('REVIEW');
    expect(decision.targetKnowledge.id).toBe('ko-fractions');
    expect(decision.reason.code).toBe('REVIEW_DUE');
  });

  it('recommends ADVANCE to next concept when current concept is MASTERED', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'ko-algebra-1',
      title: 'Algebra 1 Basics',
      type: 'CONCEPT',
      status: 'PUBLISHED',
      incomingLinks: [],
      outgoingLinks: [
        {
          relation: 'BUILDS_ON',
          target: {
            id: 'ko-algebra-2',
            title: 'Algebra 2 Advanced',
            type: 'CONCEPT',
            status: 'PUBLISHED',
          },
        },
      ],
    });

    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      knowledgeObjectId: 'ko-algebra-1',
      status: 'MASTERED',
      masteryLevel: 0.92,
    });

    const decision = await service.getNextRecommendation(
      'tenant-1',
      'student-1',
      'ko-algebra-1',
    );

    expect(decision.decisionType).toBe('ADVANCE');
    expect(decision.targetKnowledge.id).toBe('ko-algebra-2');
    expect(decision.reason.code).toBe('MASTERED_ADVANCE');
  });

  it('recommends EXTEND when current concept is MASTERED and has EXTENDS_TO relation', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'ko-geometry-1',
      title: 'Euclidean Geometry',
      type: 'CONCEPT',
      status: 'PUBLISHED',
      incomingLinks: [],
      outgoingLinks: [
        {
          relation: 'EXTENDS_TO',
          target: {
            id: 'ko-non-euclidean',
            title: 'Non-Euclidean Space Challenge',
            type: 'EXTENSION',
            status: 'PUBLISHED',
          },
        },
      ],
    });

    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      knowledgeObjectId: 'ko-geometry-1',
      status: 'MASTERED',
      masteryLevel: 0.95,
    });

    const decision = await service.getNextRecommendation(
      'tenant-1',
      'student-1',
      'ko-geometry-1',
    );

    expect(decision.decisionType).toBe('EXTEND');
    expect(decision.targetKnowledge.id).toBe('ko-non-euclidean');
    expect(decision.reason.code).toBe('EXTENSION_CHALLENGE');
  });

  it('strictly rejects unpublished candidates from being recommended', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'ko-concept-a',
      title: 'Concept A',
      status: 'PUBLISHED',
      incomingLinks: [],
      outgoingLinks: [
        {
          relation: 'BUILDS_ON',
          target: {
            id: 'ko-concept-b',
            title: 'Concept B (Draft)',
            status: 'DRAFT', // Unpublished! Must NOT be recommended
          },
        },
      ],
    });

    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      knowledgeObjectId: 'ko-concept-a',
      status: 'MASTERED',
      masteryLevel: 0.90,
    });

    const decision = await service.getNextRecommendation(
      'tenant-1',
      'student-1',
      'ko-concept-a',
    );

    // Fallback since the outgoing candidate was DRAFT
    expect(decision.targetKnowledge.id).toBe('ko-concept-a');
    expect(decision.decisionType).toBe('CONTINUE');
  });
});
