import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  KnowledgeNode,
  EvidenceResponsiveCurriculum,
  CapabilityTrendSignal,
  CapabilityValidator,
  NegativeEvidenceRecord,
  SafetyKillSwitch,
  KillSwitchSubsystem,
} from './n23-types';
import * as crypto from 'crypto';

@Injectable()
export class KnowledgeNetworkCurriculumService {
  private readonly knowledgeNodes = new Map<string, KnowledgeNode>();
  private readonly curricula = new Map<string, EvidenceResponsiveCurriculum>();
  private readonly trendSignals = new Map<string, CapabilityTrendSignal>();
  private readonly validators = new Map<string, CapabilityValidator>();
  private readonly negativeEvidence = new Map<string, NegativeEvidenceRecord>();
  private readonly killSwitches = new Map<KillSwitchSubsystem, SafetyKillSwitch>();

  constructor() {
    this.initializeKillSwitches();
    this.seedInitialData();
  }

  // --- 1. Knowledge Network & Explicit Conflict Resolution (Clauses N23.40–N23.44) ---

  addKnowledgeNode(data: Partial<KnowledgeNode>): KnowledgeNode {
    if (!data.title || !data.type || !data.author) {
      throw new BadRequestException('title, type, and author are required');
    }

    const nodeId = data.nodeId || `kn_${crypto.randomBytes(8).toString('hex')}`;
    const node: KnowledgeNode = {
      nodeId,
      title: data.title,
      type: data.type,
      confidenceStatus: data.confidenceStatus || 'SUPPORTED',
      author: data.author,
      version: data.version || '1.0',
      conflictingNodeIds: data.conflictingNodeIds || [],
      evidenceUris: data.evidenceUris || [],
      updatedAt: new Date().toISOString(),
    };

    this.knowledgeNodes.set(nodeId, node);
    return node;
  }

  flagKnowledgeConflict(nodeId1: string, nodeId2: string): void {
    const n1 = this.knowledgeNodes.get(nodeId1);
    const n2 = this.knowledgeNodes.get(nodeId2);
    if (!n1 || !n2) {
      throw new NotFoundException('Both knowledge nodes must exist to flag conflict');
    }

    if (!n1.conflictingNodeIds.includes(nodeId2)) n1.conflictingNodeIds.push(nodeId2);
    if (!n2.conflictingNodeIds.includes(nodeId1)) n2.conflictingNodeIds.push(nodeId1);

    n1.confidenceStatus = 'DISPUTED';
    n2.confidenceStatus = 'DISPUTED';
  }

  resolveKnowledgeConflict(
    nodeId1: string,
    nodeId2: string,
    resolvedStatus: 'SUPPORTED' | 'PROBABLE' | 'OUTDATED',
    humanRationale: string,
  ): void {
    const n1 = this.knowledgeNodes.get(nodeId1);
    const n2 = this.knowledgeNodes.get(nodeId2);
    if (!n1 || !n2) throw new NotFoundException('Nodes not found');

    n1.confidenceStatus = resolvedStatus;
    n2.confidenceStatus = resolvedStatus === 'SUPPORTED' ? 'OUTDATED' : resolvedStatus;
    n1.updatedAt = new Date().toISOString();
    n2.updatedAt = new Date().toISOString();
  }

  listKnowledgeNodes(): KnowledgeNode[] {
    return Array.from(this.knowledgeNodes.values());
  }

  // --- 2. Evidence-Responsive Curriculum (Clauses N23.47–N23.50) ---

