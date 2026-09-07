import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { transitionCredential } from '../domain/credential-state';
import { P15EventTypes } from '../types/credential.types';

@Injectable()
export class CredentialVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a human educator's authoritative verification review.
   * Invariant: AI-supported evidence must not be represented as human verification.
   * Only human teachers or accredited institutional verifiers can approve.
   */
  async verify(
    credentialId: string,
    verifierId: string,
    tenantId: string,
    decision: 'APPROVE' | 'REJECT',
    notes?: string,
  ) {
    const prismaClient = this.prisma as any;

    const credential = await prismaClient.learningCredential.findFirst({
      where: {
        id: credentialId,
        tenantId,
      },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found.');
    }

    if (credential.status !== 'PENDING_REVIEW' && credential.status !== 'DRAFT') {
      throw new ForbiddenException(
        `Cannot verify credential with status ${credential.status}. Must be PENDING_REVIEW or DRAFT.`,
      );
    }

    const nextStatus = decision === 'APPROVE'
      ? transitionCredential(credential.status, 'APPROVED')
      : transitionCredential(credential.status, 'DRAFT');

    return prismaClient.$transaction(async (tx: any) => {
      const updated = await tx.learningCredential.update({
        where: { id: credential.id },
        data: {
          status: nextStatus,
          verificationLevel: 'TEACHER_VERIFIED',
        },
      });

      await tx.credentialVerification.create({
        data: {
          credentialId,
          verificationLevel: 'TEACHER_VERIFIED',
          verifierType: 'TEACHER',
          verifierId,
          decision,
          notes: notes ?? null,
        },
      });

      await tx.credentialEvent.create({
        data: {
          credentialId,
          tenantId,
          eventType: decision === 'APPROVE'
            ? P15EventTypes.CREDENTIAL_APPROVED
            : 'credential.rejected',
          actorId: verifierId,
          actorType: 'TEACHER',
        },
      });

      return updated;
    });
  }
}
