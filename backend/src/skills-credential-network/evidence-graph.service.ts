import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  SkillEvidence,
  SkillEvidenceType,
  EvidenceValidityStatus,
  EvidenceQualityMetadata,
  AiAssistanceDisclosure,
  EvidenceLineageRecord,
} from './n19-types';

@Injectable()
export class EvidenceGraphService {
  private readonly logger = new Logger(EvidenceGraphService.name);

  // In-memory ledger of SkillEvidence: key = evidenceId
  private readonly evidenceLedger = new Map<string, SkillEvidence>();

  // In-memory processed evidence hashes to prevent duplicate submissions
  private readonly processedHashes = new Set<string>();

  // In-memory lineage records: key = lineageId
  private readonly lineageLedger = new Map<string, EvidenceLineageRecord>();

  constructor() {
    this.seedDefaultEvidence();
  }

  private seedDefaultEvidence(): void {
    const defaultEvidence: SkillEvidence = {
      evidenceId: 'EVID-MATH-CALC-001',
      learnerId: 'STUDENT-201',
      skillId: 'SKILL-MATH-CALC-DIFF',
      evidenceType: 'TRANSFER_TASK',
      sourceId: 'ASSESS-CALC-FINAL-2026',
      issuerId: 'ISSUER-DPS-DELHI',
      achievedAt: '2026-09-12T14:30:00Z',
      assessmentMethod: 'PROCTORED_TRANSFER_PROBLEM_SET',
      score: 92,
      level: 'ADVANCED',
      validityStatus: 'VALID',
      evidenceVersion: '1.0.0',
      qualityMetadata: {
        validityScore: 0.95,
        recencyHalfLifeDays: 180,
        independenceRating: 0.90,
        assessmentRigorIndex: 0.88,
        issuerTrustScore: 0.92,
      },
      aiAssistanceDisclosure: {
        aiAssisted: false,
        assistanceType: 'NONE',
        contributionPercentage: 0,
      },
      provenanceHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };

    this.evidenceLedger.set(defaultEvidence.evidenceId, defaultEvidence);
    this.processedHashes.add(defaultEvidence.provenanceHash);

    const defaultLineage: EvidenceLineageRecord = {
      lineageId: 'LIN-CALC-001',
      learnerId: 'STUDENT-201',
      skillId: 'SKILL-MATH-CALC-DIFF',
      activityId: 'ACT-CALC-CHAIN-RULE-PRACTICE',
      attemptId: 'ATT-98210-A',
      assessmentId: 'ASSESS-CALC-FINAL-2026',
      resultScore: 92,
      evidenceId: 'EVID-MATH-CALC-001',
      timestamp: '2026-09-12T14:30:00Z',
    };
    this.lineageLedger.set(defaultLineage.lineageId, defaultLineage);
  }

  // --- EVIDENCE MANAGEMENT API ---

  getEvidence(evidenceId: string): SkillEvidence | undefined {
    return this.evidenceLedger.get(evidenceId);
  }

  getEvidenceByLearner(learnerId: string): SkillEvidence[] {
    return Array.from(this.evidenceLedger.values()).filter((e) => e.learnerId === learnerId);
  }

  getEvidenceBySkill(skillId: string): SkillEvidence[] {
    return Array.from(this.evidenceLedger.values()).filter((e) => e.skillId === skillId);
  }

  /**
   * Ingests a new skill evidence item with quality scoring, AI disclosure, and anti-surveillance verification.
   */
  recordEvidence(
    evidence: Omit<SkillEvidence, 'evidenceId' | 'provenanceHash'> & {
      surveillanceUsed?: boolean;
      emotionDetectionUsed?: boolean;
    },
  ): SkillEvidence {
    // Anti-Surveillance Invariant (Clause N19.20): Reject continuous webcam surveillance or emotion tracking
    if (evidence.surveillanceUsed || evidence.emotionDetectionUsed) {
      throw new BadRequestException(
        'Anti-Surveillance Invariant Violation: YOUVA strictly prohibits continuous webcam surveillance or emotion detection as credential evidence.',
      );
    }

    const payload = `${evidence.learnerId}:${evidence.skillId}:${evidence.evidenceType}:${evidence.score}:${evidence.achievedAt}`;
    const hash = `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;

    // Duplicate Rejection Invariant
    if (this.processedHashes.has(hash)) {
      this.logger.warn(`[EVIDENCE-DUPLICATE] Evidence hash ${hash} already exists; rejecting duplicate.`);
      throw new BadRequestException(`Duplicate evidence submission detected: ${hash}`);
    }

    const evidenceId = `EVID-${Date.now().toString(36).toUpperCase()}`;

    const record: SkillEvidence = {
      evidenceId,
      learnerId: evidence.learnerId,
      skillId: evidence.skillId,
      evidenceType: evidence.evidenceType,
      sourceId: evidence.sourceId,
      issuerId: evidence.issuerId,
      achievedAt: evidence.achievedAt,
      assessmentMethod: evidence.assessmentMethod,
      score: evidence.score,
      level: evidence.level,
      validityStatus: evidence.validityStatus || 'VALID',
      evidenceVersion: evidence.evidenceVersion || '1.0.0',
      qualityMetadata: evidence.qualityMetadata,
      aiAssistanceDisclosure: evidence.aiAssistanceDisclosure || {
        aiAssisted: false,
        assistanceType: 'NONE',
        contributionPercentage: 0,
      },
      provenanceHash: hash,
    };

    this.processedHashes.add(hash);
    this.evidenceLedger.set(evidenceId, record);
    this.logger.log(`[EVIDENCE-INGESTED] Ingested evidence ${evidenceId} for learner ${record.learnerId} on skill ${record.skillId}`);

    return record;
  }

  /**
   * Records immutable evidence lineage (Clause N19.22):
   * Activity -> Attempt -> Assessment -> Result -> Evidence -> Skill -> Credential
   */
  recordLineage(lineage: Omit<EvidenceLineageRecord, 'lineageId' | 'timestamp'>): EvidenceLineageRecord {
    const lineageId = `LIN-${Date.now().toString(36).toUpperCase()}`;
    const record: EvidenceLineageRecord = {
      lineageId,
      ...lineage,
      timestamp: new Date().toISOString(),
    };

    this.lineageLedger.set(lineageId, record);
    this.logger.log(`[LINEAGE-RECORDED] Recorded lineage ${lineageId} for evidence ${lineage.evidenceId}`);
    return record;
  }

  getLineageByEvidence(evidenceId: string): EvidenceLineageRecord | undefined {
    return Array.from(this.lineageLedger.values()).find((l) => l.evidenceId === evidenceId);
  }

  /**
   * Updates evidence validity status (e.g. INVALIDATED upon academic integrity finding).
   */
  setEvidenceValidityStatus(evidenceId: string, status: EvidenceValidityStatus): SkillEvidence {
    const evidence = this.evidenceLedger.get(evidenceId);
    if (!evidence) throw new NotFoundException(`Evidence ${evidenceId} not found`);

    evidence.validityStatus = status;
    this.logger.log(`[EVIDENCE-STATUS] Evidence ${evidenceId} validity status set to ${status}`);
    return evidence;
  }
}
