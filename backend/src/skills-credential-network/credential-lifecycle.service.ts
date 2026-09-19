import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  Credential,
  CredentialLifecycleStatus,
  CredentialType,
  CredentialIssuer,
  IssuerTrustStatus,
} from './n19-types';

@Injectable()
export class CredentialLifecycleService {
  private readonly logger = new Logger(CredentialLifecycleService.name);

  // In-memory ledger of credentials: key = credentialId
  private readonly credentials = new Map<string, Credential>();

  // In-memory issuer registry: key = issuerId
  private readonly issuers = new Map<string, CredentialIssuer>();

  constructor() {
    this.seedDefaultIssuers();
    this.seedDefaultCredentials();
  }

  private seedDefaultIssuers(): void {
    const defaultIssuers: CredentialIssuer[] = [
      {
        issuerId: 'ISSUER-DPS-DELHI',
        organizationName: 'Delhi Public School Society & Board of Examinations',
        trustStatus: 'RECOGNIZED',
        authorizedCredentialTypes: ['MICRO_CREDENTIAL', 'CERTIFICATE', 'BADGE', 'DIPLOMA_SPECIALIZATION'],
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0123456789ABCDEF...',
        keyRotationDate: '2027-01-01',
        status: 'ACTIVE',
        tenantId: 'TENANT-DPS-DELHI',
      },
      {
        issuerId: 'ISSUER-STANFORD-ONLINE',
        organizationName: 'Stanford Center for Professional Development',
        trustStatus: 'RECOGNIZED',
        authorizedCredentialTypes: ['CERTIFICATE', 'PROFESSIONAL_LICENSE', 'MICRO_CREDENTIAL'],
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA9876543210FEDCBA...',
        keyRotationDate: '2027-06-01',
        status: 'ACTIVE',
        tenantId: 'TENANT-GLOBAL-PARTNERS',
      },
      {
        issuerId: 'ISSUER-COMMUNITY-LEARN',
        organizationName: 'Open Web Community Peer Group',
        trustStatus: 'SELF_ASSERTED',
        authorizedCredentialTypes: ['BADGE'],
        publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA111222333444555...',
        keyRotationDate: '2026-12-31',
        status: 'ACTIVE',
        tenantId: 'TENANT-COMMUNITY',
      },
    ];

    for (const i of defaultIssuers) {
      this.issuers.set(i.issuerId, i);
    }
  }

  private seedDefaultCredentials(): void {
    const defaultCredential: Credential = {
      credentialId: 'CRED-MATH-CALC-001',
      holderId: 'STUDENT-201',
      issuerId: 'ISSUER-DPS-DELHI',
      credentialType: 'CERTIFICATE',
      skills: ['SKILL-MATH-CALC-DIFF'],
      evidenceReferences: ['EVID-MATH-CALC-001'],
      issuedAt: '2026-09-15T10:00:00Z',
      validFrom: '2026-09-15T10:00:00Z',
      expiresAt: '2029-09-15T10:00:00Z',
      status: 'ACTIVE',
      policyVersion: 'POL-CRED-V2.1',
      credentialVersion: '1.0.0',
      cryptographicProof: {
        signature: 'sig-dps-delhi-sha256-verified-7a8b9c0d1e2f',
        publicKeyId: 'ISSUER-DPS-DELHI-KEY-1',
        algorithm: 'Ed25519Signature2020',
      },
    };

    this.credentials.set(defaultCredential.credentialId, defaultCredential);
  }

  // --- ISSUER REGISTRY API ---

  getIssuers(): CredentialIssuer[] {
    return Array.from(this.issuers.values());
  }

  getIssuer(issuerId: string): CredentialIssuer | undefined {
    return this.issuers.get(issuerId);
  }

  registerIssuer(issuer: CredentialIssuer): CredentialIssuer {
    if (this.issuers.has(issuer.issuerId)) {
      throw new BadRequestException(`Issuer ${issuer.issuerId} already exists`);
    }
    this.issuers.set(issuer.issuerId, issuer);
    this.logger.log(`[ISSUER-REGISTERED] Registered issuer ${issuer.issuerId}: ${issuer.organizationName}`);
    return issuer;
  }

  /**
   * Emergency Issuer Kill Switch (Clause N19.153).
   */
  setIssuerStatus(issuerId: string, status: 'ACTIVE' | 'SUSPENDED'): CredentialIssuer {
    const issuer = this.issuers.get(issuerId);
    if (!issuer) throw new NotFoundException(`Issuer ${issuerId} not found`);

    issuer.status = status;
    this.logger.warn(`[ISSUER-KILL-SWITCH] Issuer ${issuerId} status set to ${status}`);
    return issuer;
  }

  // --- CREDENTIAL LIFECYCLE API ---

  getCredentials(): Credential[] {
    return Array.from(this.credentials.values());
  }

  getCredential(credentialId: string): Credential | undefined {
    return this.credentials.get(credentialId);
  }

  getCredentialsByHolder(holderId: string): Credential[] {
    return Array.from(this.credentials.values()).filter((c) => c.holderId === holderId);
  }

