import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CredentialRecord,
  CredentialStatus,
  RevocationReason,
  CredentialEvent,
} from './credential-types';
import { CredentialPolicyService } from './credential-policy.service';
import { LearningEvidenceService } from './learning-evidence.service';
import { CryptoKeyService } from './crypto-key.service';

@Injectable()
export class CredentialLifecycleService {
  private readonly logger = new Logger(CredentialLifecycleService.name);
  private readonly credentialStore = new Map<string, CredentialRecord>();
  private readonly idempotencyIndex = new Map<string, string>(); // idempotencyKey -> credentialId
  private readonly outboxEvents: CredentialEvent[] = [];

  constructor(
    private readonly policyService: CredentialPolicyService,
    private readonly evidenceService: LearningEvidenceService,
    private readonly cryptoKeyService: CryptoKeyService,
  ) {}

  /**
   * Evaluates and prepares an eligible or pending credential draft.
   */
  requestCredential(params: {
    policyId: string;
    learnerId: string;
    tenantId: string;
    clientRequestId?: string;
  }): CredentialRecord {
    const policy = this.policyService.getPolicy(params.policyId);

    // Idempotency check (Clause N12.70)
    if (params.clientRequestId) {
      const idempotencyKey = `${params.clientRequestId}:${policy.policyVersion}:${params.learnerId}`;
      const existingId = this.idempotencyIndex.get(idempotencyKey);
      if (existingId) {
        const existing = this.credentialStore.get(existingId);
        if (existing) {
          this.logger.log(`Idempotency match: returning existing credential ${existingId}`);
          return existing;
        }
      }
    }

    const eligibility = this.policyService.evaluateEligibility(params.policyId, params.learnerId, params.tenantId);
    if (!eligibility.isEligible) {
      throw new BadRequestException(`Learner is not eligible: ${eligibility.reasons.join('; ')}`);
    }

    const credentialId = `cred-${crypto.randomUUID()}`;
    const initialStatus: CredentialStatus = policy.teacherApprovalRequired ? 'PENDING_REVIEW' : 'APPROVED';

    const record: CredentialRecord = {
      credentialId,
      policyId: policy.credentialId,
      policyVersion: policy.policyVersion,
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      status: initialStatus,
      evidenceIds: eligibility.eligibleEvidenceIds,
      clientRequestId: params.clientRequestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.credentialStore.set(credentialId, record);
    if (params.clientRequestId) {
      const idempotencyKey = `${params.clientRequestId}:${policy.policyVersion}:${params.learnerId}`;
      this.idempotencyIndex.set(idempotencyKey, credentialId);
    }

    this.emitEvent({
      eventType: 'CREDENTIAL_ELIGIBLE',
      credentialId,
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      payload: { policyId: policy.credentialId, status: initialStatus },
    });

    this.logger.log(`Created credential ${credentialId} with status ${initialStatus} for ${params.learnerId}`);
    return record;
  }

  /**
   * Teacher / Educator authorization gate (Clauses N12.14, N12.59).
   */
  authorizeCredential(credentialId: string, authorizedBy: string, decision: 'APPROVE' | 'REJECT', notes?: string): CredentialRecord {
    const cred = this.getCredential(credentialId);
    if (cred.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(`Cannot authorize credential with current status '${cred.status}'. Must be PENDING_REVIEW.`);
    }

    if (decision === 'REJECT') {
      cred.status = 'DRAFT';
      cred.updatedAt = new Date().toISOString();
      this.logger.warn(`Teacher ${authorizedBy} rejected credential ${credentialId}: ${notes}`);
      return cred;
    }

    cred.status = 'APPROVED';
    cred.authorizedBy = authorizedBy;
    cred.authorizedAt = new Date().toISOString();
    cred.updatedAt = new Date().toISOString();

    this.emitEvent({
      eventType: 'CREDENTIAL_APPROVED',
      credentialId,
      learnerId: cred.learnerId,
      tenantId: cred.tenantId,
      payload: { authorizedBy, notes },
    });

    this.logger.log(`Teacher ${authorizedBy} approved credential ${credentialId}`);
    return cred;
  }

  /**
   * Final cryptographic issuance (Clause N12.20, N12.56-57).
   */
  issueCredential(credentialId: string): CredentialRecord {
    const cred = this.getCredential(credentialId);
    if (cred.status !== 'APPROVED') {
      throw new BadRequestException(`Credential must be in APPROVED state prior to issuance. Current state: ${cred.status}`);
    }

    const policy = this.policyService.getPolicy(cred.policyId);
    const issuedAt = new Date().toISOString();
    const expiresAt = policy.validityDays
      ? new Date(Date.now() + policy.validityDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    // Cryptographic proof attachment
    const canonicalClaims = JSON.stringify({
      credentialId: cred.credentialId,
      policyId: cred.policyId,
      policyVersion: cred.policyVersion,
      learnerId: cred.learnerId,
      tenantId: cred.tenantId,
      issuedAt,
      expiresAt,
    });
    const proof = this.cryptoKeyService.signPayload(canonicalClaims);

    cred.status = 'ACTIVE';
    cred.issuedAt = issuedAt;
    cred.expiresAt = expiresAt;
    cred.cryptographicProof = proof;
    cred.updatedAt = new Date().toISOString();

    this.emitEvent({
      eventType: 'CREDENTIAL_ISSUED',
      credentialId,
      learnerId: cred.learnerId,
      tenantId: cred.tenantId,
      payload: { issuedAt, expiresAt, proof },
    });

    this.logger.log(`Issued credential ${credentialId} (Status: ACTIVE, Key: ${proof.keyId})`);
    return cred;
  }

  /**
   * Suspends a credential pending audit or investigation (Clause N12.23).
   */
  suspendCredential(credentialId: string, suspendedBy: string, reason: string): CredentialRecord {
    const cred = this.getCredential(credentialId);
    if (cred.status !== 'ACTIVE') {
      throw new BadRequestException(`Only ACTIVE credentials can be suspended. Current: ${cred.status}`);
    }

    cred.status = 'SUSPENDED';
    cred.updatedAt = new Date().toISOString();

    this.emitEvent({
      eventType: 'CREDENTIAL_SUSPENDED',
      credentialId,
      learnerId: cred.learnerId,
      tenantId: cred.tenantId,
      payload: { suspendedBy, reason },
    });

    return cred;
  }

  /**
   * Governed credential revocation (Clause N12.24).
   * Invariant: Never deletes the database record.
   */
  revokeCredential(credentialId: string, revokedBy: string, reason: RevocationReason, notes?: string): CredentialRecord {
    const cred = this.getCredential(credentialId);
    if (cred.status === 'REVOKED') {
      throw new ConflictException(`Credential ${credentialId} is already revoked.`);
    }

    cred.status = 'REVOKED';
    cred.revocation = {
      revokedAt: new Date().toISOString(),
      revokedBy,
      reason,
      notes,
    };
    cred.updatedAt = new Date().toISOString();

    this.emitEvent({
      eventType: 'CREDENTIAL_REVOKED',
      credentialId,
      learnerId: cred.learnerId,
      tenantId: cred.tenantId,
      payload: { revokedBy, reason, notes },
    });

    this.logger.warn(`Revoked credential ${credentialId}: ${reason} by ${revokedBy}`);
    return cred;
  }

  getCredential(credentialId: string): CredentialRecord {
    const cred = this.credentialStore.get(credentialId);
    if (!cred) {
      throw new NotFoundException(`Credential '${credentialId}' not found.`);
    }
    return cred;
  }

  listLearnerCredentials(learnerId: string, tenantId?: string): CredentialRecord[] {
    let list = Array.from(this.credentialStore.values()).filter(c => c.learnerId === learnerId);
    if (tenantId) {
      list = list.filter(c => c.tenantId === tenantId);
    }
    return list;
  }

  getOutboxEvents(): CredentialEvent[] {
    return [...this.outboxEvents];
  }

  private emitEvent(eventData: Omit<CredentialEvent, 'eventId' | 'occurredAt' | 'correlationId' | 'version'>): void {
    const event: CredentialEvent = {
      eventId: `evt-${crypto.randomUUID()}`,
      correlationId: `corr-${crypto.randomUUID()}`,
      occurredAt: new Date().toISOString(),
      version: 1,
      ...eventData,
    };
    this.outboxEvents.push(event);
  }
}
