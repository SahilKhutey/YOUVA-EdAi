import { InterventionOrchestrationService } from './intervention-orchestration.service';
import { InterventionTier } from './governance.types';

describe('InterventionOrchestrationService', () => {
  let service: InterventionOrchestrationService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      aIInteractionEvaluation: {
        create: jest.fn().mockResolvedValue({ id: 'eval-1' }),
      },
    };
    service = new InterventionOrchestrationService(prismaMock as any);
  });

  describe('calculateInterventionScore & Tier Assignment', () => {
    it('assigns NORMAL tier for smoothly progressing learner', () => {
      const evaluation = service.evaluateIntervention({
        consecutiveFailures: 0,
        struggleDurationMinutes: 5,
        dropInAccuracy: 0.05,
        sentimentScore: 0.95,
      });

      expect(evaluation.tier).toBe(InterventionTier.NORMAL);
      expect(evaluation.score).toBeLessThan(0.25);
      expect(evaluation.recommendedAction).toBe('MAINTAIN_CURRENT_PATH');
    });

    it('assigns TIER_1_AI_SUPPORT for mild friction', () => {
      const evaluation = service.evaluateIntervention({
        consecutiveFailures: 2,
        struggleDurationMinutes: 15,
        dropInAccuracy: 0.25,
        sentimentScore: 0.7,
      });

      expect(evaluation.tier).toBe(InterventionTier.TIER_1_AI_SUPPORT);
      expect(evaluation.score).toBeGreaterThanOrEqual(0.25);
      expect(evaluation.score).toBeLessThan(0.50);
      expect(evaluation.recommendedAction).toBe('OFFER_SCAFFOLD_HINT');
    });

    it('assigns TIER_2_TEACHER_REVIEW for persistent barrier', () => {
      const evaluation = service.evaluateIntervention({
        consecutiveFailures: 4,
        struggleDurationMinutes: 45,
        dropInAccuracy: 0.50,
        sentimentScore: 0.4,
      });

      expect(evaluation.tier).toBe(InterventionTier.TIER_2_TEACHER_REVIEW);
      expect(evaluation.score).toBeGreaterThanOrEqual(0.50);
      expect(evaluation.score).toBeLessThan(0.75);
      expect(evaluation.recommendedAction).toBe('ADD_TO_TEACHER_REVIEW_QUEUE');
    });

    it('assigns TIER_3_TEACHER_URGENT for critical struggle and frustration', () => {
      const evaluation = service.evaluateIntervention({
        consecutiveFailures: 6,
        struggleDurationMinutes: 70,
        dropInAccuracy: 0.90,
        sentimentScore: 0.1,
      });

      expect(evaluation.tier).toBe(InterventionTier.TIER_3_TEACHER_URGENT);
      expect(evaluation.score).toBeGreaterThanOrEqual(0.75);
      expect(evaluation.score).toBeLessThanOrEqual(1.0);
      expect(evaluation.recommendedAction).toBe('IMMEDIATE_TEACHER_ALERT');
    });
  });

  describe('recordLearnerIntervention', () => {
    it('persists evaluation record for high-tier intervention', async () => {
      await service.recordLearnerIntervention(
        'learner-100',
        {
          consecutiveFailures: 5,
          struggleDurationMinutes: 65,
          dropInAccuracy: 0.85,
          sentimentScore: 0.1,
        },
        'tenant-alpha',
      );

      expect(prismaMock.aIInteractionEvaluation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            evaluatorType: 'INTERVENTION_ORCHESTRATOR',
            evaluatorId: 'system',
          }),
        }),
      );
    });
  });
});
