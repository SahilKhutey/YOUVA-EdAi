import {
  transition,
  scorePathway,
  PathwayScoreInput,
} from './pathway.types';
import { LearningPathwayService } from './learning-pathway.service';

describe('PathwayStateMachine', () => {
  it('allows AVAILABLE -> IN_PROGRESS', () => {
    expect(
      transition(
        'AVAILABLE',
        'IN_PROGRESS',
      ),
    ).toBe('IN_PROGRESS');
  });

  it('rejects LOCKED -> COMPLETED', () => {
    expect(() =>
      transition(
        'LOCKED',
        'COMPLETED',
      ),
    ).toThrow();
  });

  it('allows IN_PROGRESS -> EVIDENCE_REVIEW -> COMPLETED', () => {
    expect(transition('IN_PROGRESS', 'EVIDENCE_REVIEW')).toBe('EVIDENCE_REVIEW');
    expect(transition('EVIDENCE_REVIEW', 'COMPLETED')).toBe('COMPLETED');
  });

  it('computes weighted pathway score accurately', () => {
    const input: PathwayScoreInput = {
      goalAlignment: 1.0,        // 0.25 -> 0.25
      prerequisiteFit: 0.8,      // 0.20 -> 0.16
      competencyGap: 0.9,        // 0.20 -> 0.18
      evidenceConfidence: 0.9,   // 0.15 -> 0.135
      learnerPreferenceFit: 0.7, // 0.10 -> 0.07
      teacherPriority: 0.8,      // 0.10 -> 0.08
    };

    const score = scorePathway(input);
    expect(score).toBeCloseTo(0.875, 3);
  });
});

describe('LearningPathwayService', () => {
  let service: LearningPathwayService;
  let prisma: any;

  beforeEach(() => {
    prisma = {};
    service = new LearningPathwayService(prisma);
  });

  it('generates a multi-milestone pathway', async () => {
    const pathway = await service.generatePathway('student-1', 'Master Quadratic Equations');
    expect(pathway.learnerId).toBe('student-1');
    expect(pathway.milestones.length).toBeGreaterThan(0);
    expect(pathway.milestones[0].status).toBe('AVAILABLE');
  });

  it('advances milestone through state transitions', () => {
    const initial = {
      id: 'ms-1',
      type: 'CONCEPT' as const,
      targetId: 'c1',
      status: 'AVAILABLE' as const,
      evidenceRequired: 2,
    };

    const updated = service.advanceMilestone(initial, 'IN_PROGRESS');
    expect(updated.status).toBe('IN_PROGRESS');
  });
});