  updateCurriculum(
    curriculumId: string,
    patch: Partial<EvidenceResponsiveCurriculum>,
    humanAuthority?: string,
  ): EvidenceResponsiveCurriculum {
    const curr = this.curricula.get(curriculumId);
    if (!curr) throw new NotFoundException(`Curriculum ${curriculumId} not found`);

    // Invariant N23.48: Human curriculum authorities approve consequential changes
    if (patch.status === 'APPROVED' || patch.status === 'ACTIVE') {
      if (!humanAuthority && !patch.approvedByHumanAuthority) {
        throw new ForbiddenException(
          'Consequential curriculum activation requires explicit human authority approval under YOUVA-N23-CHARTER-2026',
        );
      }
    }

    const updated: EvidenceResponsiveCurriculum = {
      ...curr,
      ...patch,
      approvedByHumanAuthority: humanAuthority || patch.approvedByHumanAuthority || curr.approvedByHumanAuthority,
      updatedAt: new Date().toISOString(),
    };

    this.curricula.set(curriculumId, updated);
    return updated;
  }

  listCurricula(): EvidenceResponsiveCurriculum[] {
    return Array.from(this.curricula.values());
  }

  // --- 3. Global Capability Trend Intelligence (Clauses N23.51–N23.57) ---

  recordTrendSignal(signal: Partial<CapabilityTrendSignal>): CapabilityTrendSignal {
    if (!signal.capabilityName || !signal.timePeriod || !signal.geographicScope) {
      throw new BadRequestException('capabilityName, timePeriod, and geographicScope are required');
    }

    const trendId = signal.trendId || `trend_${crypto.randomBytes(8).toString('hex')}`;
    const record: CapabilityTrendSignal = {
      trendId,
      capabilityName: signal.capabilityName,
      sampleSize: signal.sampleSize || 100,
      timePeriod: signal.timePeriod,
      geographicScope: signal.geographicScope,
      confidence: signal.confidence !== undefined ? signal.confidence : 0.85,
      demandDirection: signal.demandDirection || 'STABLE',
      sourceInstitutions: signal.sourceInstitutions || ['GLOBAL_OBSERVATORY'],
      updatedAt: new Date().toISOString(),
    };

    this.trendSignals.set(trendId, record);
    return record;
  }

  listTrendSignals(): CapabilityTrendSignal[] {
    return Array.from(this.trendSignals.values());
  }

  // --- 4. Capability Validators Registry (Clauses N23.111–N23.115) ---

  registerValidator(val: Partial<CapabilityValidator>): CapabilityValidator {
    if (!val.organizationId || !val.validatorType || !val.scopes) {
      throw new BadRequestException('organizationId, validatorType, and scopes are required');
    }

    const validatorId = val.validatorId || `val_${crypto.randomBytes(8).toString('hex')}`;
    const validator: CapabilityValidator = {
      validatorId,
      organizationId: val.organizationId,
      validatorType: val.validatorType,
      scopes: val.scopes,
      status: val.status || 'ACTIVE',
    };

    this.validators.set(validatorId, validator);
    return validator;
  }

  verifyValidatorScope(validatorId: string, requiredScope: string): boolean {
    const val = this.validators.get(validatorId);
    if (!val || val.status !== 'ACTIVE') return false;
    return val.scopes.includes('*') || val.scopes.some((s) => s.toLowerCase() === requiredScope.toLowerCase());
  }

  // --- 5. Negative Evidence Registry (Clauses N23.183–N23.184) ---

  recordNegativeEvidence(data: Partial<NegativeEvidenceRecord>): NegativeEvidenceRecord {
    if (!data.interventionType || !data.observedOutcome || !data.failureMode) {
      throw new BadRequestException('interventionType, observedOutcome, and failureMode are required');
    }

    const recordId = data.recordId || `neg_${crypto.randomBytes(8).toString('hex')}`;
    const record: NegativeEvidenceRecord = {
      recordId,
      interventionType: data.interventionType,
      observedOutcome: data.observedOutcome,
      failureMode: data.failureMode,
      mitigationRecommended: data.mitigationRecommended || 'Re-evaluate prerequisite sequence',
      recordedAt: new Date().toISOString(),
    };

    this.negativeEvidence.set(recordId, record);
    return record;
  }

