import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  EvidenceClaimRecord,
  EvidenceHierarchyLevel,
  NegativeEvidenceLedgerRecord,
  NegativeIncidentType,
} from './n-infinity-types';
import * as crypto from 'crypto';

export const EVIDENCE_HIERARCHY_LEVELS: EvidenceHierarchyLevel[] = [
  'TESTED',
  'OBSERVED',
  'PILOT_VALIDATED',
  'REPLICATED',
  'INDEPENDENTLY_VERIFIED',
  'EXTERNALLY_CORROBORATED',
  'LONGITUDINALLY_VALIDATED',
];

export const NEGATIVE_INCIDENT_TYPES: NegativeIncidentType[] = [
  'FAILED_INTERVENTION',
  'SAFETY_INCIDENT',
  'MODEL_FAILURE',
  'FALSE_POSITIVE',
  'FALSE_NEGATIVE',
  'POOR_RECOMMENDATION',
  'LEARNING_REGRESSION',
  'INTEGRATION_FAILURE',
  'MOBILITY_FAILURE',
  'EQUITY_PROBLEM',
];

@Injectable()
export class EvidenceLedgerNegativeRegistryService {
  private readonly claims = new Map<string, EvidenceClaimRecord>();
  private readonly negativeLedger: NegativeEvidenceLedgerRecord[] = [];

  constructor() {
    // Seed initial benchmark longitudinal evidence claims
    this.submitEvidenceClaim({
      claim: 'Spaced retrieval practice increases 180-day retention by 34% compared to massed practice',
      source: 'YOUVA Longitudinal Cognitive Trial 2024-2026',
      level: 'LONGITUDINALLY_VALIDATED',
      methodology: 'Multi-site randomized controlled trial across 12,000 learners',
      populationSize: 12000,
      confidence: 0.98,
      limitations: 'Limited to STEM secondary curriculum domains',
      owner: 'YOUVA Learning Science Institute',
      revalidationDueDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    });

    // Seed initial transparent negative evidence record
    this.recordNegativeIncident({
      incidentType: 'FALSE_POSITIVE',
      description: 'Initial automated mastery heuristic misclassified guess streak as conceptual mastery in physics mechanics',
      rootCause: 'Lack of multi-format question triangulation in v1.0 mastery detector',
      mitigationPreventativeAction: 'Mandated 3-way triangulation (concept, transfer, explanation) before mastery confirmation',
    });
  }

  // ==========================================
  // 1. 7-LEVEL EVIDENCE HIERARCHY ENGINE
  // Clauses N∞.8, N∞.26–N∞.27
  // ==========================================

