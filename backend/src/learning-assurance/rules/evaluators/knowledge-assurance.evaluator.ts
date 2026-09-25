import { Injectable, Logger } from '@nestjs/common';
import { QualityCheckResult } from '../../domain/assurance.types';

@Injectable()
export class KnowledgeAssuranceEvaluator {
  private readonly logger = new Logger(KnowledgeAssuranceEvaluator.name);

  evaluate(knowledge: {
    id: string;
    tenantId: string;
    title?: string;
    objectives?: string[];
    isPublished?: boolean;
    modifyingPublished?: boolean;
    targetTenantId?: string;
    hasOrphanRef?: boolean;
  }): QualityCheckResult[] {
    const checks: QualityCheckResult[] = [];

    // 1. Objective Alignment (KNOW-001)
    if (!knowledge.objectives || knowledge.objectives.length === 0) {
      checks.push({
        checkId: 'KNOW-001',
        category: 'OBJECTIVE_ALIGNMENT',
        status: 'WARNING',
        message: `Knowledge object '${knowledge.id}' declares no learning objectives.`,
        evidenceIds: [knowledge.id],
        severity: 'HIGH',
      });
    } else {
      checks.push({
        checkId: 'KNOW-001',
        category: 'OBJECTIVE_ALIGNMENT',
        status: 'PASS',
        message: 'Learning objectives declared and aligned.',
        evidenceIds: [knowledge.id],
        severity: 'LOW',
      });
    }

    // 2. Tenant Ownership (KNOW-002)
    if (knowledge.targetTenantId && knowledge.targetTenantId !== knowledge.tenantId) {
      checks.push({
        checkId: 'KNOW-002',
        category: 'TENANT_OWNERSHIP',
        status: 'FAIL',
        message: `Cross-tenant content reference denied between '${knowledge.tenantId}' and '${knowledge.targetTenantId}'.`,
        evidenceIds: [knowledge.id],
        severity: 'CRITICAL',
      });
    } else {
      checks.push({
        checkId: 'KNOW-002',
        category: 'TENANT_OWNERSHIP',
        status: 'PASS',
        message: 'Tenant ownership verified.',
        evidenceIds: [knowledge.id],
        severity: 'LOW',
      });
    }

    // 3. Version Immutability (KNOW-003)
    if (knowledge.modifyingPublished) {
      checks.push({
        checkId: 'KNOW-003',
        category: 'VERSION_IMMUTABILITY',
        status: 'FAIL',
        message: `Attempted direct modification of published immutable version for knowledge '${knowledge.id}'.`,
        evidenceIds: [knowledge.id],
        severity: 'CRITICAL',
      });
    } else {
      checks.push({
        checkId: 'KNOW-003',
        category: 'VERSION_IMMUTABILITY',
        status: 'PASS',
        message: 'Version immutability respected.',
        evidenceIds: [knowledge.id],
        severity: 'LOW',
      });
    }

    // 4. Orphan Reference check
    if (knowledge.hasOrphanRef) {
      checks.push({
        checkId: 'DATA-001',
        category: 'RELATIONSHIP_INTEGRITY',
        status: 'WARNING',
        message: `Knowledge '${knowledge.id}' has unresolved prerequisite or child references.`,
        evidenceIds: [knowledge.id],
        severity: 'HIGH',
      });
    }

    return checks;
  }
}
