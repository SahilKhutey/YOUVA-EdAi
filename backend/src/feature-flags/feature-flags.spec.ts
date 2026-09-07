import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService (Canary Rollouts & Model Governance)', () => {
  let service: FeatureFlagsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      featureFlag: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'flag-1', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'flag-1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
      },
      aIModelEvaluationRecord: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'eval-1', ...data })),
        count: jest.fn().mockImplementation(({ where }) => {
          if (where?.safetyPassed === false) return Promise.resolve(2);
          if (where?.teacherAgreed === true) return Promise.resolve(18);
          if (where?.teacherOverridden === true) return Promise.resolve(2);
          return Promise.resolve(20);
        }),
      },
    };

    service = new FeatureFlagsService(mockPrisma);
  });

  describe('computeBucket Determinism', () => {
    it('should deterministically produce identical bucket values for the same key and entityId', () => {
      const b1 = service.computeBucket('ai_mentor_gemini_2', 'user_abc_123');
      const b2 = service.computeBucket('ai_mentor_gemini_2', 'user_abc_123');
      const b3 = service.computeBucket('ai_mentor_gemini_2', 'user_xyz_999');

      expect(b1).toBe(b2);
      expect(b1).toBeGreaterThanOrEqual(0);
      expect(b1).toBeLessThan(100);
      expect(typeof b3).toBe('number');
    });
  });

  describe('isEnabled', () => {
    it('should return false if flag does not exist or is disabled', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);
      const res1 = await service.isEnabled({ flagKey: 'unknown_flag' });
      expect(res1).toBe(false);

      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'disabled_flag',
        isEnabled: false,
        rolloutPercentage: 100,
      });
      const res2 = await service.isEnabled({ flagKey: 'disabled_flag' });
      expect(res2).toBe(false);
    });

    it('should grant access to whitelisted user even when rollout is 0%', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'beta_curriculum',
        isEnabled: true,
        rolloutPercentage: 0,
        userWhitelist: 'vip-student-1, vip-student-2',
      });

      const allowed = await service.isEnabled({
        flagKey: 'beta_curriculum',
        userId: 'vip-student-1',
      });
      expect(allowed).toBe(true);

      const denied = await service.isEnabled({
        flagKey: 'beta_curriculum',
        userId: 'regular-student',
      });
      expect(denied).toBe(false);
    });

    it('should grant access to whitelisted tenant', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'district_analytics',
        isEnabled: true,
        rolloutPercentage: 0,
        tenantWhitelist: 'district_san_jose, district_oakland',
      });

      const allowed = await service.isEnabled({
        flagKey: 'district_analytics',
        tenantId: 'district_san_jose',
      });
      expect(allowed).toBe(true);
    });

    it('should respect targetRoles restrictions', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        key: 'teacher_override_cockpit_v2',
        isEnabled: true,
        rolloutPercentage: 100,
        targetRoles: 'TEACHER, PRINCIPAL',
      });

      const allowedTeacher = await service.isEnabled({
        flagKey: 'teacher_override_cockpit_v2',
        role: 'TEACHER',
      });
      expect(allowedTeacher).toBe(true);

      const deniedStudent = await service.isEnabled({
        flagKey: 'teacher_override_cockpit_v2',
        role: 'STUDENT',
      });
      expect(deniedStudent).toBe(false);
    });
  });

  describe('Model Evaluation & Governance Telemetry', () => {
    it('should log AI model evaluation record', async () => {
      const record = await service.logModelEvaluation({
        modelName: 'gemini-1.5-flash',
        modelVersion: '2026.09-v1',
        promptKey: 'bkt_difficulty_calibration',
        teacherAgreed: true,
        accuracyScore: 0.94,
        latencyMs: 145,
      });

      expect(mockPrisma.aIModelEvaluationRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          modelName: 'gemini-1.5-flash',
          teacherAgreed: true,
          safetyPassed: true,
        }),
      });
      expect(record.id).toBe('eval-1');
    });

    it('should compute teacher agreement and override rates accurately', async () => {
      const metrics = await service.getModelGovernanceMetrics('gemini-1.5-flash');

      expect(metrics.totalEvaluations).toBe(20);
      expect(metrics.safetyFailures).toBe(2);
      expect(metrics.teacherAgreementRate).toBe(0.9); // 18 / (18 + 2)
      expect(metrics.teacherOverrideRate).toBe(0.1); // 2 / (18 + 2)
    });
  });
});
