import { ContinuousEvaluationService } from '../evaluation/continuous-evaluation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ContinuousEvaluationService (LKC-16)', () => {
  let service: ContinuousEvaluationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      evolutionEvaluation: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'eval-1', ...data, createdAt: new Date() }),
        ),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new ContinuousEvaluationService(mockPrisma as unknown as PrismaService);
  });

  it('should compute deltas and evaluate success criteria accurately', async () => {
    const res = await service.createEvaluation({
      interventionId: 'INT-REMED-01',
      baseline: [
        { name: 'remediationDemand', value: 20 },
        { name: 'masteryRate', value: 70 },
      ],
      actual: [
        { name: 'remediationDemand', value: 15 },
        { name: 'masteryRate', value: 82 },
      ],
      successCriteria: [
        { metric: 'remediationDemand', targetDelta: -4, comparator: 'LESS_THAN' },
        { metric: 'masteryRate', targetDelta: 10, comparator: 'GREATER_THAN' },
      ],
    });

    expect(res.deltas).toHaveLength(2);
    const remedDelta = res.deltas.find((d) => d.metric === 'remediationDemand');
    expect(remedDelta?.delta).toBe(-5);
    expect(remedDelta?.pctChange).toBe(-25);

    const masteryDelta = res.deltas.find((d) => d.metric === 'masteryRate');
    expect(masteryDelta?.delta).toBe(12);

    expect(res.successCriteria[0].satisfied).toBe(true);
    expect(res.successCriteria[1].satisfied).toBe(true);
    expect(res.status).toBe('COMPLETED');
  });

  it('should enforce Never Overclaim Causality invariant for concurrent interventions', async () => {
    const res = await service.createEvaluation({
      interventionId: 'INT-PACKAGE-01',
      baseline: [{ name: 'testScore', value: 65 }],
      actual: [{ name: 'testScore', value: 80 }],
      successCriteria: [{ metric: 'testScore', targetDelta: 10, comparator: 'GREATER_THAN' }],
      concurrentInterventions: ['NEW_REMEDIATION_POLICY', 'TEACHER_STUDIO_COACHING', 'SEASONAL_EXAM_PREP'],
    });

    expect(res.limitations).toBeDefined();
    const causalityNotice = res.limitations.find((l) =>
      l.includes('Non-Causal Attribution Notice'),
    );
    expect(causalityNotice).toBeDefined();
    expect(causalityNotice).toContain('NEW_REMEDIATION_POLICY');
    expect(causalityNotice).toContain('specific single-factor causality is not established');
  });
});
