import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EvidenceProcessorService } from './evidence-processor.service';
import { PrismaService } from '../prisma/prisma.service';
import { MasteryEvaluatorService } from '../mastery/mastery-evaluator.service';
import { LearnerKnowledgeStateService } from '../learner-state/learner-knowledge-state.service';

describe('EvidenceProcessorService (LKC-4)', () => {
  let service: EvidenceProcessorService;
  let mockPrisma: any;
  let mockMasteryEvaluator: any;
  let mockLearnerStateService: any;

  beforeEach(async () => {
    mockPrisma = {
      knowledgeEvent: {
        findUnique: jest.fn(),
      },
      learningEvidenceLog: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockMasteryEvaluator = {
      evaluate: jest.fn().mockReturnValue({
        masteryLevel: 0.85,
        confidence: 0.75,
        status: 'MASTERED',
        struggleScore: 0.0,
        isStruggling: false,
        nextReviewAt: new Date(),
      }),
    };

    mockLearnerStateService = {
      getState: jest.fn().mockResolvedValue(null),
      updateState: jest.fn().mockResolvedValue({
        masteryLevel: 0.85,
        confidence: 0.75,
        status: 'MASTERED',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceProcessorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MasteryEvaluatorService, useValue: mockMasteryEvaluator },
        { provide: LearnerKnowledgeStateService, useValue: mockLearnerStateService },
      ],
    }).compile();

    service = module.get<EvidenceProcessorService>(EvidenceProcessorService);
  });

  it('processes valid ANSWERED event into LearningEvidenceLog and updates LearnerKnowledgeState', async () => {
    mockPrisma.knowledgeEvent.findUnique.mockResolvedValue({
      id: 'evt-101',
      tenantId: 'tenant-1',
      learnerId: 'student-1',
      knowledgeObjectId: 'ko-1',
      knowledgeVersion: 1,
      eventType: 'ANSWERED',
      metadata: JSON.stringify({ isCorrect: true, attempt: 1, latencyMs: 2500 }),
      occurredAt: new Date(),
      knowledgeObject: { id: 'ko-1', title: 'Linear Equations' },
    });

    mockPrisma.learningEvidenceLog.findUnique.mockResolvedValue(null);
    mockPrisma.learningEvidenceLog.create.mockResolvedValue({
      id: 'ev-log-1',
      userId: 'student-1',
      knowledgeObjectId: 'ko-1',
      accuracy: 1.0,
    });

    const result = await service.processEvent('evt-101');

    expect(result.isIdempotentReplay).toBe(false);
    expect(result.evidenceLogId).toBe('ev-log-1');
    expect(result.masteryLevel).toBe(0.85);
    expect(result.status).toBe('MASTERED');
    expect(mockPrisma.learningEvidenceLog.create).toHaveBeenCalled();
    expect(mockLearnerStateService.updateState).toHaveBeenCalled();
  });

  it('handles duplicate sourceEventId idempotently without re-creating logs or updating state', async () => {
    mockPrisma.knowledgeEvent.findUnique.mockResolvedValue({
      id: 'evt-101',
      tenantId: 'tenant-1',
      learnerId: 'student-1',
      knowledgeObjectId: 'ko-1',
      knowledgeVersion: 1,
    });

    mockPrisma.learningEvidenceLog.findUnique.mockResolvedValue({
      id: 'ev-log-existing',
      sourceEventId: 'evt-101',
    });

    mockLearnerStateService.getState.mockResolvedValue({
      masteryLevel: 0.85,
      confidence: 0.75,
      status: 'MASTERED',
    });

    const result = await service.processEvent('evt-101');

    expect(result.isIdempotentReplay).toBe(true);
    expect(result.evidenceLogId).toBe('ev-log-existing');
    expect(mockPrisma.learningEvidenceLog.create).not.toHaveBeenCalled();
    expect(mockLearnerStateService.updateState).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when processing non-existent event', async () => {
    mockPrisma.knowledgeEvent.findUnique.mockResolvedValue(null);

    await expect(service.processEvent('evt-unknown')).rejects.toThrow(NotFoundException);
  });
});
