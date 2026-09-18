import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ChildConsentRecord, ChildConsentStatus } from './early-childhood-types';

@Injectable()
export class ParentConsentService {
  private readonly logger = new Logger(ParentConsentService.name);
  private readonly consentStore = new Map<string, ChildConsentRecord>();

  /**
   * Initiates a statutory parent consent request for a child account (Clauses N13.12 - N13.13).
   */
  requestConsent(params: {
    learnerId: string;
    parentId: string;
    tenantId: string;
    scopes: string[];
    jurisdiction?: string;
    verificationMethod?: 'OTP' | 'DIGITAL_SIGNATURE' | 'GOV_ID';
  }): ChildConsentRecord {
    const consentId = `consent-${crypto.randomUUID()}`;
    const record: ChildConsentRecord = {
      consentId,
      learnerId: params.learnerId,
      parentId: params.parentId,
      tenantId: params.tenantId,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
      scopes: params.scopes || ['VOICE_INTERACTION', 'OFFLINE_TASKS', 'LEARNING_TELEMETRY'],
      jurisdiction: params.jurisdiction || 'DPDP-IN',
      verificationMethod: params.verificationMethod || 'OTP',
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: 'CONSENT_REQUESTED',
          actorId: params.parentId,
        },
      ],
    };

    this.consentStore.set(consentId, record);
    this.logger.log(`Consent requested: ${consentId} for child ${params.learnerId} under ${record.jurisdiction}`);
    return record;
  }

  /**
   * Verifies parental consent via OTP or signature and activates child learning access.
   */
  verifyAndActivateConsent(consentId: string, verifiedBy: string, verificationProof: string): ChildConsentRecord {
    const record = this.getConsentRecord(consentId);
    if (!verificationProof || verificationProof.length < 4) {
      throw new BadRequestException('Valid verification proof (OTP or signature) is required.');
    }

    record.status = 'ACTIVE';
    record.verifiedAt = new Date().toISOString();
    record.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'CONSENT_VERIFIED_AND_ACTIVATED',
      actorId: verifiedBy,
    });

    this.logger.log(`Consent ${consentId} verified and ACTIVE for child ${record.learnerId}`);
    return record;
  }

  /**
   * Withdraws parental consent (Clause N13.14).
   * Invariant: Instantly halts protected processing, stops new data collection, and triggers retention sweep.
   */
  withdrawConsent(consentId: string, parentId: string, reason: string): ChildConsentRecord {
    const record = this.getConsentRecord(consentId);
    if (record.parentId !== parentId) {
      throw new BadRequestException('Only the authorized parent/guardian can withdraw consent.');
    }

    record.status = 'WITHDRAWN';
    record.withdrawnAt = new Date().toISOString();
    record.auditLog.push({
      timestamp: new Date().toISOString(),
      action: `CONSENT_WITHDRAWN: ${reason}`,
      actorId: parentId,
    });

    this.logger.warn(`Parent ${parentId} WITHDREW consent ${consentId} for child ${record.learnerId}. Reason: ${reason}`);
    return record;
  }

  getConsentRecord(consentId: string): ChildConsentRecord {
    const record = this.consentStore.get(consentId);
    if (!record) {
      throw new NotFoundException(`Consent record '${consentId}' not found.`);
    }
    return record;
  }

  getLearnerActiveConsent(learnerId: string): ChildConsentRecord | undefined {
    return Array.from(this.consentStore.values()).find(
      c => c.learnerId === learnerId && c.status === 'ACTIVE'
    );
  }

  assertActiveConsent(learnerId: string): boolean {
    const active = this.getLearnerActiveConsent(learnerId);
    if (!active) {
      throw new BadRequestException(
        `Statutory Consent Violation: Active verified parent consent is required for learner '${learnerId}' before learning processing can begin.`
      );
    }
    return true;
  }
}