  submitEvidenceClaim(
    claimData: Omit<EvidenceClaimRecord, 'claimId' | 'verified' | 'updatedAt' | 'revalidationDueDate'> & {
      revalidationDueDate?: string;
    },
  ): EvidenceClaimRecord {
    if (!claimData.claim || !claimData.claim.trim()) {
      throw new BadRequestException('Claim statement is required');
    }
    if (!claimData.source || !claimData.source.trim()) {
      throw new BadRequestException('Evidence source is required');
    }
    if (!EVIDENCE_HIERARCHY_LEVELS.includes(claimData.level)) {
      throw new BadRequestException(`Invalid evidence hierarchy level: ${claimData.level}`);
    }
    if (
      typeof claimData.confidence !== 'number' ||
      claimData.confidence < 0 ||
      claimData.confidence > 1.0
    ) {
      throw new BadRequestException('Confidence must be a number between 0.0 and 1.0');
    }
    if (typeof claimData.populationSize !== 'number' || claimData.populationSize < 0) {
      throw new BadRequestException('Population size must be a non-negative number');
    }

    const claimId = `claim_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const record: EvidenceClaimRecord = {
      claimId,
      claim: claimData.claim.trim(),
      source: claimData.source.trim(),
      level: claimData.level,
      methodology: claimData.methodology || 'Empirical Observation',
      populationSize: claimData.populationSize,
      confidence: claimData.confidence,
      limitations: claimData.limitations || 'None declared',
      owner: claimData.owner || 'YOUVA Research Governance',
      verified: false,
      revalidationDueDate: claimData.revalidationDueDate || new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      updatedAt: now,
    };

    this.claims.set(claimId, record);
    return record;
  }

  verifyEvidenceClaim(claimId: string, verifier: string, verified: boolean): EvidenceClaimRecord {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new NotFoundException(`Evidence claim ${claimId} not found`);
    }
    if (!verifier || !verifier.trim()) {
      throw new BadRequestException('Verifier identity is required');
    }

    claim.verified = verified;
    claim.updatedAt = new Date().toISOString();
    this.claims.set(claimId, claim);
    return claim;
  }

  getEvidenceClaim(claimId: string): EvidenceClaimRecord {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new NotFoundException(`Evidence claim ${claimId} not found`);
    }
    return claim;
  }

  queryClaimsByLevel(level: EvidenceHierarchyLevel): EvidenceClaimRecord[] {
    return Array.from(this.claims.values()).filter((c) => c.level === level);
  }

  getAllEvidenceClaims(): EvidenceClaimRecord[] {
    return Array.from(this.claims.values());
  }

  checkRevalidationRequirements(): Array<{
    claimId: string;
    claim: string;
    level: EvidenceHierarchyLevel;
    revalidationDueDate: string;
    due: boolean;
    daysRemaining: number;
  }> {
    const now = Date.now();
    return Array.from(this.claims.values()).map((c) => {
      const dueDate = new Date(c.revalidationDueDate).getTime();
      const diffDays = Math.ceil((dueDate - now) / (1000 * 3600 * 24));
      return {
        claimId: c.claimId,
        claim: c.claim,
        level: c.level,
        revalidationDueDate: c.revalidationDueDate,
        due: diffDays <= 0,
        daysRemaining: diffDays,
      };
    });
  }

  // ==========================================
  // 2. NEGATIVE EVIDENCE & INCIDENT REGISTRY
  // Clauses N∞.27, N∞.30
  // ==========================================

  recordNegativeIncident(
    data: Omit<NegativeEvidenceLedgerRecord, 'recordId' | 'recordedAt'>,
  ): NegativeEvidenceLedgerRecord {
    if (!NEGATIVE_INCIDENT_TYPES.includes(data.incidentType)) {
      throw new BadRequestException(`Invalid negative incident type: ${data.incidentType}`);
    }
    if (!data.description || !data.description.trim()) {
      throw new BadRequestException('Incident description is required');
    }
    if (!data.rootCause || !data.rootCause.trim()) {
      throw new BadRequestException('Root cause analysis is required');
    }
    if (!data.mitigationPreventativeAction || !data.mitigationPreventativeAction.trim()) {
      throw new BadRequestException('Mitigation and preventative action is required');
    }

    const recordId = `neg_${crypto.randomBytes(8).toString('hex')}`;
    const record: NegativeEvidenceLedgerRecord = {
      recordId,
      incidentType: data.incidentType,
      description: data.description.trim(),
      rootCause: data.rootCause.trim(),
      mitigationPreventativeAction: data.mitigationPreventativeAction.trim(),
      recordedAt: new Date().toISOString(),
    };

    // Immutable append-only ledger
    this.negativeLedger.push(record);
    return record;
  }

  getNegativeIncident(recordId: string): NegativeEvidenceLedgerRecord {
    const found = this.negativeLedger.find((r) => r.recordId === recordId);
    if (!found) {
      throw new NotFoundException(`Negative evidence record ${recordId} not found`);
    }
    return found;
  }

  listNegativeIncidents(typeFilter?: NegativeIncidentType): NegativeEvidenceLedgerRecord[] {
    if (typeFilter) {
      return this.negativeLedger.filter((r) => r.incidentType === typeFilter);
    }
    return [...this.negativeLedger];
  }

  getNegativeIncidentsCountByType(): Record<NegativeIncidentType, number> {
    const counts: Record<NegativeIncidentType, number> = {
      FAILED_INTERVENTION: 0,
      SAFETY_INCIDENT: 0,
      MODEL_FAILURE: 0,
      FALSE_POSITIVE: 0,
      FALSE_NEGATIVE: 0,
      POOR_RECOMMENDATION: 0,
      LEARNING_REGRESSION: 0,
      INTEGRATION_FAILURE: 0,
      MOBILITY_FAILURE: 0,
      EQUITY_PROBLEM: 0,
    };

    for (const r of this.negativeLedger) {
      counts[r.incidentType] = (counts[r.incidentType] || 0) + 1;
    }

    return counts;
  }
}
