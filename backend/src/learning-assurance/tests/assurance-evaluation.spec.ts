import { KnowledgeAssuranceEvaluator } from '../rules/evaluators/knowledge-assurance.evaluator';
import { LearningAssuranceEvaluator } from '../rules/evaluators/learning-assurance.evaluator';
import { AssessmentAssuranceEvaluator } from '../rules/evaluators/assessment-assurance.evaluator';
import { AIAssuranceEvaluator } from '../rules/evaluators/ai-assurance.evaluator';

describe('Domain Assurance Evaluators (LKC-14)', () => {
  describe('KnowledgeAssuranceEvaluator', () => {
    let evaluator: KnowledgeAssuranceEvaluator;

    beforeEach(() => {
      evaluator = new KnowledgeAssuranceEvaluator();
    });

    it('should warn when learning objectives are missing (KNOW-001)', () => {
      const checks = evaluator.evaluate({
        id: 'know-1',
        tenantId: 'tenant-a',
        objectives: [],
      });

      const objCheck = checks.find((c) => c.checkId === 'KNOW-001');
      expect(objCheck).toBeDefined();
      expect(objCheck?.status).toBe('WARNING');
      expect(objCheck?.severity).toBe('HIGH');
    });

    it('should block cross-tenant content references (KNOW-002)', () => {
      const checks = evaluator.evaluate({
        id: 'know-2',
        tenantId: 'tenant-a',
        targetTenantId: 'tenant-b',
        objectives: ['obj-1'],
      });

      const tenantCheck = checks.find((c) => c.checkId === 'KNOW-002');
      expect(tenantCheck).toBeDefined();
      expect(tenantCheck?.status).toBe('FAIL');
      expect(tenantCheck?.severity).toBe('CRITICAL');
    });

    it('should block direct mutation of published immutable versions (KNOW-003)', () => {
      const checks = evaluator.evaluate({
        id: 'know-3',
        tenantId: 'tenant-a',
        objectives: ['obj-1'],
        modifyingPublished: true,
      });

      const immutCheck = checks.find((c) => c.checkId === 'KNOW-003');
      expect(immutCheck).toBeDefined();
      expect(immutCheck?.status).toBe('FAIL');
      expect(immutCheck?.severity).toBe('CRITICAL');
    });
  });

  describe('LearningAssuranceEvaluator', () => {
    let evaluator: LearningAssuranceEvaluator;

    beforeEach(() => {
      evaluator = new LearningAssuranceEvaluator();
    });

    it('should pass decision when evidence, freshness, and authorization are valid', () => {
      const decision = evaluator.evaluate({
        decisionId: 'dec-1',
        evidenceIds: ['ev-1', 'ev-2'],
        learnerStateUpdatedAt: new Date(),
        actorRole: 'TEACHER',
        targetLearnerId: 'learner-1',
        policyVersion: '1.0.0',
      });

      expect(decision.status).toBe('PASS');
      expect(decision.evidenceValid).toBe(true);
      expect(decision.learnerStateValid).toBe(true);
    });

    it('should warn when learner state is older than 7 days', () => {
      const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const decision = evaluator.evaluate({
        decisionId: 'dec-2',
        evidenceIds: ['ev-1'],
        learnerStateUpdatedAt: staleDate,
        actorRole: 'TEACHER',
        targetLearnerId: 'learner-1',
        policyVersion: '1.0.0',
      });

      expect(decision.status).toBe('WARNING');
      expect(decision.learnerStateValid).toBe(false);
      expect(decision.violations).toContain('Decision used stale learner state (> 7 days).');
    });

    it('should block decision when actor is unauthorized', () => {
      const decision = evaluator.evaluate({
        decisionId: 'dec-3',
        evidenceIds: ['ev-1'],
        learnerStateUpdatedAt: new Date(),
        actorRole: 'UNAUTHORIZED',
        targetLearnerId: 'learner-1',
        policyVersion: '1.0.0',
      });

      expect(decision.status).toBe('BLOCK');
      expect(decision.authorizationValid).toBe(false);
    });
  });

  describe('AssessmentAssuranceEvaluator', () => {
    let evaluator: AssessmentAssuranceEvaluator;

    beforeEach(() => {
      evaluator = new AssessmentAssuranceEvaluator();
    });

    it('should pass when question has objective and exactly 1 correct answer', () => {
      const checks = evaluator.evaluate({
        id: 'q-1',
        objectiveId: 'obj-math',
        lessonObjectiveIds: ['obj-math', 'obj-geom'],
        correctAnswersCount: 1,
        difficultyMetadata: 0.5,
      });

      expect(checks.every((c) => c.status === 'PASS')).toBe(true);
    });

    it('should fail with CRITICAL when question has 0 correct answers (ASSESS-002)', () => {
      const checks = evaluator.evaluate({
        id: 'q-2',
        objectiveId: 'obj-math',
        correctAnswersCount: 0,
      });

      const ansCheck = checks.find((c) => c.checkId === 'ASSESS-002');
      expect(ansCheck?.status).toBe('FAIL');
      expect(ansCheck?.severity).toBe('CRITICAL');
    });

    it('should fail with CRITICAL when question has multiple unintended answers (ASSESS-002)', () => {
      const checks = evaluator.evaluate({
        id: 'q-3',
        objectiveId: 'obj-math',
        correctAnswersCount: 2,
      });

      const ansCheck = checks.find((c) => c.checkId === 'ASSESS-002');
      expect(ansCheck?.status).toBe('FAIL');
      expect(ansCheck?.severity).toBe('CRITICAL');
    });
  });

  describe('AIAssuranceEvaluator', () => {
    let evaluator: AIAssuranceEvaluator;

    beforeEach(() => {
      evaluator = new AIAssuranceEvaluator();
    });

    it('should detect unsupported claims and block ungrounded output', () => {
      const record = evaluator.evaluate({
        generationId: 'gen-1',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        inputReferences: ['ref-1'],
        outputHash: 'hash-abc',
        unsupportedClaimsCount: 2,
      });

      expect(record.groundingStatus).toBe('UNSUPPORTED');
      expect(record.policyStatus).toBe('BLOCK');
    });

    it('should block AI content from publishing directly without human review (AI-002)', () => {
      const record = evaluator.evaluate({
        generationId: 'gen-2',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        inputReferences: ['ref-1'],
        outputHash: 'hash-abc',
        attemptingToPublishDirectly: true,
        humanApproved: false,
      });

      expect(record.policyStatus).toBe('BLOCK');
      expect(record.violations).toContain(
        'AI-002: Direct publication of AI output without authorized human review is BLOCKED.',
      );
    });
  });
});
