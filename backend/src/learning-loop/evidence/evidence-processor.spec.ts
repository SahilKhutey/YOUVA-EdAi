import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceProcessorService } from './evidence-processor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BktService } from '../../learning-engine/services/bkt.service';
import { RlDifficultyService } from '../../learning-engine/services/rl-difficulty.service';
import { LearningLoopAuditService } from '../audit/learning-loop-audit.service';
import { LearningEvidenceInput } from '../domain/types';

describe('EvidenceProcessorService', () => {
  let service: EvidenceProcessorService;
  let prisma: any;
  let bktService: any;
  let rlDifficultyService: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      learningEvidenceLog: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userTopicMastery: {
        findUnique: jest.fn(),
      },
    };

    bktService = {
      updateMastery: jest.fn().mockResolvedValue(0.68),
    };

    rlDifficultyService = {
      getOptimalDifficulty: jest.fn().mockResolvedValue(0.5),
      updateDifficultyState: jest.fn().mockResolvedValue(0.55),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceProcessorService,
        { provide: PrismaService, useValue: prisma },
        { provide: BktService, useValue: bktService },
        { provide: RlDifficultyService, useValue: rlDifficultyService },
        { provide: LearningLoopAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EvidenceProcessorService>(EvidenceProcessorService);
  });

  const sampleInput: LearningEvidenceInput = {
    idempotencyKey: 'tx-unique-12345',
    userId: 'student-1',
    topicId: 'topic-algebra-01',
    answer: 'x = 4',
    accuracy: 1.0,
    attemptNumber: 1,
    hintCount: 0,
    engagementScore: 0.95,
  };

  describe('Idempotency Guarantee', () => {
    it('should return existing processed result if idempotencyKey is already recorded', async () => {
      // Simulate existing evidence record
      prisma.learningEvidenceLog.findUnique.mockResolvedValue({
        id: 'existing-evidence-id',
        idempotencyKey: 'tx-unique-12345',
        userId: 'student-1',
        topicId: 'topic-algebra-01',
        accuracy: 1.0,
      });

      prisma.userTopicMastery.findUnique.mockResolvedValue({
        masteryProbability: 0.68,
        difficultyState: 0.55,
      });

      const result = await service.processEvidence(sampleInput);

      expect(result.isIdempotentReplay).toBe(true);
      expect(result.evidenceId).toBe('existing-evidence-id');
      // BKT and RL services should NOT have been invoked again
      expect(bktService.updateMastery).not.toHaveBeenCalled();
      expect(rlDifficultyService.updateDifficultyState).not.toHaveBeenCalled();
      expect(prisma.learningEvidenceLog.create).not.toHaveBeenCalled();
    });
  });

  describe('Fresh Evidence Processing', () => {
    it('should deterministically update BKT and RL and log audit trail', async () => {
      prisma.learningEvidenceLog.findUnique.mockResolvedValue(null);
      prisma.learningEvidenceLog.create.mockResolvedValue({
        id: 'new-evidence-id',
        ...sampleInput,
      });

      const result = await service.processEvidence(sampleInput);

      expect(result.isIdempotentReplay).toBe(false);
      expect(result.masteryProbability).toBe(0.68);
      expect(result.targetDifficulty).toBe(0.55);
      expect(bktService.updateMastery).toHaveBeenCalledWith('student-1', 'topic-algebra-01', true);
      expect(rlDifficultyService.updateDifficultyState).toHaveBeenCalledWith(
        'student-1',
        'topic-algebra-01',
        true,
        0.5,
      );
      expect(prisma.learningEvidenceLog.create).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalled();
    });
  });
});
