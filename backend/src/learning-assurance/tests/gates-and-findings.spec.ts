import { FindingService } from '../services/finding.service';
import { AssuranceGatesService } from '../services/assurance-gates.service';
import { AssuranceEvaluationService } from '../services/assurance-evaluation.service';
import { OrchestrationAssuranceEvaluator } from '../rules/evaluators/orchestration-assurance.evaluator';
import { WaiverPolicy } from '../policies/waiver-policy';

describe('Assurance Gates & Finding Lifecycle (LKC-14)', () => {
  let findingService: FindingService;
  let gatesService: AssuranceGatesService;
  let evalService: AssuranceEvaluationService;
  let orchEvaluator: OrchestrationAssuranceEvaluator;
  let waiverPolicy: WaiverPolicy;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      assuranceFinding: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'find-100',
            ...data,
            createdAt: new Date(),
            resolvedAt: null,
          }),
        ),
        update: jest.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({
            id: where.id,
            tenantId: 'tenant-a',
            domain: 'KNOWLEDGE',
            targetType: 'KNOWLEDGE_OBJECT',
            targetId: 'obj-1',
            ruleId: 'KNOW-001',
            ruleVersion: '1.0.0',
            severity: 'HIGH',
            status: data.status,
            fingerprint: 'fp-123',
            message: data.message ?? 'Test finding',
            metadata: data.metadata,
            createdAt: new Date(),
            resolvedAt: data.resolvedAt ?? null,
          }),
        ),
        findUnique: jest.fn().mockResolvedValue({
          id: 'find-100',
          tenantId: 'tenant-a',
          domain: 'KNOWLEDGE',
          severity: 'HIGH',
          status: 'OPEN',
          metadata: {},
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      assuranceEvaluation: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'eval-1',
            ...data,
            createdAt: new Date(),
          }),
        ),
      },
    };

    waiverPolicy = new WaiverPolicy();
    findingService = new FindingService(mockPrisma, waiverPolicy);
    orchEvaluator = new OrchestrationAssuranceEvaluator();

    evalService = {
      evaluateTarget: jest.fn(),
    } as any;

    gatesService = new AssuranceGatesService(evalService, orchEvaluator);
  });

  it('should evaluate publication gate to PASSED for clean content', async () => {
    (evalService.evaluateTarget as jest.Mock).mockResolvedValue({
      result: {
        checks: [
          { checkId: 'KNOW-001', status: 'PASS', severity: 'LOW' },
          { checkId: 'KNOW-002', status: 'PASS', severity: 'LOW' },
        ],
      },
    });

    const gate = await gatesService.evaluatePublicationGate('KNOWLEDGE_OBJECT', 'obj-1');
    expect(gate.status).toBe('PASSED');
  });

  it('should evaluate publication gate to WARNING when quality warning exists (does not block)', async () => {
    (evalService.evaluateTarget as jest.Mock).mockResolvedValue({
      result: {
        checks: [
          { checkId: 'KNOW-001', status: 'WARNING', message: 'Missing optional example', severity: 'LOW' },
        ],
      },
    });

    const gate = await gatesService.evaluatePublicationGate('KNOWLEDGE_OBJECT', 'obj-2');
    expect(gate.status).toBe('WARNING');
  });

  it('should evaluate publication gate to BLOCKED when critical check fails', async () => {
    (evalService.evaluateTarget as jest.Mock).mockResolvedValue({
      result: {
        checks: [
          { checkId: 'KNOW-002', status: 'FAIL', message: 'Tenant boundary violation', severity: 'CRITICAL' },
        ],
      },
    });

    const gate = await gatesService.evaluatePublicationGate('KNOWLEDGE_OBJECT', 'obj-3');
    expect(gate.status).toBe('BLOCKED');
    expect(gate.reasons).toContain('Critical failure: Tenant boundary violation');
  });

  it('should evaluate pre-execution gate blocking scope escalation', () => {
    const result = gatesService.evaluateExecutionGate('orch-1', {
      workflowValid: true,
      policyValid: true,
      authorizationValid: true,
      scopeValid: false, // Scope escalation
      dependenciesValid: true,
      versionValid: true,
    });

    expect(result.status).toBe('BLOCK');
    expect(result.reasons).toContain('ORCH-001: Scope escalation violation detected.');
  });

  it('should deduplicate active findings with identical fingerprints', async () => {
    mockPrisma.assuranceFinding.findFirst.mockResolvedValue({
      id: 'existing-find-1',
      tenantId: 'tenant-a',
      fingerprint: 'fp-123',
      status: 'OPEN',
      metadata: {},
    });

    const finding = await findingService.createOrUpdateFinding({
      tenantId: 'tenant-a',
      domain: 'KNOWLEDGE',
      targetType: 'KNOWLEDGE_OBJECT',
      targetId: 'obj-1',
      ruleId: 'KNOW-001',
      severity: 'HIGH',
      message: 'Updated message',
    });

    expect(mockPrisma.assuranceFinding.update).toHaveBeenCalled();
    expect(mockPrisma.assuranceFinding.create).not.toHaveBeenCalled();
    expect(finding.id).toBe('existing-find-1');
  });

  it('should acknowledge, resolve, and waive a finding', async () => {
    const ack = await findingService.acknowledgeFinding('find-100', {
      acknowledgedBy: 'Teacher Alice',
      notes: 'Reviewing',
    });
    expect(ack.status).toBe('ACKNOWLEDGED');

    const res = await findingService.resolveFinding('find-100', {
      resolvedBy: 'Teacher Alice',
      resolutionNotes: 'Fixed objectives',
    });
    expect(res.status).toBe('RESOLVED');

    const waived = await findingService.waiveFinding('find-100', {
      waivedBy: 'Admin Bob',
      reason: 'Course is experimental',
      policy: 'EXP-PILOT-2026',
      expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      scope: 'STANDARD',
    });
    expect(waived.status).toBe('WAIVED');
  });
});
