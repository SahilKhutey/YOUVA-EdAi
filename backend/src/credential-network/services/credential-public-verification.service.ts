import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface PublicVerificationResult {
  valid: boolean;
  reason?: string;
  credential?: {
    id: string;
    title: string;
    type: string;
    issuer: string | null;
    verificationLevel: string;
    issuedAt: string | null;
    expiresAt: string | null;
    status: string;
  };
}

@Injectable()
export class CredentialPublicVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifies an achievement credential using a public share token.
   * Invariant: Data minimization. Absolutely no learner PII, private notes,
   * AI internal metrics, or raw diagnostic evidence is exposed publicly.
   */
  async verify(token: string): Promise<PublicVerificationResult> {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return { valid: false, reason: 'Invalid or missing token.' };
    }

    const hash = createHash('sha256').update(token).digest('hex');
    const prismaClient = this.prisma as any;

    const share = await prismaClient.credentialShare.findUnique({
      where: { tokenHash: hash },
    });

    if (!share) {
      return { valid: false, reason: 'Share token not recognized.' };
    }

    if (share.revoked) {
      return { valid: false, reason: 'Credential share has been revoked.' };
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return { valid: false, reason: 'Credential share has expired.' };
    }

    const credential = await prismaClient.learningCredential.findUnique({
      where: { id: share.credentialId },
    });

    if (!credential) {
      return { valid: false, reason: 'Associated credential not found.' };
    }

    const isValidStatus = ['ISSUED', 'ACTIVE'].includes(credential.status);
    if (!isValidStatus) {
      return {
        valid: false,
        reason: `Credential is not in an active or issued status (current: ${credential.status}).`,
      };
    }

    // Return sanitized public representation with strict data minimization
    return {
      valid: true,
      credential: {
        id: credential.id,
        title: credential.title,
        type: credential.credentialType,
        issuer: credential.issuerName ?? 'YOUVA Learning Network',
        verificationLevel: credential.verificationLevel,
        issuedAt: credential.issuedAt ? new Date(credential.issuedAt).toISOString() : null,
        expiresAt: credential.expiresAt ? new Date(credential.expiresAt).toISOString() : null,
        status: credential.status,
      },
    };
  }
}
