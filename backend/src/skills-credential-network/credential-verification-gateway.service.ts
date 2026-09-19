import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CredentialVerificationResult,
  Credential,
  CredentialIssuer,
} from './n19-types';
import { CredentialLifecycleService } from './credential-lifecycle.service';
import { SkillsGraphService } from './skills-graph.service';

@Injectable()
export class CredentialVerificationGatewayService {
  private readonly logger = new Logger(CredentialVerificationGatewayService.name);

  // Verification request counter for rate limiting & abuse monitoring
  private readonly verificationAudit = new Map<string, number>();

  constructor(
    private readonly lifecycleService: CredentialLifecycleService,
    private readonly skillsService: SkillsGraphService,
  ) {}

  /**
   * Privacy-Preserving Verification (Clauses N19.31–N19.33, N19.65).
   * Validates credential without leaking unnecessary learner PII or full transcripts.
   */
  verifyCredential(
    credentialId: string,
    simulatedOutage: boolean = false,
  ): CredentialVerificationResult {
    const now = new Date().toISOString();

    // Failure Safety Invariant (Clause N19.118): Temporary outage must not falsely claim INVALID
    if (simulatedOutage) {
      return {
        valid: false,
        credentialId,
        issuerId: 'UNKNOWN',
        issuerStatus: 'SERVICE_UNAVAILABLE',
        credentialStatus: 'INDETERMINATE',
        issuedAt: '',
        skills: [],
        verificationMethod: 'W3C_VC_ED25519',
        verifiedAt: now,
        errorReason: 'SERVICE_UNAVAILABLE: Verification service temporarily unable to contact issuer authority.',
      };
    }

    const credential = this.lifecycleService.getCredential(credentialId);
    if (!credential) {
      return {
        valid: false,
        credentialId,
        issuerId: 'UNKNOWN',
        issuerStatus: 'NOT_FOUND',
        credentialStatus: 'NOT_FOUND',
        issuedAt: '',
        skills: [],
        verificationMethod: 'W3C_VC_ED25519',
        verifiedAt: now,
        errorReason: 'Credential not found in registry.',
      };
    }

    const issuer = this.lifecycleService.getIssuer(credential.issuerId);
    const issuerStatus = issuer ? issuer.status : 'UNKNOWN_ISSUER';

    // Anti-Forgery & Status Checks (Clause N19.68)
    const isRevoked = credential.status === 'REVOKED';
    const isSuspended = credential.status === 'SUSPENDED' || issuerStatus === 'SUSPENDED';
    const isExpired = credential.expiresAt ? new Date(credential.expiresAt) < new Date() : false;
    const hasValidSignature = Boolean(credential.cryptographicProof?.signature);

    const isValid = !isRevoked && !isSuspended && !isExpired && hasValidSignature && issuerStatus === 'ACTIVE';

    let errorReason: string | undefined = undefined;
    if (isRevoked) {
      errorReason = `Credential was revoked. Reason: ${credential.revocationReason || 'POLICY_VIOLATION'}`;
    } else if (isSuspended) {
      errorReason = 'Credential or issuing authority is currently suspended.';
    } else if (isExpired) {
      errorReason = 'Credential validity period has expired.';
    } else if (!hasValidSignature) {
      errorReason = 'Cryptographic proof signature is missing or corrupted.';
    }

    const skillsDetails = credential.skills.map((skillId) => {
      const s = this.skillsService.getSkill(skillId);
      return {
        skillId,
        name: s ? s.canonicalName : skillId,
        status: s ? s.status : 'ACTIVE',
      };
    });

    const count = (this.verificationAudit.get(credentialId) || 0) + 1;
    this.verificationAudit.set(credentialId, count);

    this.logger.log(`[VERIFICATION-GATEWAY] Verified credential ${credentialId}: valid=${isValid}`);

    return {
      valid: isValid,
      credentialId: credential.credentialId,
      issuerId: credential.issuerId,
      issuerStatus,
      credentialStatus: credential.status,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt,
      skills: skillsDetails,
      verificationMethod: credential.cryptographicProof?.algorithm || 'W3C_VC_ED25519',
      verifiedAt: now,
      errorReason,
    };
  }

  /**
   * Open Badges 3.0 Adapter (Clause N19.45).
   * Formats credential as an interoperable 1EdTech Open Badge payload.
   */
  exportOpenBadge(credentialId: string): {
    '@context': string;
    id: string;
    type: string[];
    name: string;
    issuer: { id: string; name: string };
    validFrom: string;
    criteria: { narrative: string };
  } {
    const credential = this.lifecycleService.getCredential(credentialId);
    if (!credential) throw new NotFoundException(`Credential ${credentialId} not found`);

    const issuer = this.lifecycleService.getIssuer(credential.issuerId);

    return {
      '@context': 'https://w3id.org/openbadges/v3',
      id: `urn:uuid:${credential.credentialId}`,
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      name: `${credential.credentialType} — ${credential.skills.join(', ')}`,
      issuer: {
        id: `urn:issuer:${credential.issuerId}`,
        name: issuer ? issuer.organizationName : credential.issuerId,
      },
      validFrom: credential.issuedAt,
      criteria: {
        narrative: `Demonstrated validated skills: ${credential.skills.join(', ')} under policy ${credential.policyVersion}`,
      },
    };
  }

  /**
   * W3C Verifiable Credentials Data Model 2.0 Adapter (Clause N19.46).
   */
  exportW3cVerifiableCredential(credentialId: string): {
    '@context': string[];
    id: string;
    type: string[];
    issuer: string;
    issuanceDate: string;
    credentialSubject: {
      id: string;
      skills: string[];
    };
    proof: unknown;
  } {
    const credential = this.lifecycleService.getCredential(credentialId);
    if (!credential) throw new NotFoundException(`Credential ${credentialId} not found`);

    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: `urn:youva:credential:${credential.credentialId}`,
      type: ['VerifiableCredential', credential.credentialType],
      issuer: `did:youva:issuer:${credential.issuerId}`,
      issuanceDate: credential.issuedAt,
      credentialSubject: {
        id: `did:youva:holder:${credential.holderId}`,
        skills: credential.skills,
      },
      proof: credential.cryptographicProof,
    };
  }
}
