import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateShareToken } from '../crypto/credential-token';
import { P15EventTypes } from '../types/credential.types';

@Injectable()
export class CredentialShareService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a cryptographically secure public verification share token.
   * Invariant: Never persist the raw token. Only store the SHA-256 hash.
   * Token is returned once upon creation to the credential owner.
   */
  async createShare(
    credentialId: string,
    tenantId: string,
    actorId: string,
    expiresAt?: Date,
  ) {
    const prismaClient = this.prisma as any;

    const credential = await prismaClient.learningCredential.findFirst({
      where: {
        id: credentialId,
        tenantId,
        status: {
          in: ['ISSUED', 'ACTIVE'],
        },
      },
    });

    if (!credential) {
      throw new NotFoundException(
        'Credential not found or not available for public sharing.',
      );
    }

    const { token, hash } = generateShareToken();

    await prismaClient.$transaction(async (tx: any) => {
      await tx.credentialShare.create({
        data: {
          credentialId,
          tokenHash: hash,
          expiresAt: expiresAt ?? null,
          revoked: false,
        },
      });

      await tx.credentialEvent.create({
        data: {
          credentialId,
          tenantId,
          eventType: P15EventTypes.CREDENTIAL_SHARED,
          actorId,
          actorType: 'LEARNER',
        },
      });
    });

    return {
      token,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
  }
}
