import { DecisionEngine } from '../decision/decision.engine';
import {
  AdaptiveActionType,
  AdaptiveCandidate,
  AdaptiveReasonCode,
  CandidateSource,
} from '../decision/decision.types';
import { DEFAULT_ADAPTIVE_POLICY } from '../decision/decision.policy';

describe('DecisionEngine (LKC-7)', () => {
  let engine: DecisionEngine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  it('should return fallback CONTINUE action when candidates list is empty', () => {
    const decision = engine.decide([], 'learner-1', DEFAULT_ADAPTIVE_POLICY, 'tenant-1', 'k-curr');
    expect(decision.action).toBe(AdaptiveActionType.CONTINUE);
    expect(decision.targetKnowledgeId).toBe('k-curr');
    expect(decision.reasonMessage).toBeDefined();
  });

  it('should prioritize TEACHER_PATH over ASSIGNMENT and normal candidates', () => {
    const candidates: AdaptiveCandidate[] = [
      {
        knowledgeId: 'k-asg',
        action: AdaptiveActionType.PRACTICE,
        source: CandidateSource.ASSIGNMENT,
        required: true,
        priority: 90,
        reasonCodes: [AdaptiveReasonCode.ASSIGNMENT_REQUIRED],
      },
      {
        knowledgeId: 'k-teacher',
        action: AdaptiveActionType.ADVANCE,
        source: CandidateSource.TEACHER_PATH,
        required: true,
        priority: 100,
        reasonCodes: [AdaptiveReasonCode.TEACHER_DIRECTED],
      },
    ];

    const decision = engine.decide(candidates, 'learner-1', DEFAULT_ADAPTIVE_POLICY, 'tenant-1');
    expect(decision.targetKnowledgeId).toBe('k-teacher');
    expect(decision.action).toBe(AdaptiveActionType.ADVANCE);
    expect(decision.reasonCode).toBe(AdaptiveReasonCode.TEACHER_DIRECTED);
    expect(decision.reasonMessage).toContain('teacher');
  });

  it('should select REMEDIATE when prerequisite is not ready', () => {
    const candidates: AdaptiveCandidate[] = [
      {
        knowledgeId: 'k-prereq',
        action: AdaptiveActionType.REMEDIATE,
        source: CandidateSource.KNOWLEDGE_GRAPH,
        required: true,
        priority: 85,
        reasonCodes: [AdaptiveReasonCode.PREREQUISITE_NOT_READY],
      },
      {
        knowledgeId: 'k-curr',
        action: AdaptiveActionType.PRACTICE,
        source: CandidateSource.CURRICULUM,
        required: false,
        priority: 60,
        reasonCodes: [AdaptiveReasonCode.CURRICULUM_SEQUENCE],
      },
    ];

    const decision = engine.decide(candidates, 'learner-1', DEFAULT_ADAPTIVE_POLICY, 'tenant-1');
    expect(decision.targetKnowledgeId).toBe('k-prereq');
    expect(decision.action).toBe(AdaptiveActionType.REMEDIATE);
    expect(decision.reasonCode).toBe(AdaptiveReasonCode.PREREQUISITE_NOT_READY);
  });
});
