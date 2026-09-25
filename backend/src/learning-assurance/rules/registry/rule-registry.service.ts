import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AssuranceDomain,
  AssuranceRuleDto,
  FindingSeverity,
} from '../../domain/assurance.types';

@Injectable()
export class RuleRegistryService implements OnModuleInit {
  private readonly logger = new Logger(RuleRegistryService.name);

  private readonly defaultRules: AssuranceRuleDto[] = [
    {
      id: 'KNOW-001',
      version: '1.0.0',
      domain: 'KNOWLEDGE',
      severity: 'HIGH',
      enabled: true,
      definition: { check: 'OBJECTIVE_ALIGNMENT', description: 'Knowledge object must declare at least one verified learning objective.' },
      action: 'WARN',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'KNOW-002',
      version: '1.0.0',
      domain: 'KNOWLEDGE',
      severity: 'CRITICAL',
      enabled: true,
      definition: { check: 'TENANT_OWNERSHIP', description: 'Cross-tenant content references prohibited without explicit federation.' },
      action: 'BLOCK',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'KNOW-003',
      version: '1.0.0',
      domain: 'KNOWLEDGE',
      severity: 'CRITICAL',
      enabled: true,
      definition: { check: 'VERSION_IMMUTABILITY', description: 'Published knowledge versions cannot be mutated directly.' },
      action: 'BLOCK',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'LEARN-001',
      version: '1.0.0',
      domain: 'LEARNING',
      severity: 'HIGH',
      enabled: true,
      definition: { check: 'STATE_FRESHNESS', description: 'Decisions must not rely on expired or stale learner state (> 7 days).' },
      action: 'WARN',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'ASSESS-001',
      version: '1.0.0',
      domain: 'ASSESSMENT',
      severity: 'HIGH',
      enabled: true,
      definition: { check: 'OBJECTIVE_COVERAGE', description: 'Assessment questions must map to objectives represented in the lesson.' },
      action: 'WARN',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'ASSESS-002',
      version: '1.0.0',
      domain: 'ASSESSMENT',
      severity: 'CRITICAL',
      enabled: true,
      definition: { check: 'ANSWER_INTEGRITY', description: 'Question must have exactly one unambiguously correct answer.' },
      action: 'BLOCK',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'AI-001',
      version: '1.0.0',
      domain: 'AI',
      severity: 'HIGH',
      enabled: true,
      definition: { check: 'GROUNDING_VERIFICATION', description: 'AI generated explanation must be grounded in canonical knowledge references.' },
      action: 'WARN',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'AI-002',
      version: '1.0.0',
      domain: 'AI',
      severity: 'CRITICAL',
      enabled: true,
      definition: { check: 'HUMAN_APPROVAL_GATE', description: 'AI generated educational content must receive human review before publishing.' },
      action: 'BLOCK',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'PERS-001',
      version: '1.0.0',
      domain: 'PERSONALIZATION',
      severity: 'MEDIUM',
      enabled: true,
      definition: { check: 'REPETITION_LOOP', description: 'Detects repeated identical recommendations or remediation loops.' },
      action: 'WARN',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'ORCH-001',
      version: '1.0.0',
      domain: 'ORCHESTRATION',
      severity: 'CRITICAL',
      enabled: true,
      definition: { check: 'SCOPE_ESCALATION', description: 'Orchestrations at learner/class scope cannot mutate tenant or course entities.' },
      action: 'BLOCK',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'DATA-001',
      version: '1.0.0',
      domain: 'DATA',
      severity: 'HIGH',
      enabled: true,
      definition: { check: 'ORPHAN_REFERENCE', description: 'Foreign references must resolve to valid existing entities.' },
      action: 'WARN',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'SEC-001',
      version: '1.0.0',
      domain: 'SECURITY',
      severity: 'CRITICAL',
      enabled: true,
      definition: { check: 'TENANT_ISOLATION', description: 'Actor tenant must strictly match target entity tenant.' },
      action: 'BLOCK',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'SEC-002',
      version: '1.0.0',
      domain: 'SECURITY',
      severity: 'HIGH',
      enabled: true,
      definition: { check: 'AUDIT_COMPLETENESS', description: 'Sensitive state mutations must produce auditable provenance traces.' },
      action: 'ESCALATE',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
    {
      id: 'OPS-001',
      version: '1.0.0',
      domain: 'OPERATIONS',
      severity: 'MEDIUM',
      enabled: true,
      definition: { check: 'SLA_FRESHNESS', description: 'Derived analytics must not exceed configured SLA freshness window.' },
      action: 'WARN',
      effectiveFrom: new Date('2026-01-01'),
      createdAt: new Date(),
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultRules();
  }

  private async seedDefaultRules() {
    for (const rule of this.defaultRules) {
      try {
        const existing = await this.prisma.assuranceRule.findUnique({
          where: {
            id_version: {
              id: rule.id,
              version: rule.version,
            },
          },
        });

        if (!existing) {
          await this.prisma.assuranceRule.create({
            data: {
              id: rule.id,
              version: rule.version,
              domain: rule.domain,
              severity: rule.severity,
              enabled: rule.enabled,
              definition: rule.definition as any,
              action: rule.action,
              effectiveFrom: rule.effectiveFrom,
            },
          });
          this.logger.log(`Seeded assurance rule: ${rule.id}@${rule.version}`);
        }
      } catch (err) {
        this.logger.warn(`Could not seed assurance rule ${rule.id}: ${(err as Error).message}`);
      }
    }
  }

  async getRule(id: string, version = '1.0.0'): Promise<AssuranceRuleDto | null> {
    try {
      const record = await this.prisma.assuranceRule.findUnique({
        where: { id_version: { id, version } },
      });

      if (record) {
        return {
          id: record.id,
          version: record.version,
          domain: record.domain as AssuranceDomain,
          severity: record.severity as FindingSeverity,
          enabled: record.enabled,
          definition: record.definition as Record<string, any>,
          action: record.action as any,
          effectiveFrom: record.effectiveFrom,
          createdAt: record.createdAt,
        };
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch rule ${id} from DB: ${(err as Error).message}. Using fallback.`);
    }

    const fallback = this.defaultRules.find((r) => r.id === id && r.version === version);
    return fallback ?? null;
  }

  async listRules(domain?: AssuranceDomain): Promise<AssuranceRuleDto[]> {
    try {
      const records = await this.prisma.assuranceRule.findMany({
        where: { domain },
        orderBy: { id: 'asc' },
      });

      if (records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          version: r.version,
          domain: r.domain as AssuranceDomain,
          severity: r.severity as FindingSeverity,
          enabled: r.enabled,
          definition: r.definition as Record<string, any>,
          action: r.action as any,
          effectiveFrom: r.effectiveFrom,
          createdAt: r.createdAt,
        }));
      }
    } catch (err) {
      this.logger.warn(`Failed to list rules from DB: ${(err as Error).message}. Returning memory rules.`);
    }

    return this.defaultRules.filter((r) => !domain || r.domain === domain);
  }

  async registerRule(dto: AssuranceRuleDto): Promise<AssuranceRuleDto> {
    const record = await this.prisma.assuranceRule.upsert({
      where: {
        id_version: {
          id: dto.id,
          version: dto.version,
        },
      },
      update: {
        domain: dto.domain,
        severity: dto.severity,
        enabled: dto.enabled,
        definition: dto.definition as any,
        action: dto.action,
        effectiveFrom: dto.effectiveFrom,
      },
      create: {
        id: dto.id,
        version: dto.version,
        domain: dto.domain,
        severity: dto.severity,
        enabled: dto.enabled,
        definition: dto.definition as any,
        action: dto.action,
        effectiveFrom: dto.effectiveFrom,
      },
    });

    return {
      id: record.id,
      version: record.version,
      domain: record.domain as AssuranceDomain,
      severity: record.severity as FindingSeverity,
      enabled: record.enabled,
      definition: record.definition as Record<string, any>,
      action: record.action as any,
      effectiveFrom: record.effectiveFrom,
      createdAt: record.createdAt,
    };
  }
}
