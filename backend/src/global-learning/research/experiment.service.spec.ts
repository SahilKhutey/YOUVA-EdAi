import { assignVariant, ExperimentService } from './experiment.service';

describe('ExperimentService & assignVariant', () => {
  let service: ExperimentService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      learningExperiment: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'exp-1', ...data })),
      },
      experimentAssignment: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'asgn-1', ...data })),
      },
      experimentObservation: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'obs-1', ...data })),
      },
    };

    service = new ExperimentService(mockPrisma);
  });

  describe('assignVariant', () => {
    it('is deterministic for same student and same experiment', () => {
      const first = assignVariant('spacing-test', 'student-1', ['A', 'B']);
      const second = assignVariant('spacing-test', 'student-1', ['A', 'B']);

      expect(first).toBe(second);
    });

    it('returns an allowed variant', () => {
      const result = assignVariant('experiment', 'student-1', [
        'CONTROL',
        'TREATMENT',
      ]);

      expect(['CONTROL', 'TREATMENT']).toContain(result);
    });

    it('rejects empty variants', () => {
      expect(() => assignVariant('experiment', 'student-1', [])).toThrow();
    });
  });

  describe('assignSubjectVariant DB persistence', () => {
    it('creates assignment and reuses existing assignment', async () => {
      mockPrisma.learningExperiment.findUnique.mockResolvedValue({
        id: 'exp-101',
        key: 'scaffolding_v2',
        allocationJson: JSON.stringify({ CONTROL: 50, SCAFFOLDED: 50 }),
      });

      mockPrisma.experimentAssignment.findUnique.mockResolvedValue(null);

      const variant = await service.assignSubjectVariant('scaffolding_v2', 'user-42');
      expect(['CONTROL', 'SCAFFOLDED']).toContain(variant);
      expect(mockPrisma.experimentAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          experimentId: 'exp-101',
          subjectId: 'user-42',
          variant,
        }),
      });

      // Subsequent call returns existing
      mockPrisma.experimentAssignment.findUnique.mockResolvedValue({
        variant: 'CONTROL',
      });
      const reused = await service.assignSubjectVariant('scaffolding_v2', 'user-42');
      expect(reused).toBe('CONTROL');
    });
  });
});
