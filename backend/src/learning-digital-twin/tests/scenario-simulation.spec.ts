import { SimulationEngineService } from '../simulation/simulation-engine.service';
import { SimulationPolicy } from '../policies/simulation-policy';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningScenarioDto, TwinSnapshotDto } from '../domain/twin.types';

describe('ScenarioSimulationEngine (LKC-15)', () => {
  let simulationEngine: SimulationEngineService;
  let simulationPolicy: SimulationPolicy;
  let mockPrisma: any;

  beforeEach(() => {
    simulationPolicy = new SimulationPolicy();
    mockPrisma = {
      simulationResult: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'sim-res-1', ...data, createdAt: new Date() }),
        ),
      },
    };
    simulationEngine = new SimulationEngineService(
      mockPrisma as unknown as PrismaService,
      simulationPolicy,
    );
  });

  const mockSnapshot: TwinSnapshotDto = {
    id: 'snap-1',
    tenantId: 'tenant-1',
    snapshotTime: new Date(),
    knowledgeVersionSet: 'KV_2026_09',
    curriculumVersionSet: 'CV_2026_09',
    policyVersionSet: 'PV_2026_09',
    learnerStateSnapshot: 'LS_1',
    assessmentVersionSet: 'AV_1',
    methodologyVersion: '1.0.0',
    checksum: 'abc123hash',
    createdAt: new Date(),
  };

  it('should run simulation and compute projected metrics accurately', async () => {
    const scenario: LearningScenarioDto = {
      id: 'scen-1',
      tenantId: 'tenant-1',
      snapshotId: 'snap-1',
      name: 'Reorder Calculus Modules',
      objective: 'Optimize introductory sequence',
      changes: [
        {
          targetType: 'CURRICULUM_MODULE',
          targetId: 'MOD_CALC_02',
          operation: 'MOVE',
          proposedState: { sequence: 1 },
        },
      ],
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await simulationEngine.simulate(mockSnapshot, scenario);

    expect(result).toBeDefined();
    expect(result.id).toBe('sim-res-1');
    expect(result.baseline.affectedLearners).toBe(0);
    expect(result.projected.affectedLearners).toBe(412);
    expect(result.projected.prerequisiteConflicts).toBe(2);
    expect(result.projected.estimatedTeacherWorkloadDeltaPct).toBeGreaterThan(0);
    expect(result.projected.estimatedRemediationDemandDeltaPct).toBeGreaterThan(0);

    // Verify uncertainty levels
    const impact = result.impacts.find((i) => i.targetId === 'MOD_CALC_02');
    expect(impact).toBeDefined();
    expect(impact?.uncertainty).toBe('SIMULATED');

    expect(mockPrisma.simulationResult.create).toHaveBeenCalled();
  });

  it('should handle ADD operations with ESTIMATED uncertainty', async () => {
    const scenario: LearningScenarioDto = {
      id: 'scen-2',
      tenantId: 'tenant-1',
      snapshotId: 'snap-1',
      name: 'Add Remediation Module',
      objective: 'Introduce booster units for struggling students',
      changes: [
        {
          targetType: 'REMEDIATION_MODULE',
          targetId: 'REM_ALG_01',
          operation: 'ADD',
          proposedState: { units: 3 },
        },
      ],
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await simulationEngine.simulate(mockSnapshot, scenario);
    expect(result.projected.estimatedRemediationDemandDeltaPct).toBe(5.0);
    const impact = result.impacts.find((i) => i.targetId === 'REM_ALG_01');
    expect(impact?.uncertainty).toBe('ESTIMATED');
  });
});
