import { ExperimentService } from '../experiments/experiment.service';
import { ExperimentGuardrailsPolicy } from '../policies/experiment-guardrails.policy';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('ExperimentGuardrailsPolicy & ExperimentService (LKC-16)', () => {
  let service: ExperimentService;
  let guardrailsPolicy: ExperimentGuardrailsPolicy;
  let mockPrisma: any;

  beforeEach(() => {
    guardrailsPolicy = new ExperimentGuardrailsPolicy();
    mockPrisma = {
      evolutionExperiment: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'exp-101', ...data, createdAt: new Date(), updatedAt: new Date() }),
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, ...data, updatedAt: new Date() }),
        ),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new ExperimentService(mockPrisma as unknown as PrismaService, guardrailsPolicy);
  });

  it('should reject experiment creation without hypothesis or guardrails', async () => {
    await expect(
      service.createExperiment({
        hypothesis: '',
        baselineDefinition: {},
        treatmentDefinition: {},
        populationDefinition: {},
        successMetrics: ['masteryRate'],
        guardrails: ['ABANDONMENT_CHECK'],
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createExperiment({
        hypothesis: 'Adding booster units improves pass rates',
        baselineDefinition: {},
        treatmentDefinition: {},
        populationDefinition: {},
        successMetrics: [],
        guardrails: ['ABANDONMENT_CHECK'],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should trigger Automatic Experiment Stop when abandonment rate exceeds threshold', async () => {
    mockPrisma.evolutionExperiment.findUnique.mockResolvedValue({
      id: 'exp-101',
      hypothesis: 'Test hypothesis',
      status: 'RUNNING',
    });

    // Abandonment rate at 22% (threshold is 15%)
    const result = await service.evaluateGuardrails('exp-101', { abandonmentRate: 0.22 });

    expect(result.breached).toBe(true);
    expect(result.reason).toContain('exceeded critical safety threshold');
    expect(mockPrisma.evolutionExperiment.update).toHaveBeenCalledWith({
      where: { id: 'exp-101' },
      data: { status: 'PAUSED' },
    });
  });
});
