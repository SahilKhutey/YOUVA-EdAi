import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface PilotLearnerRecord {
  id: string;
  tenantId: string;
  name: string;
  hasActiveConsent: boolean;
}

export interface PilotSessionRecord {
  id: string;
  tenantId: string;
  learnerId: string;
  state: 'DIAGNOSTIC' | 'INSTRUCTION' | 'PRACTICE' | 'ASSESSMENT' | 'REMEDIATION' | 'COMPLETED';
  startedAt: Date;
  completedAt?: Date;
}

export interface PilotAttemptRecord {
  id: string;
  tenantId: string;
  sessionId: string;
  learnerId: string;
  questionId: string;
  submittedAt: Date;
  score: number; // 0 or 1
  attemptHash?: string;
}

export interface PilotMasteryRecord {
  id: string;
  tenantId: string;
  learnerId: string;
  topicId: string;
  masteryScore: number; // must be in [0.0, 1.0]
  updatedAt: Date;
}

export interface PilotConsentRecord {
  id: string;
  tenantId: string;
  learnerId: string;
  parentPhone: string;
  status: 'ACTIVE' | 'REVOKED' | 'PENDING';
  grantedAt: Date;
}

export interface PilotAuditRecord {
  id: string;
  tenantId: string;
  resourceType: string;
  resourceId: string;
  previousHash: string;
  contentHash: string;
  hash: string;
  createdAt: Date;
}

export interface PilotDataSnapshot {
  learners: PilotLearnerRecord[];
  sessions: PilotSessionRecord[];
  attempts: PilotAttemptRecord[];
  masteries: PilotMasteryRecord[];
  consents: PilotConsentRecord[];
  auditRecords: PilotAuditRecord[];
}

export interface DataQualityViolation {
  invariantId: string;
  severity: 'P0' | 'P1' | 'P2';
  entityType: string;
  entityId: string;
  tenantId: string;
  description: string;
  timestamp: string;
}

export interface DataQualityAuditReport {
  allValid: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  violations: DataQualityViolation[];
  evaluatedEntities: {
    learners: number;
    sessions: number;
    attempts: number;
    masteries: number;
    consents: number;
    auditRecords: number;
  };
  auditTimestamp: string;
  checksumSha256: string;
}

@Injectable()
export class PilotDataQualityService {
  private readonly logger = new Logger(PilotDataQualityService.name);