  listNegativeEvidence(): NegativeEvidenceRecord[] {
    return Array.from(this.negativeEvidence.values());
  }

  // --- 6. Scoped Safety Kill Switches (Clauses N23.188–N23.189) ---

  tripKillSwitch(
    subsystem: KillSwitchSubsystem,
    trippedBy: string,
    reason: string,
  ): SafetyKillSwitch {
    const ks: SafetyKillSwitch = {
      subsystem,
      isTripped: true,
      trippedBy,
      reason,
      trippedAt: new Date().toISOString(),
    };
    this.killSwitches.set(subsystem, ks);
    return ks;
  }

  restoreKillSwitch(subsystem: KillSwitchSubsystem, restoredBy: string): SafetyKillSwitch {
    const ks: SafetyKillSwitch = {
      subsystem,
      isTripped: false,
      trippedBy: undefined,
      reason: undefined,
      trippedAt: undefined,
    };
    this.killSwitches.set(subsystem, ks);
    return ks;
  }

  isSubsystemActive(subsystem: KillSwitchSubsystem): boolean {
    const ks = this.killSwitches.get(subsystem);
    return !ks?.isTripped;
  }

  private initializeKillSwitches(): void {
    const subsystems: KillSwitchSubsystem[] = [
      'OPPORTUNITY_NETWORK',
      'COMMUNITY_FEATURES',
      'EVIDENCE_EXCHANGE',
      'EXTERNAL_INTEGRATIONS',
      'AI_RECOMMENDATIONS',
      'GLOBAL_EMERGENCY',
    ];
    for (const sub of subsystems) {
      this.killSwitches.set(sub, { subsystem: sub, isTripped: false });
    }
  }

  private seedInitialData(): void {
    this.addKnowledgeNode({
      nodeId: 'kn_bkt_pedagogy_01',
      title: 'Bayesian Knowledge Tracing with Credibility Bounds',
      type: 'RESEARCH',
      confidenceStatus: 'SUPPORTED',
      author: 'YOUVA Learning Science Lab',
      version: '2.0',
      evidenceUris: ['https://research.youva.org/bkt-2.0.pdf'],
    });

    this.curricula.set('curr_ai_foundations_v1', {
      curriculumId: 'curr_ai_foundations_v1',
      version: '1.2',
      title: 'High School AI Foundations & Ethics',
      status: 'ACTIVE',
      changeRationale: 'Updated transformer interpretability section based on N18 research',
      approvedByHumanAuthority: 'ACADEMIC_COUNCIL_DELHI',
      historicalLinkedCohorts: ['cohort_2025_grade11', 'cohort_2026_grade11'],
      updatedAt: new Date().toISOString(),
    });

    this.recordTrendSignal({
      trendId: 'trend_quantum_info_01',
      capabilityName: 'Quantum Information & Qubits',
      sampleSize: 1240,
      timePeriod: '2025-2026',
      geographicScope: 'GLOBAL',
      confidence: 0.88,
      demandDirection: 'INCREASING',
      sourceInstitutions: ['MIT', 'Cambridge', 'IIT_Madras'],
    });

    this.registerValidator({
      validatorId: 'val_delhi_univ_cs',
      organizationId: 'org_delhi_univ',
      validatorType: 'INSTITUTION',
      scopes: ['ONT_CS_ALGORITHMS_CORE', 'ONT_CS_SYSTEMS'],
      status: 'ACTIVE',
    });

    this.recordNegativeEvidence({
      recordId: 'neg_unsupervised_llm_scaffolding',
      interventionType: 'Unconstrained LLM code synthesis in introductory lab',
      observedOutcome: '42% decrease in independent transfer capability on AI removal test',
      failureMode: 'UNEXPECTED_COGNITIVE_OVERLOAD',
      mitigationRecommended: 'Enforce 5-tier progressive hints and require manual syntax entry before AI autocomplete',
    });
  }
}
