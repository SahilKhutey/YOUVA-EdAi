import { Test, TestingModule } from '@nestjs/testing';
import { RemediationService } from '../remediation/remediation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdaptiveActionType, AdaptiveReasonCode } from '../decision/decision.types';

describe('RemediationService (LKC-7)', () => {
  let service: RemediationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      learnerKnowledgeState: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemediationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RemediationService>(RemediationService);
  });

  it('should allow return to target when prerequisite mastery and confidence are restored', async () => {
    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      masteryLevel: 0.8,
      confidence: 0.75,
      status: 'PROFICIENT',
    });

    const result = await service.checkReturnToTarget(
      'learner-1',
      'k-prereq',
      'k-target',
      'tenant-1',
    );

    expect(result.canReturn).toBe(true);
    expect(result.nextAction).toBe(AdaptiveActionType.PRACTICE);
    expect(result.reasonCode).toBe(AdaptiveReasonCode.READY_TO_ADVANCE);
  });

  it('should keep learner in remediation when prerequisite mastery is still insufficient', async () => {
    mockPrisma.learnerKnowledgeState.findUnique.mockResolvedValue({
      masteryLevel: 0.5,
      confidence: 0.6,
      status: 'PRACTICING',
    });

    const result = await service.checkReturnToTarget(
      'learner-1',
      'k-prereq',
      'k-target',
      'tenant-1',
    );

    expect(result.canReturn).toBe(false);
    expect(result.reasonCode).toBe(AdaptiveReasonCode.PREREQUISITE_NOT_READY);
  });
});