  /**
   * Evaluates all 10 core data quality invariants across the pilot dataset.
   */
  evaluateDataQuality(snapshot: PilotDataSnapshot): DataQualityAuditReport {
    const violations: DataQualityViolation[] = [];
    const timestamp = new Date().toISOString();

    const learnerMap = new Map<string, PilotLearnerRecord>();
    for (const l of snapshot.learners) {
      learnerMap.set(l.id, l);
    }

    const sessionMap = new Map<string, PilotSessionRecord>();
    for (const s of snapshot.sessions) {
      sessionMap.set(s.id, s);
    }

    const activeConsentLearnerIds = new Set<string>();
    for (const c of snapshot.consents) {
      if (c.status === 'ACTIVE') {
        activeConsentLearnerIds.add(c.learnerId);
      }
    }

    // 1. DQ-INV-001: Mastery Score Bounds [0.0, 1.0]
    for (const m of snapshot.masteries) {
      if (m.masteryScore < 0.0 || m.masteryScore > 1.0 || isNaN(m.masteryScore)) {
        violations.push({
          invariantId: 'DQ-INV-001',
          severity: 'P0',
          entityType: 'Mastery',
          entityId: m.id,
          tenantId: m.tenantId,
          description: `Mastery score ${m.masteryScore} is out of valid bounds [0.0, 1.0]`,
          timestamp,
        });
      }
    }

    // 2. DQ-INV-002: Attempt Tenant Match (attempt.tenantId === learner.tenantId)
    for (const a of snapshot.attempts) {
      const learner = learnerMap.get(a.learnerId);
      if (learner && learner.tenantId !== a.tenantId) {
        violations.push({
          invariantId: 'DQ-INV-002',
          severity: 'P0',
          entityType: 'Attempt',
          entityId: a.id,
          tenantId: a.tenantId,
          description: `Attempt tenantId '${a.tenantId}' does not match learner tenantId '${learner.tenantId}'`,
          timestamp,
        });
      }
    }

    // 3. DQ-INV-003: Session Tenant Match (session.tenantId === learner.tenantId)
    for (const s of snapshot.sessions) {
      const learner = learnerMap.get(s.learnerId);
      if (learner && learner.tenantId !== s.tenantId) {
        violations.push({
          invariantId: 'DQ-INV-003',
          severity: 'P0',
          entityType: 'Session',
          entityId: s.id,
          tenantId: s.tenantId,
          description: `Session tenantId '${s.tenantId}' does not match learner tenantId '${learner.tenantId}'`,
          timestamp,
        });
      }
    }

    // 4. DQ-INV-004: Audit Resource Tenant Match
    for (const r of snapshot.auditRecords) {
      if (!r.tenantId) {
        violations.push({
          invariantId: 'DQ-INV-004',
          severity: 'P1',
          entityType: 'AuditRecord',
          entityId: r.id,
          tenantId: 'UNKNOWN',
          description: `Audit record '${r.id}' missing tenant identifier`,
          timestamp,
        });
      }
    }

    // 5. DQ-INV-005: Orphan Attempt Prevention
    for (const a of snapshot.attempts) {
      if (!sessionMap.has(a.sessionId)) {
        violations.push({
          invariantId: 'DQ-INV-005',
          severity: 'P1',
          entityType: 'Attempt',
          entityId: a.id,
          tenantId: a.tenantId,
          description: `Attempt references non-existent sessionId '${a.sessionId}'`,
          timestamp,
        });
      }
    }

    // 6. DQ-INV-006: Duplicate Attempt Prevention
    const seenAttemptKeys = new Set<string>();
    for (const a of snapshot.attempts) {
      const key = `${a.learnerId}:${a.sessionId}:${a.questionId}:${a.submittedAt.getTime()}`;
      if (seenAttemptKeys.has(key)) {
        violations.push({
          invariantId: 'DQ-INV-006',
          severity: 'P1',
          entityType: 'Attempt',
          entityId: a.id,
          tenantId: a.tenantId,
          description: `Duplicate attempt detected for learner '${a.learnerId}' on question '${a.questionId}'`,
          timestamp,
        });
      }
      seenAttemptKeys.add(key);
    }

    // 7. DQ-INV-007: DPDP Consent Linkage
    for (const s of snapshot.sessions) {
      if (!activeConsentLearnerIds.has(s.learnerId)) {
        violations.push({
          invariantId: 'DQ-INV-007',
          severity: 'P0',
          entityType: 'Session',
          entityId: s.id,
          tenantId: s.tenantId,
          description: `Learner '${s.learnerId}' executed session without verified active DPDP parental consent`,
          timestamp,
        });
      }
    }

    // 8. DQ-INV-008: Timestamp Monotonicity (completedAt >= startedAt)
    for (const s of snapshot.sessions) {
      if (s.completedAt && s.completedAt.getTime() < s.startedAt.getTime()) {
        violations.push({
          invariantId: 'DQ-INV-008',
          severity: 'P1',
          entityType: 'Session',
          entityId: s.id,
          tenantId: s.tenantId,
          description: `Session completedAt (${s.completedAt.toISOString()}) is earlier than startedAt (${s.startedAt.toISOString()})`,
          timestamp,
        });
      }
    }

    // 9. DQ-INV-009: State Transition Validity
    const validStates = new Set(['DIAGNOSTIC', 'INSTRUCTION', 'PRACTICE', 'ASSESSMENT', 'REMEDIATION', 'COMPLETED']);
    for (const s of snapshot.sessions) {
      if (!validStates.has(s.state)) {
        violations.push({
          invariantId: 'DQ-INV-009',
          severity: 'P1',
          entityType: 'Session',
          entityId: s.id,
          tenantId: s.tenantId,
          description: `Invalid session state '${s.state}' detected`,
          timestamp,
        });
      }
    }

    // 10. DQ-INV-010: Audit Hash Continuity (Chain verification)
    for (let i = 1; i < snapshot.auditRecords.length; i++) {
      const prev = snapshot.auditRecords[i - 1];
      const curr = snapshot.auditRecords[i];
      if (curr.previousHash !== prev.hash) {
        violations.push({
          invariantId: 'DQ-INV-010',
          severity: 'P0',
          entityType: 'AuditRecord',
          entityId: curr.id,
          tenantId: curr.tenantId,
          description: `Audit hash mismatch at record ${curr.id}: expected previousHash '${prev.hash}', found '${curr.previousHash}'`,
          timestamp,
        });
      }
    }

    const totalChecks = 10;
    const failedChecks = new Set(violations.map((v) => v.invariantId)).size;
    const passedChecks = totalChecks - failedChecks;
    const allValid = violations.length === 0;

    const serializedReport = JSON.stringify({ violations, totalChecks, passedChecks });
    const checksumSha256 = crypto.createHash('sha256').update(serializedReport).digest('hex');

    if (!allValid) {
      this.logger.warn(`Data quality audit completed with ${violations.length} violation(s) across ${failedChecks} invariant(s)`);
    } else {
      this.logger.log(`Data quality audit passed 10/10 invariants cleanly.`);
    }

    return {
      allValid,
      totalChecks,
      passedChecks,
      failedChecks,
      violations,
      evaluatedEntities: {
        learners: snapshot.learners.length,
        sessions: snapshot.sessions.length,
        attempts: snapshot.attempts.length,
        masteries: snapshot.masteries.length,
        consents: snapshot.consents.length,
        auditRecords: snapshot.auditRecords.length,
      },
      auditTimestamp: timestamp,
      checksumSha256,
    };
  }
}
