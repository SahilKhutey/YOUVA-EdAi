import { Test, TestingModule } from '@nestjs/testing';
import { OrchestrationService } from '../orchestration.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CandidateService } from '../candidate/candidate.service';
import { ConstraintEngine } from '../constraints/constraint.engine';
import { DecisionEngine } from '../decision/decision.engine';
import { RemediationService } from '../remediation/remediation.service';
import { AdaptiveSessionService } from '../session/adaptive-session.service';
import { InterventionService } from '../intervention/intervention.service';
import {
  AdaptiveActionType,
  AdaptiveReasonCode,
  CandidateSource,
} from '../decision/decision.types';

describe('OrchestrationService (LKC-7)', () => {
  let service: OrchestrationService;
  let mockPrisma: any;
  let mockCandidateService: any;
  let mockConstraintEngine: any;
  let mockDecisionEngine: any;
  let mockRemediationService: any;
  let mockSessionService: any;
  let mockInterventionService: any;

  beforeEach(async () => {
    mockPrisma = {
      adaptiveDecision: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'dec-saved-1',
          ...data,
          createdAt: new Date(),
        })),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      knowledgeObject: {
        findUnique: jest.fn().mockResolvedValue({ id: 'k-1', title: 'Target Concept' }),
      },
      teacherAdaptiveOverride: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'ov-1', ...data })),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      learnerKnowledgeState: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockSessionService = {
      getOrCreateSession: jest.fn().mockResolvedValue({
        sessionId: 'sess-1',
        learnerId: 'learner-1',
        tenantId: 'tenant-1',
        currentKnowledgeId: 'k-1',
        interventionLevel: 0,
        remediationDepth: 0,
        actionsTaken: [],
      }),
      updateSession: jest.fn().mockResolvedValue({}),
    };

    mockCandidateService = {
      generateCandidates: jest.fn().mockResolvedValue([
        {
          knowledgeId: 'k-1',
          action: AdaptiveActionType.PRACTICE,
          source: CandidateSource.CURRICULUM,
          required: false,
          priority: 60,
          reasonCodes: [AdaptiveReasonCode.CURRICULUM_SEQUENCE],
        },
      ]),
    };

    mockConstraintEngine = {
      filterCandidates: jest.fn().mockImplementation((cands) => Promise.resolve(cands)),
    };

    mockDecisionEngine = {
      decide: jest.fn().mockReturnValue({
        id: 'act-1',
        learnerId: 'learner-1',
        tenantId: 'tenant-1',
        targetKnowledgeId: 'k-1',
        action: AdaptiveActionType.PRACTICE,
        reasonCode: AdaptiveReasonCode.CURRICULUM_SEQUENCE,
        reasonMessage: 'Continue standard practice.',
        priority: 60,
        confidence: 0.85,
        required: false,
        decisionId: 'dec-1',
        policyVersion: 'adaptive-policy-v1',
        createdAt: new Date(),
      }),
    };

    mockRemediationService = {
      checkReturnToTarget: jest.fn().mockResolvedValue({
        canReturn: false,
        nextAction: AdaptiveActionType.PRACTICE,
        reasonCode: AdaptiveReasonCode.PREREQUISITE_NOT_READY,
        reasonMessage: 'Continue practicing prerequisite.',
      }),
    };

    mockInterventionService = {
      determineLevel: jest.fn().mockReturnValue(0),
      mapLevelToAction: jest.fn().mockReturnValue(AdaptiveActionType.CONTINUE),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestrationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CandidateService, useValue: mockCandidateService },
        { provide: ConstraintEngine, useValue: mockConstraintEngine },
        { provide: DecisionEngine, useValue: mockDecisionEngine },
        { provide: RemediationService, useValue: mockRemediationService },
        { provide: AdaptiveSessionService, useValue: mockSessionService },
        { provide: InterventionService, useValue: mockInterventionService },
      ],
    }).compile();

    service = module.get<OrchestrationService>(OrchestrationService);
  });

  it('getNextAction: should execute full loop and persist decision', async () => {
    const action = await service.getNextAction('learner-1', 'k-1', 'tenant-1');

    expect(action).toBeDefined();
    expect(action.action).toBe(AdaptiveActionType.PRACTICE);
    expect(action.targetKnowledgeId).toBe('k-1');
    expect(mockCandidateService.generateCandidates).toHaveBeenCalled();
    expect(mockConstraintEngine.filterCandidates).toHaveBeenCalled();
    expect(mockDecisionEngine.decide).toHaveBeenCalled();
    expect(mockPrisma.adaptiveDecision.create).toHaveBeenCalled();
    expect(mockSessionService.updateSession).toHaveBeenCalled();
  });

  it('completeAction: marks decision as EXECUTED', async () => {
    const res = await service.completeAction('dec-saved-1', 'learner-1', 'tenant-1');
    expect(res.status).toBe('EXECUTED');
    expect(mockPrisma.adaptiveDecision.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'EXECUTED' }),
      }),
    );
  });

  it('recordTeacherOverride: creates override record and recalculates action', async () => {
    const override = await service.recordTeacherOverride(
      'teacher-1',
      'learner-1',
      { action: 'FORCE_ADVANCE', targetKnowledgeId: 'k-next' },
      'tenant-1',
    );

    expect(override.action).toBe('FORCE_ADVANCE');
    expect(mockPrisma.teacherAdaptiveOverride.create).toHaveBeenCalled();
    expect(mockPrisma.adaptiveDecision.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUPERSEDED' }),
      }),
    );
  });
});
