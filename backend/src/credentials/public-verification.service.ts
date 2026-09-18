import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  PublicVerificationResponse,
  CredentialRecord,
} from './credential-types';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { CredentialPolicyService } from './credential-policy.service';
import { CryptoKeyService } from './crypto-key.service';

@Injectable()
export class PublicVerificationService {
  private readonly logger = new Logger(PublicVerificationService.name);

  constructor(
    private readonly lifecycleService: CredentialLifecycleService,
    private readonly policyService: CredentialPolicyService,
    private readonly cryptoKeyService: CryptoKeyService,
  ) {}

  /**
   * Performs public verification of a credential identifier without requiring authentication.
   * Enforces strict data minimization (Clause N12.75): learner PII, grades, and private notes are omitted.
   */
  verifyCredential(credentialId: string): PublicVerificationResponse {
    let cred: CredentialRecord;
    try {
      cred = this.lifecycleService.getCredential(credentialId);
    } catch {
      return {
        valid: false,
        status: 'DRAFT',
        credentialId,
        title: 'Unknown Credential',
        domain: 'UNKNOWN',
        issuer: { id: 'unknown', name: 'Unknown Issuer' },
        evidenceCount: 0,
        verificationMethod: 'NONE',
      };
    }

    const policy = this.policyService.getPolicy(cred.policyId);

    // 1. Check expiration
    const now = Date.now();
    let currentStatus = cred.status;
    if (cred.expiresAt && new Date(cred.expiresAt).getTime() < now && currentStatus === 'ACTIVE') {
      currentStatus = 'EXPIRED';
    }

    // 2. Cryptographic signature check
    let signatureValid = false;
    if (cred.cryptographicProof) {
      const canonicalClaims = JSON.stringify({
        credentialId: cred.credentialId,
        policyId: cred.policyId,
        policyVersion: cred.policyVersion,
        learnerId: cred.learnerId,
        tenantId: cred.tenantId,
        issuedAt: cred.issuedAt,
        expiresAt: cred.expiresAt,
      });
      const sigResult = this.cryptoKeyService.verifySignature(canonicalClaims, cred.cryptographicProof);
      signatureValid = sigResult.valid;
    }

    const isValid = currentStatus === 'ACTIVE' && signatureValid;

    const response: PublicVerificationResponse = {
      valid: isValid,
      status: currentStatus,
      credentialId: cred.credentialId,
      title: policy.title,
      domain: policy.domain,
      issuer: {
        id: 'did:youva:issuer:delhi-01',
        name: 'YOUVA-EdAI Accredited Secondary Education Node',
      },
      issuedAt: cred.issuedAt,
      expiresAt: cred.expiresAt,
      evidenceCount: cred.evidenceIds.length,
      verificationMethod: cred.cryptographicProof?.verificationMethod || 'HMAC-SHA256',
    };

    if (currentStatus === 'REVOKED' && cred.revocation) {
      response.revocationNotice = {
        revokedAt: cred.revocation.revokedAt,
        reason: cred.revocation.reason,
      };
    }

    this.logger.log(`Public verification requested for ${credentialId} -> Valid: ${isValid}, Status: ${currentStatus}`);
    return response;
  }
}
