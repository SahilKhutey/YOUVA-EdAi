import {
  selectBestAction,
  scoreAction,
  ActionCandidate,
} from './next-best-action.service';
import { filterUnsafeActions } from '../actions/action-policy.service';

describe('selectBestAction', () => {
  it('selects the highest scoring action', () => {
    const result = selectBestAction([
      {
        type: 'A',
        score: 0.3,
        confidence: 0.8,
        evidenceIds: [],
        reversible: true,
        requiresHumanApproval: false,
      },
      {
        type: 'B',
        score: 0.9,
        confidence: 0.9,
        evidenceIds: [],
        reversible: true,
        requiresHumanApproval: false,
      },
    ]);

    expect(result?.type).toBe('B');
  });

  it('returns null for empty candidates', () => {
    expect(selectBestAction([])).toBeNull();
  });
});

describe('filterUnsafeActions', () => {
  it('removes forbidden AI actions', () => {
    const result = filterUnsafeActions([
      {
        type: 'CHANGE_CONSENT',
        score: 1,
        confidence: 1,
        evidenceIds: [],
        reversible: false,
        requiresHumanApproval: true,
      },
      {
        type: 'GENERATE_HINT',
        score: 0.8,
        confidence: 0.9,
        evidenceIds: [],
        reversible: true,
        requiresHumanApproval: false,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('GENERATE_HINT');
  });

  it('filters out all blocked action types (CONSENT, ROLE, CERTIFY_MASTERY, CLOSE_SAFETY_INCIDENT)', () => {
    const actions = [
      { type: 'CHANGE_ROLE' },
      { type: 'CERTIFY_MASTERY' },
      { type: 'CLOSE_SAFETY_INCIDENT' },
      { type: 'RECOMMEND_PRACTICE' },
    ];
    const filtered = filterUnsafeActions(actions);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe('RECOMMEND_PRACTICE');
  });
});

describe('scoreAction', () => {
  it('calculates weighted action candidate score accurately', () => {
    const score = scoreAction({
      learningBenefit: 1.0,     // 0.30
      goalAlignment: 0.8,       // 0.16
      evidenceConfidence: 0.8,  // 0.12
      urgency: 0.6,             // 0.09
      teacherPriority: 0.7,     // 0.07
      effort: 0.2,              // (1 - 0.2) * 0.10 = 0.08
    });
    // 0.30 + 0.16 + 0.12 + 0.09 + 0.07 + 0.08 = 0.82
    expect(score).toBeCloseTo(0.82, 2);
  });
});