  /**
   * Governed Credential Issuance (Clauses N19.42–N19.43, N19.148).
   * Strict Invariant: AI models cannot directly issue credentials; requires human/governed authorization.
   */
  issueCredential(request: {
    holderId: string;
    issuerId: string;
    credentialType: CredentialType;
    skills: string[];
    evidenceReferences: string[];
    authorizedByHumanId?: string;
    authorizationTicketId?: string;
    isAiAutonomousAttempt?: boolean;
    expiresInDays?: number;
  }): Credential {
    // AI Boundary Check (Clause N19.148): AI cannot autonomously issue credentials without human authorization
    if (request.isAiAutonomousAttempt && !request.authorizationTicketId) {
      throw new ForbiddenException(
        'AI Boundary Invariant Violation: AI autonomous agents cannot issue credentials without human authorization ticket.',
      );
    }

    if (!request.authorizedByHumanId && !request.authorizationTicketId) {
      throw new BadRequestException('Credential issuance requires an authoritative human approver or authorization ticket.');
    }

    const issuer = this.issuers.get(request.issuerId);
    if (!issuer) throw new NotFoundException(`Issuer ${request.issuerId} not found`);
    if (issuer.status === 'SUSPENDED') {
      throw new ForbiddenException(`Issuer ${request.issuerId} is currently suspended; issuance blocked.`);
    }

    // Idempotent Issuance Invariant (Clause N19.43): Check for duplicate identical credentials
    const existing = Array.from(this.credentials.values()).find(
      (c) =>
        c.holderId === request.holderId &&
        c.issuerId === request.issuerId &&
        c.credentialType === request.credentialType &&
        c.skills.length === request.skills.length &&
        c.skills.every((s) => request.skills.includes(s)) &&
        c.status === 'ACTIVE',
    );
    if (existing) {
      this.logger.warn(`[CREDENTIAL-DUPLICATE-PREVENTED] Active credential ${existing.credentialId} already exists for holder ${request.holderId}`);
      return existing;
    }

    const credentialId = `CRED-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const now = new Date();
    const expiresAt = request.expiresInDays
      ? new Date(now.getTime() + request.expiresInDays * 86400000).toISOString()
      : undefined;

    const signaturePayload = `${credentialId}:${request.holderId}:${request.issuerId}:${request.skills.join(',')}:${now.toISOString()}`;
    const signature = `sig-${issuer.issuerId.toLowerCase()}-sha256-${crypto.createHash('sha256').update(signaturePayload).digest('hex').substring(0, 16)}`;

    const credential: Credential = {
      credentialId,
      holderId: request.holderId,
      issuerId: request.issuerId,
      credentialType: request.credentialType,
      skills: request.skills,
      evidenceReferences: request.evidenceReferences,
      issuedAt: now.toISOString(),
      validFrom: now.toISOString(),
      expiresAt,
      status: 'ACTIVE',
      policyVersion: 'POL-CRED-V2.1',
      credentialVersion: '1.0.0',
      cryptographicProof: {
        signature,
        publicKeyId: `${request.issuerId}-KEY-1`,
        algorithm: 'Ed25519Signature2020',
      },
    };

    this.credentials.set(credentialId, credential);
    this.logger.log(`[CREDENTIAL-ISSUED] Issued ${credential.credentialType} ${credentialId} for holder ${credential.holderId} by ${credential.issuerId}`);
    return credential;
  }

  /**
   * Controlled Revocation (Clauses N19.37–N19.38).
   */
  revokeCredential(
    credentialId: string,
    reason: Credential['revocationReason'],
    authorizedBy: string,
  ): Credential {
    const credential = this.credentials.get(credentialId);
    if (!credential) throw new NotFoundException(`Credential ${credentialId} not found`);

    credential.status = 'REVOKED';
    credential.revocationReason = reason;
    credential.revokedAt = new Date().toISOString();

    this.logger.warn(
      `[CREDENTIAL-REVOKED] Credential ${credentialId} revoked by ${authorizedBy}. Reason: ${reason}`,
    );
    return credential;
  }

  /**
   * Credential Dependency Graph Impact Analysis (Clauses N19.39–N19.41).
   * Identifies credentials dependent on a specific evidence item without automatic mass destruction.
   */
  analyzeEvidenceInvalidationImpact(evidenceId: string): {
    evidenceId: string;
    affectedCredentials: Credential[];
    recommendedAction: 'HUMAN_REVIEW_REQUIRED' | 'NO_IMPACT';
  } {
    const affected = Array.from(this.credentials.values()).filter((c) =>
      c.evidenceReferences.includes(evidenceId),
    );

    return {
      evidenceId,
      affectedCredentials: affected,
      recommendedAction: affected.length > 0 ? 'HUMAN_REVIEW_REQUIRED' : 'NO_IMPACT',
    };
  }

  /**
   * Emergency Credential Kill Switch (Clause N19.152).
   */
  suspendCredential(credentialId: string, reason: string): Credential {
    const credential = this.credentials.get(credentialId);
    if (!credential) throw new NotFoundException(`Credential ${credentialId} not found`);

    credential.status = 'SUSPENDED';
    this.logger.warn(`[CREDENTIAL-SUSPENDED] Credential ${credentialId} suspended. Reason: ${reason}`);
    return credential;
  }
}
