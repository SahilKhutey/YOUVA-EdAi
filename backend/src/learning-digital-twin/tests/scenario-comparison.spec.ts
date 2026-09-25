import { ScenarioComparisonService } from '../comparison/scenario-comparison.service';
import { ScenarioService } from '../scenarios/scenario.service';
import { LearningScenarioDto, SimulationResultDto } from '../domain/twin.types';
import { BadRequestException } from '@nestjs/common';

describe('ScenarioComparisonService (LKC-15)', () => {
  let comparisonService: ScenarioComparisonService;
  let mockScenarioService: any;

  const baselineResult: SimulationResultDto = {
    id: 'res-base',
    scenarioId: 'scen-base',
    baseline: {
      affectedLearners: 0,
      affectedCourses: 0,
      prerequisiteConflicts: 0,
      assessmentConflicts: 0,
      estimatedTeacherWorkloadDeltaPct: 0.0,
      estimatedRemediationDemandDeltaPct: 0.0,
    },
    projected: {
      affectedLearners: 100,
      affectedCourses: 2,
      prerequisiteConflicts: 0,
      assessmentConflicts: 0,
      estimatedTeacherWorkloadDeltaPct: 1.0,
      estimatedRemediationDemandDeltaPct: 2.0,
    },
    impacts: [],
    risks: [],
    conflicts: [],
    assumptions: ['Assumption 1'],
    limitations: ['Limitation 1'],
    methodologyVersion: '1.0.0',
    createdAt: new Date(),
  };

  const targetResult: SimulationResultDto = {
    id: 'res-target',
    scenarioId: 'scen-target',
    baseline: {
      affectedLearners: 0,
      affectedCourses: 0,
      prerequisiteConflicts: 0,
      assessmentConflicts: 0,
      estimatedTeacherWorkloadDeltaPct: 0.0,
      estimatedRemediationDemandDeltaPct: 0.0,
    },
    projected: {
      affectedLearners: 412,
      affectedCourses: 8,
      prerequisiteConflicts: 2,
      assessmentConflicts: 1,
      estimatedTeacherWorkloadDeltaPct: 4.2,
      estimatedRemediationDemandDeltaPct: 8.1,
    },
    impacts: [],
    risks: [],
    conflicts: [
      {
        type: 'PREREQUISITE_CONFLICT',
        targetId: 'MOD_CALC_02',
        severity: 'HIGH',
        explanation: 'Dependency conflict',
      },
    ],
    assumptions: ['Assumption 1'],
    limitations: ['Limitation 1'],
    methodologyVersion: '1.0.0',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockScenarioService = {
      getScenario: jest.fn().mockImplementation((id: string): Promise<LearningScenarioDto> => {
        if (id === 'scen-base') {
          return Promise.resolve({
            id: 'scen-base',
            tenantId: 'tenant-1',
            snapshotId: 'snap-1',
            name: 'Baseline Plan',
            objective: 'Current curriculum',
            changes: [],
            status: 'COMPLETED',
            createdAt: new Date(),
            updatedAt: new Date(),
            results: [baselineResult],
          });
        }
        if (id === 'scen-target') {
          return Promise.resolve({
            id: 'scen-target',
            tenantId: 'tenant-1',
            snapshotId: 'snap-1',
            name: 'Reordered Plan',
            objective: 'Accelerated pacing',
            changes: [],
            status: 'COMPLETED',
            createdAt: new Date(),
            updatedAt: new Date(),
            results: [targetResult],
          });
        }
        if (id === 'scen-unsimulated') {
          return Promise.resolve({
            id: 'scen-unsimulated',
            tenantId: 'tenant-1',
            snapshotId: 'snap-1',
            name: 'Draft Plan',
            objective: 'Unsimulated',
            changes: [],
            status: 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date(),
            results: [],
          });
        }
        return Promise.reject(new Error('Scenario not found'));
      }),
    };

    comparisonService = new ScenarioComparisonService(
      mockScenarioService as unknown as ScenarioService,
    );
  });

  it('should compute side-by-side metric deltas accurately', async () => {
    const comparison = await comparisonService.compareScenarios('scen-base', 'scen-target');

    expect(comparison.baselineScenarioId).toBe('scen-base');
    expect(comparison.scenarioId).toBe('scen-target');

    const learnerMetric = comparison.metrics.find((m) => m.metric === 'Affected Learners');
    expect(learnerMetric).toBeDefined();
    expect(learnerMetric?.baseline).toBe(100);
    expect(learnerMetric?.scenario).toBe(412);
    expect(learnerMetric?.delta).toBe(312);

    const conflictMetric = comparison.metrics.find((m) => m.metric === 'Prerequisite Conflicts');
    expect(conflictMetric).toBeDefined();
    expect(conflictMetric?.baseline).toBe(0);
    expect(conflictMetric?.scenario).toBe(2);
    expect(conflictMetric?.delta).toBe(2);

    expect(comparison.conflicts).toHaveLength(1);
    expect(comparison.conflicts[0].type).toBe('PREREQUISITE_CONFLICT');
  });

  it('should throw BadRequestException if baseline or target scenario is unsimulated', async () => {
    await expect(
      comparisonService.compareScenarios('scen-unsimulated', 'scen-target'),
    ).rejects.toThrow(BadRequestException);

    await expect(
      comparisonService.compareScenarios('scen-base', 'scen-unsimulated'),
    ).rejects.toThrow(BadRequestException);
  });
});
