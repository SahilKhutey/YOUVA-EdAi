import { ResearchService, validatePattern } from './research.service';

describe('Research Dataset Governance & Pattern Validation', () => {
  describe('validatePattern', () => {
    it('approves pattern when sample size and confidence meet thresholds', () => {
      expect(validatePattern(35, 0.85)).toBe(true);
    });

    it('rejects pattern with insufficient sample size (< 30)', () => {
      expect(validatePattern(25, 0.95)).toBe(false);
    });

    it('rejects pattern with insufficient confidence (< 0.8)', () => {
      expect(validatePattern(50, 0.75)).toBe(false);
    });
  });

  describe('De-identification Pipeline', () => {
    let service: ResearchService;
    let prismaMock: any;

    beforeEach(() => {
      prismaMock = {
        researchDataset: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'ds-approved',
            status: 'APPROVED',
          }),
        },
      };
      service = new ResearchService(prismaMock as any);
    });

    it('pseudonymizes learner ID, removes PII, and buckets timestamps to YYYY-MM-DD', async () => {
      const rawEvidence = [
        {
          learnerId: 'student-uuid-999',
          name: 'Jane Doe',
          email: 'jane@example.com',
          conceptId: 'algebra-quadratics',
          evidenceType: 'ASSESSMENT',
          outcome: 0.95,
          occurredAt: '2026-09-07T14:23:45.678Z',
        },
      ];

      const exported = await service.exportAnonymizedRecords('ds-approved', rawEvidence);

      expect(exported).toHaveLength(1);
      const record = exported[0];

      // Verifies pseudonymization
      expect(record.anonymousLearnerId).toMatch(/^anon-[a-f0-9]{16}$/);
      expect(record.anonymousLearnerId).not.toContain('student-uuid-999');

      // Verifies PII is absent
      expect((record as any).name).toBeUndefined();
      expect((record as any).email).toBeUndefined();

      // Verifies date bucketing
      expect(record.timestampBucket).toBe('2026-09-07');
    });
  });
});
