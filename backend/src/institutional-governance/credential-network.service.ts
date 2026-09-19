import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  CredentialAttestation,
  SelectiveDisclosureRequest,
  SelectiveDisclosureResponse,
} from './n16-types';

@Injectable()
export class CredentialNetworkService {
  private readonly logger = new Logger(CredentialNetworkService.name);

  private readonly trustedIssuers = new Set<string>([
    'issuer-dps-rkp',
    'issuer-cambridge-intl',
    'issuer-cbse-gov-in',
    'issuer-nsdc-skills-council',
  ]);

  private readonly credentials = new Map<string, CredentialAttestation>();

  constructor() {
    this.seedCanonicalCredential();
  }

  private seedCanonicalCredential(): void {
    const credId = 'cred-python-mastery-std101';
    const canonical: CredentialAttestation = {
      credentialId: credId,
      learnerId: 'std-sharma-101',
      issuerId: 'issuer-dps-rkp',
      skillCode: 'CS-PROG-PYTHON-01',
      competencyLevel: 'PROFICIENT_TIER_3',
      evidenceHashes: [
        crypto.createHash('sha256').update('evidence-quiz-score-94').digest('hex'),
        crypto.createHash('sha256').update('evidence-capstone-pull-request').digest('hex'),
      ],
      issuedAt: new Date().toISOString(),
      status: 'ACTIVE',
      cryptographicSignature: crypto
        .createHmac('sha256', 'issuer-dps-rkp-private-key-mock')
        .update(`${credId}:std-sharma-101:CS-PROG-PYTHON-01:ACTIVE`)
        .digest('hex'),
    };

    this.credentials.set(canonical.credentialId, canonical);
  }

  // --- 1. Trusted Issuer Governance (Clauses N16.22, N16.144) ---

  public registerIssuer(issuerId: string, authorizedBy: string): void {
    this.trustedIssuers.add(issuerId);
    this.logger.log(`Registered trusted credential issuer [${issuerId}] by [${authorizedBy}]`);
  }

  public isIssuerTrusted(issuerId: string): boolean {
    return this.trustedIssuers.has(issuerId);
  }

  // --- 2. Credential Issuance & Attestation (Clauses N16.23, N16.143) ---

  public issueAttestation(params: {
    learnerId: string;
    issuerId: string;
    skillCode: string;
    competencyLevel: string;
    evidenceHashes: string[];
  }): CredentialAttestation {
    if (!this.trustedIssuers.has(params.issuerId)) {
      throw new ForbiddenException(
        `CRED-001: Unauthorized Issuer. Issuer [${params.issuerId}] is not in the trusted institutional issuer registry.`
      );
    }

    if (!params.evidenceHashes || params.evidenceHashes.length < 2) {
      throw new BadRequestException(
        'CRED-002: Insufficient Evidence. Credential attestation requires at least 2 independent verified evidence hashes.'
      );
    }

    const credentialId = `cred-${crypto.randomUUID()}`;
    const issuedAt = new Date().toISOString();

    const signaturePayload = `${credentialId}:${params.learnerId}:${params.skillCode}:ACTIVE`;
    const cryptographicSignature = crypto
      .createHmac('sha256', `${params.issuerId}-secret`)
      .update(signaturePayload)
      .digest('hex');

    const attestation: CredentialAttestation = {
      credentialId,
      learnerId: params.learnerId,
      issuerId: params.issuerId,
      skillCode: params.skillCode,
      competencyLevel: params.competencyLevel,
      evidenceHashes: params.evidenceHashes,
      issuedAt,
      status: 'ACTIVE',
      cryptographicSignature,
    };

    this.credentials.set(credentialId, attestation);
    this.logger.log(
      `Issued CredentialAttestation [${credentialId}] for learner [${params.learnerId}] in skill [${params.skillCode}]`
    );
    return attestation;
  }

  public revokeAttestation(credentialId: string, reason: string, reviewerId: string): CredentialAttestation {
    const cred = this.credentials.get(credentialId);
    if (!cred) {
      throw new NotFoundException(`CRED-003: Credential [${credentialId}] not found`);
    }

    cred.status = 'REVOKED';
    this.logger.warn(`Revoked Credential [${credentialId}] by [${reviewerId}]. Reason: ${reason}`);
    return cred;
  }

  // --- 3. Privacy-Preserving Selective Disclosure Verification (Clauses N16.24 - N16.25) ---

  public verifySelectiveDisclosure(request: SelectiveDisclosureRequest): SelectiveDisclosureResponse {
    const cred = this.credentials.get(request.credentialId);
    if (!cred) {
      throw new NotFoundException(`CRED-004: Credential [${request.credentialId}] not found for verification`);
    }

    // Check issuer trustworthiness
    const isIssuerTrusted = this.trustedIssuers.has(cred.issuerId);
    const isSignatureValid = cred.cryptographicSignature.length === 64;
    const isNotRevoked = cred.status === 'ACTIVE';

    const verified = isIssuerTrusted && isSignatureValid && isNotRevoked;

    // Minimum Necessary Disclosure: Expose ONLY requested fields
    const disclosedFields: Record<string, any> = {};

    request.requestedFields.forEach((field) => {
      switch (field) {
        case 'SKILL_CODE':
          disclosedFields.skillCode = cred.skillCode;
          break;
        case 'COMPETENCY_LEVEL':
          disclosedFields.competencyLevel = cred.competencyLevel;
          break;
        case 'ISSUER_IDENTITY':
          disclosedFields.issuerId = cred.issuerId;
          disclosedFields.issuerTrusted = isIssuerTrusted;
          break;
        case 'VALIDITY_STATUS':
          disclosedFields.status = cred.status;
          break;
        case 'ISSUANCE_DATE':
          disclosedFields.issuedAt = cred.issuedAt;
          break;
      }
    });

    const proofHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ credId: cred.credentialId, verified, disclosedFields }))
      .digest('hex');

    return {
      credentialId: cred.credentialId,
      verified,
      disclosedFields,
      proofHash,
      verificationTimestamp: new Date().toISOString(),
    };
  }
}
