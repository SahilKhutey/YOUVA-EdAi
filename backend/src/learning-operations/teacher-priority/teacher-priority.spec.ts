import { calculateTeacherPriority } from './teacher-priority.types';
import { TeacherPriorityService } from './teacher-priority.service';

describe('calculateTeacherPriority & TeacherPriorityService', () => {
  let service: TeacherPriorityService;

  beforeEach(() => {
    service = new TeacherPriorityService();
  });

  it('prioritizes severe urgent cases', () => {
    const high = calculateTeacherPriority({
      severity: 1,
      learnerImpact: 1,
      evidenceConfidence: 1,
      urgency: 1,
      interventionAge: 1,
    });

    expect(high).toBe(1);
  });

  it('calculates weighted priority correctly', () => {
    const priority = calculateTeacherPriority({
      severity: 0.8,         // 0.24
      learnerImpact: 0.8,    // 0.20
      evidenceConfidence: 1, // 0.15
      urgency: 0.5,          // 0.10
      interventionAge: 0.2,  // 0.02
    });
    // 0.24 + 0.20 + 0.15 + 0.10 + 0.02 = 0.71
    expect(priority).toBeCloseTo(0.71, 2);
  });

  it('clusters individual interventions to reduce teacher notification fatigue', () => {
    const sample = [
      { targetConceptId: 'c1', type: 'REMEDIATION', priority: 0.8 },
      { targetConceptId: 'c1', type: 'REMEDIATION', priority: 0.9 },
      { targetConceptId: 'c2', type: 'HINT', priority: 0.5 },
    ];

    const clusters = service.clusterInterventions(sample);
    expect(clusters.length).toBe(2);
    const c1Cluster = clusters.find((c) => c.conceptId === 'c1');
    expect(c1Cluster?.learnerCount).toBe(2);
    expect(c1Cluster?.averageSeverity).toBeCloseTo(0.85, 2);
  });
});
