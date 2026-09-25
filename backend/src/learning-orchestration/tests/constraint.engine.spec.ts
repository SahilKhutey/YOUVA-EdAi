import { Test, TestingModule } from '@nestjs/testing';
import { ConstraintEngine } from '../constraints/constraint.engine';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdaptiveActionType,
  AdaptiveCandidate,
  AdaptiveReasonCode,
  CandidateSource,
} from '../decision/decision.types';
import { DEFAULT_ADAPTIVE_POLICY } from '../decision/decision.policy';

describe('ConstraintEngine (LKC-7)', () => {
  let engine: ConstraintEngine;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeObject: {
        findFirst: jest.fn(),
      },
      knowledgeRelationship: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      learnerKnowledgeState: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstraintEngine,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    engine = module.get<ConstraintEngine>(ConstraintEngine);
  });

  it('should filter out unpublished or foreign tenant knowledge objects', async () => {
    // Return null simulating unpublished or wrong tenant
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue(null);

    const candidates: AdaptiveCandidate[] = [
      {
        knowledgeId: 'k-draft',
        action: AdaptiveActionType.PRACTICE,
        source: CandidateSource.CURRICULUM,
        required: false,
        priority: 50,
        reasonCodes: [AdaptiveReasonCode.CURRICULUM_SEQUENCE],
      },
    ];

    const valid = await engine.filterCandidates(
      candidates,
      'learner-1',
      DEFAULT_ADAPTIVE_POLICY,
      0,
      'tenant-1',
    );
    expect(valid.length).toBe(0);
  });

  it('should suppress optional candidates when a required assignment is active', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'k-valid',
      status: 'PUBLISHED',
    });

    const candidates: AdaptiveCandidate[] = [
      {
        knowledgeId: 'k-asg',
        action: AdaptiveActionType.PRACTICE,
        source: CandidateSource.ASSIGNMENT,
        required: true,
        priority: 90,
        reasonCodes: [AdaptiveReasonCode.ASSIGNMENT_REQUIRED],
      },
      {
        knowledgeId: 'k-opt',
        action: AdaptiveActionType.PRACTICE,
        source: CandidateSource.CURRICULUM,
        required: false,
        priority: 50,
        reasonCodes: [AdaptiveReasonCode.CURRICULUM_SEQUENCE],
      },
    ];

    const valid = await engine.filterCandidates(
      candidates,
      'learner-1',
      DEFAULT_ADAPTIVE_POLICY,
      0,
      'tenant-1',
    );
    expect(valid.length).toBe(1);
    expect(valid[0].knowledgeId).toBe('k-asg');
  });

  it('should block ADVANCE if prerequisites are unmet', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'k-target',
      status: 'PUBLISHED',
    });

    // Prerequisite exists
    mockPrisma.knowledgeRelationship.findMany.mockResolvedValue([
      { sourceId: 'k-prereq-1', source: { title: 'Prerequisite Concept' } },
    ]);

    // Student has not mastered prerequisite (mastery 0.40)
    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      masteryLevel: 0.4,
      confidence: 0.5,
      status: 'STRUGGLING',
    });

    const candidates: AdaptiveCandidate[] = [
      {
        knowledgeId: 'k-target',
        action: AdaptiveActionType.ADVANCE,
        source: CandidateSource.KNOWLEDGE_GRAPH,
        required: false,
        priority: 75,
        reasonCodes: [AdaptiveReasonCode.READY_TO_ADVANCE],
      },
    ];

    const valid = await engine.filterCandidates(
      candidates,
      'learner-1',
      DEFAULT_ADAPTIVE_POLICY,
      0,
      'tenant-1',
    );
    expect(valid.length).toBe(0);
  });

  it('should escalate to TEACHER_INTERVENTION when anti-loop threshold is reached', async () => {
    mockPrisma.knowledgeObject.findFirst.mockResolvedValue({
      id: 'k-remed',
      status: 'PUBLISHED',
    });

    const candidates: AdaptiveCandidate[] = [
      {
        knowledgeId: 'k-remed',
        action: AdaptiveActionType.REMEDIATE,
        source: CandidateSource.KNOWLEDGE_GRAPH,
        required: true,
        priority: 85,
        reasonCodes: [AdaptiveReasonCode.PREREQUISITE_NOT_READY],
      },
    ];

    // remediationDepth = 3 (matches maxRemediationDepth 3)
    const valid = await engine.filterCandidates(
      candidates,
      'learner-1',
      DEFAULT_ADAPTIVE_POLICY,
      3,
      'tenant-1',
    );

    expect(valid.length).toBe(1);
    expect(valid[0].action).toBe(AdaptiveActionType.TEACHER_INTERVENTION);
  });
});
