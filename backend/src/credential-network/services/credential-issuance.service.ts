import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { transitionCredential } from '../domain/credential-state';
import { P15EventTypes } from '../types/credential.types';

@Injectable()
export class CredentialIssuanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Issues an approved credential.
   * Invariant: AI cannot issue credentials. Credential must be in APPROVED status before issuance.
   * Transactional guarantees: Credential update, event audit, and idempotency key are atomic.
   */
  async issue(
    credentialId: string,
    issuerId: string,
    tenantId: string,
    operationKey?: string,
  ) {
    const prismaClient = this.prisma as any;

    return prismaClient.$transaction(async (tx: any) => {
      // Idempotency check
      if (operationKey) {
        const existingOp = await tx.credentialOperation.findUnique({
          where: { operationKey },
        });
        if (existingOp) {
          return tx.learningCredential.findUnique({
            where: { id: credentialId },
          });
        }

        await tx.credentialOperation.create({
          data: {
            credentialId,
            operationKey,
            operationType: 'ISSUE',
          },
        });
      }

      const credential = await tx.learningCredential.findFirst({
        where: {
          id: credentialId,
          tenantId,
        },
      });

      if (!credential) {
        throw new NotFoundException('Credential not found.');
      }

      if (credential.status !== 'APPROVED') {
        throw new ForbiddenException(
          `Credential must be approved before issuance. Current status: ${credential.status}`,
        );
      }

      const nextStatus = transitionCredential(credential.status, 'ISSUED');

      const updated = await tx.learningCredential.update({
        where: { id: credential.id },
        data: {
          status: nextStatus,
          issuerId,
          issuedAt: new Date(),
        },
      });

      await tx.credentialEvent.create({
        data: {
          credentialId: credential.id,
          tenantId,
          eventType: P15EventTypes.CREDENTIAL_ISSUED,
          actorId: issuerId,
          actorType: 'HUMAN',
        },
      });

      return updated;
    });
  }

  /**
   * Activates an issued credential for everyday use in the skills passport.
   */
  async activate(credentialId: string, tenantId: string, actorId: string) {
    const prismaClient = this.prisma as any;

    return prismaClient.$transaction(async (tx: any) => {
      const credential = await tx.learningCredential.findFirst({
        where: { id: credentialId, tenantId },
      });
      if (!credential) throw new NotFoundException('Credential not found.');

      const nextStatus = transitionCredential(credential.status, 'ACTIVE');

      const updated = await tx.learningCredential.update({
        where: { id: credential.id },
        data: { status: nextStatus },
      });

      await tx.credentialEvent.create({
        data: {
          credentialId: credential.id,
          tenantId,
          eventType: P15EventTypes.CREDENTIAL_ACTIVATED,
          actorId,
          actorType: 'HUMAN',
        },
      });

      return updated;
    });
  }
}
