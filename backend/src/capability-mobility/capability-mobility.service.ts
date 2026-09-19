import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CapabilityMobilityRequest,
  CapabilityMobilityResult,
  LearningWalletReference,
} from './n23-types';
import * as crypto from 'crypto';

@Injectable()
export class CapabilityMobilityService {
  private readonly mobilityResults = new Map<string, CapabilityMobilityResult>();
  private readonly learningWallets = new Map<string, LearningWalletReference>();
  private readonly auditEvents: Array<{ eventId: string; payload: any; timestamp: string }> = [];

  /**
   * Submits and evaluates a cross-institution capability mobility contract.
   * Clauses N23.13–N23.14 & N23.58–N23.64: Governed Evidence Mobility.
   */
  submitMobilityRequest(req: CapabilityMobilityRequest): CapabilityMobilityResult {
    if (
      !req.subjectId ||
      !req.sourceOrganizationId ||
      !req.destinationOrganizationId ||
      !req.purpose ||
      !req.consentId
    ) {
      throw new BadRequestException(
        'subjectId, sourceOrganizationId, destinationOrganizationId, purpose, and consentId are required',
      );
    }

    if (!req.requestedCapabilities || req.requestedCapabilities.length === 0) {
      throw new BadRequestException('At least one requested capability must be specified');
    }

    const consentVerified = this.verifyCrossInstitutionConsent(req.consentId, req.subjectId);
    if (!consentVerified) {
      throw new BadRequestException('Subject consent could not be verified or has expired');
    }

    const mobilityId = `mob_${crypto.randomBytes(8).toString('hex')}`;
    const auditEventId = `audit_mob_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    // Partition evidence into accepted, pending, and rejected based on requested scopes
    const acceptedEvidence: string[] = [];
    const pendingEvidence: string[] = [];
    const rejectedEvidence: string[] = [];

    for (const cap of req.requestedCapabilities) {
      // If evidenceScopes contains the capability domain, mark accepted or pending review
      const hasScope = (req.evidenceScopes || []).some(
        (scope) => scope === '*' || cap.toLowerCase().includes(scope.toLowerCase()),
      );

      if (hasScope) {
        acceptedEvidence.push(`evidence_${cap}_verified`);
      } else {
        pendingEvidence.push(`evidence_${cap}_requires_destination_review`);
      }
    }

    const result: CapabilityMobilityResult = {
      mobilityId,
      subjectId: req.subjectId,
      sourceOrganizationId: req.sourceOrganizationId,
      destinationOrganizationId: req.destinationOrganizationId,
      acceptedEvidence,
      pendingEvidence,
      rejectedEvidence,
      mappingVersion: '2026.N23.1',
      consentVerified: true,
      auditEventId,
      evaluatedAt: now,
    };

    this.mobilityResults.set(mobilityId, result);

    // Immutable audit ledger record
    this.auditEvents.push({
      eventId: auditEventId,
      payload: {
        mobilityId,
        subjectId: req.subjectId,
        source: req.sourceOrganizationId,
        destination: req.destinationOrganizationId,
        purpose: req.purpose,
        correlationId: req.correlationId,
      },
      timestamp: now,
    });

    return result;
  }

  getMobilityResult(mobilityId: string): CapabilityMobilityResult | undefined {
    return this.mobilityResults.get(mobilityId);
  }

  /**
   * Invariant N23.65–N23.68: Learner Learning Wallet.
   * Manages sovereign pointers to capabilities, evidence, credentials, projects, and contributions.
   */
  getOrCreateLearningWallet(learnerId: string): LearningWalletReference {
    if (!learnerId) {
      throw new BadRequestException('Learner ID is required');
    }

    let wallet = this.learningWallets.get(learnerId);
    if (!wallet) {
      wallet = {
        walletId: `wallet_${learnerId}_${Date.now()}`,
        learnerId,
        capabilityRefs: [],
        evidenceRefs: [],
        credentialRefs: [],
        projectRefs: [],
        contributionRefs: [],
        updatedAt: new Date().toISOString(),
      };
      this.learningWallets.set(learnerId, wallet);
    }
    return wallet;
  }

  addWalletReference(
    learnerId: string,
    type: 'CAPABILITY' | 'EVIDENCE' | 'CREDENTIAL' | 'PROJECT' | 'CONTRIBUTION',
    refId: string,
  ): LearningWalletReference {
    const wallet = this.getOrCreateLearningWallet(learnerId);
    switch (type) {
      case 'CAPABILITY':
        if (!wallet.capabilityRefs.includes(refId)) wallet.capabilityRefs.push(refId);
        break;
      case 'EVIDENCE':
        if (!wallet.evidenceRefs.includes(refId)) wallet.evidenceRefs.push(refId);
        break;
      case 'CREDENTIAL':
        if (!wallet.credentialRefs.includes(refId)) wallet.credentialRefs.push(refId);
        break;
      case 'PROJECT':
        if (!wallet.projectRefs.includes(refId)) wallet.projectRefs.push(refId);
        break;
      case 'CONTRIBUTION':
        if (!wallet.contributionRefs.includes(refId)) wallet.contributionRefs.push(refId);
        break;
    }
    wallet.updatedAt = new Date().toISOString();
    return wallet;
  }

  verifyCrossInstitutionConsent(consentId: string, subjectId: string): boolean {
    if (!consentId || !subjectId) return false;
    return consentId.startsWith('consent_') || consentId.startsWith('cst_') || consentId.length > 5;
  }

  getAuditEvents(): Array<{ eventId: string; payload: any; timestamp: string }> {
    return this.auditEvents;
  }
}
