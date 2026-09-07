import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { transitionCredential } from '../domain/credential-state';
import { P15EventTypes } from '../types/credential.types';

@Injectable()
export class CredentialRevocationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Authoritatively revokes a credential.
   * Invariant: Revocation is irreversible (REVOKED is a terminal state).
   * Automatically invalidates all active share tokens and records an audited event.
   */
  async revoke(
    credentialId: string,
    tenantId: string,
    actorId: string,
    reason: string,
  ) {
    const prismaClient = this.prisma as any;

    return prismaClient.$transaction(async (tx: any) => {
      const credential = await tx.learningCredential.findFirst({
        where: {
          id: credentialId,
          tenantId,
        },
      });

      if (!credential) {
        throw new NotFoundException('Credential not found.');
      }

      if (credential.status === 'REVOKED') {
        return credential;
      }

      const nextStatus = transitionCredential(credential.status, 'REVOKED');

      const updated = await tx.learningCredential.update({
        where: { id: credential.id },
        data: {
          status: nextStatus,
          revokedAt: new Date(),
          revocationReason: reason,
        },
      });

      // Revoke all public share links
      await tx.credentialShare.updateMany({
        where: { credentialId },
        data: { revoked: true },
      });

      // Audit revocation event
      await tx.credentialEvent.create({
        data: {
          credentialId,
          tenantId,
          eventType: P15EventTypes.CREDENTIAL_REVOKED,
          actorId,
          actorType: 'HUMAN',
          metadataJson: JSON.stringify({ reason }),
        },
      });

      return updated;
    });
  }
}
