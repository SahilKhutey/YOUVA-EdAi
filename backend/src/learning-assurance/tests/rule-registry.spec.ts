import { RuleRegistryService } from '../rules/registry/rule-registry.service';

describe('RuleRegistryService (LKC-14)', () => {
  let service: RuleRegistryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      assuranceRule: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new RuleRegistryService(mockPrisma);
  });

  it('should list default rules across all 9 assurance domains', async () => {
    const rules = await service.listRules();
    expect(rules.length).toBeGreaterThanOrEqual(14);

    const domains = new Set(rules.map((r) => r.domain));
    expect(domains.has('KNOWLEDGE')).toBe(true);
    expect(domains.has('LEARNING')).toBe(true);
    expect(domains.has('ASSESSMENT')).toBe(true);
    expect(domains.has('AI')).toBe(true);
    expect(domains.has('PERSONALIZATION')).toBe(true);
    expect(domains.has('ORCHESTRATION')).toBe(true);
    expect(domains.has('DATA')).toBe(true);
    expect(domains.has('SECURITY')).toBe(true);
    expect(domains.has('OPERATIONS')).toBe(true);
  });

  it('should filter rules by domain', async () => {
    const secRules = await service.listRules('SECURITY');
    expect(secRules.length).toBeGreaterThanOrEqual(2);
    expect(secRules.every((r) => r.domain === 'SECURITY')).toBe(true);
  });

  it('should retrieve rule by ID and version', async () => {
    const rule = await service.getRule('KNOW-001', '1.0.0');
    expect(rule).toBeDefined();
    expect(rule?.id).toBe('KNOW-001');
    expect(rule?.severity).toBe('HIGH');
    expect(rule?.action).toBe('WARN');
  });

  it('should register or update a custom assurance rule', async () => {
    const customRule = {
      id: 'CUSTOM-001',
      version: '1.0.0',
      domain: 'KNOWLEDGE' as const,
      severity: 'MEDIUM' as const,
      enabled: true,
      definition: { check: 'READABILITY_SCORE' },
      action: 'WARN' as const,
      effectiveFrom: new Date(),
      createdAt: new Date(),
    };

    mockPrisma.assuranceRule.upsert.mockResolvedValue({
      ...customRule,
      createdAt: new Date(),
    });

    const registered = await service.registerRule(customRule);
    expect(registered.id).toBe('CUSTOM-001');
    expect(mockPrisma.assuranceRule.upsert).toHaveBeenCalled();
  });
});
