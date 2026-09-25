import { SimulationEngineService } from '../simulation/simulation-engine.service';
import { SimulationPolicy } from '../policies/simulation-policy';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningScenarioDto, TwinSnapshotDto } from '../domain/twin.types';

describe('ImpactAndConflictDetection (LKC-15)', () => {
  let simulationEngine: SimulationEngineService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      simulationResult: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'res-conflict-1', ...data, createdAt: new Date() }),
        ),
      },
    };
    simulationEngine = new SimulationEngineService(
      mockPrisma as unknown as PrismaService,
      new SimulationPolicy(),
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

  it('should detect PREREQUISITE_CONFLICT when moving or replacing curriculum items', async () => {
    const scenario: LearningScenarioDto = {
      id: 'scen-move',
      tenantId: 'tenant-1',
      snapshotId: 'snap-1',
      name: 'Shift Topic Sequence',
      objective: 'Check prerequisite safety',
      changes: [
        {
          targetType: 'TOPIC',
          targetId: 'TOPIC_CALC_04',
          operation: 'MOVE',
          proposedState: { sequence: 1 },
        },
      ],
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await simulationEngine.simulate(mockSnapshot, scenario);

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe('PREREQUISITE_CONFLICT');
    expect(result.conflicts[0].severity).toBe('HIGH');
    expect(result.conflicts[0].explanation).toContain('downstream prerequisite dependencies');

    const risk = result.risks.find((r) => r.category === 'CURRICULUM');
    expect(risk).toBeDefined();
    expect(risk?.probabilityBand).toBe('MEDIUM');
    expect(risk?.severity).toBe('HIGH');
  });

  it('should detect ASSESSMENT_CONFLICT when removing assessed curriculum items', async () => {
    const scenario: LearningScenarioDto = {
      id: 'scen-remove',
      tenantId: 'tenant-1',
      snapshotId: 'snap-1',
      name: 'Deprecate Obsolete Subtopic',
      objective: 'Clean up catalog',
      changes: [
        {
          targetType: 'SUBTOPIC',
          targetId: 'SUB_GEOM_09',
          operation: 'REMOVE',
          proposedState: null,
        },
      ],
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await simulationEngine.simulate(mockSnapshot, scenario);

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe('ASSESSMENT_CONFLICT');
    expect(result.conflicts[0].severity).toBe('HIGH');
    expect(result.conflicts[0].explanation).toContain('Q17');

    const risk = result.risks.find((r) => r.category === 'ASSESSMENT');
    expect(risk).toBeDefined();
    expect(risk?.probabilityBand).toBe('HIGH');
  });
});
