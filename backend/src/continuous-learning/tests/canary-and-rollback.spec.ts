import { RolloutService } from '../rollout/rollout.service';
import { RollbackService } from '../rollout/rollback.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('CanaryRollout & Non-Destructive Rollback (LKC-16)', () => {
  let rolloutService: RolloutService;
  let rollbackService: RollbackService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      evolutionRollout: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'rollout-1', ...data, createdAt: new Date(), updatedAt: new Date() }),
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data, updatedAt: new Date() }),
        ),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    rolloutService = new RolloutService(mockPrisma as unknown as PrismaService);
    rollbackService = new RollbackService(
      mockPrisma as unknown as PrismaService,
      rolloutService,
    );
  });

  it('should advance progressive canary stages', async () => {
    mockPrisma.evolutionRollout.findUnique.mockResolvedValue({
      id: 'rollout-1',
      candidateId: 'cand-1',
      targetType: 'CURRICULUM_PATH',
      targetId: 'PATH_MATH_01',
      currentStage: 'SHADOW',
      percentage: 0.0,
      status: 'ACTIVE',
    });

    // Advance from SHADOW (0%) to CANARY_5 (5%)
    const advanced = await rolloutService.advanceRollout('rollout-1', true);
    expect(advanced.currentStage).toBe('CANARY_5');
    expect(advanced.percentage).toBe(5.0);
  });

  it('should halt rollout when guardrails are breached during canary stage', async () => {
    mockPrisma.evolutionRollout.findUnique.mockResolvedValue({
      id: 'rollout-1',
      currentStage: 'CANARY_5',
      percentage: 5.0,
      status: 'ACTIVE',
    });

    await expect(
      rolloutService.advanceRollout('rollout-1', false), // Guardrails failed
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.evolutionRollout.update).toHaveBeenCalledWith({
      where: { id: 'rollout-1' },
      data: expect.objectContaining({
        status: 'PAUSED',
        guardrailBreached: true,
      }),
    });
  });

  it('should execute non-destructive rollback preserving historical records', async () => {
    mockPrisma.evolutionRollout.findUnique.mockResolvedValue({
      id: 'rollout-1',
      candidateId: 'cand-1',
      targetType: 'CURRICULUM_PATH',
      targetId: 'PATH_MATH_01',
      currentStage: 'STAGE_15',
      percentage: 15.0,
      status: 'ACTIVE',
    });

    const rolledBack = await rollbackService.executeRollback(
      'rollout-1',
      'Learner struggle detected in 15% cohort',
    );

    expect(rolledBack.status).toBe('ROLLED_BACK');
    expect(rolledBack.percentage).toBe(0.0);
    expect(rolledBack.rollbackReason).toContain('Learner struggle');
    expect(mockPrisma.evolutionRollout.update).toHaveBeenCalledWith({
      where: { id: 'rollout-1' },
      data: expect.objectContaining({
        status: 'ROLLED_BACK',
        percentage: 0.0,
      }),
    });
  });
});
