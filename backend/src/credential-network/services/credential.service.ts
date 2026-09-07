import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { transitionCredential } from '../domain/credential-state';
import { P15EventTypes } from '../types/credential.types';

@Injectable()
export class CredentialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all credentials for a learner with mandatory tenant isolation.
   */
  async getLearnerCredentials(learnerId: string, tenantId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningCredential.findMany({
      where: {
        learnerId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Retrieves a single credential with strict tenant filtering.
   */
  async getCredential(credentialId: string, tenantId: string) {
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

    return credential;
  }

  /**
   * Creates a credential in DRAFT status.
   */
  async createDraft(data: {
    learnerId: string;
    tenantId: string;
    credentialType: string;
    title: string;
    description?: string;
    verificationLevel: string;
    evidenceIds: string[];
    skillIds: string[];
    criteria: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    const prismaClient = this.prisma as any;

    return prismaClient.$transaction(async (tx: any) => {
      const created = await tx.learningCredential.create({
        data: {
          learnerId: data.learnerId,
          tenantId: data.tenantId,
          credentialType: data.credentialType,
          title: data.title,
          description: data.description ?? null,
          status: 'DRAFT',
          verificationLevel: data.verificationLevel,
          evidenceIdsJson: JSON.stringify(data.evidenceIds),
          skillIdsJson: JSON.stringify(data.skillIds),
          criteriaJson: JSON.stringify(data.criteria),
          metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
          version: 1,
        },
      });

      // Snapshot initial version
      await tx.credentialVersion.create({
        data: {
          credentialId: created.id,
          version: 1,
          criteriaJson: JSON.stringify(data.criteria),
          metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      // Audit event
      await tx.credentialEvent.create({
        data: {
          credentialId: created.id,
          tenantId: data.tenantId,
          eventType: P15EventTypes.CREDENTIAL_CREATED,
          actorId: data.learnerId,
          actorType: 'LEARNER',
        },
      });

      return created;
    });
  }

  /**
   * Submits a DRAFT credential for human teacher/institution review.
   */
  async submitForReview(credentialId: string, tenantId: string, actorId: string) {
    const prismaClient = this.prisma as any;

    return prismaClient.$transaction(async (tx: any) => {
      const credential = await tx.learningCredential.findFirst({
        where: { id: credentialId, tenantId },
      });
      if (!credential) throw new NotFoundException('Credential not found.');

      const nextStatus = transitionCredential(credential.status, 'PENDING_REVIEW');

      const updated = await tx.learningCredential.update({
        where: { id: credential.id },
        data: { status: nextStatus },
      });

      await tx.credentialEvent.create({
        data: {
          credentialId: credential.id,
          tenantId,
          eventType: P15EventTypes.CREDENTIAL_SUBMITTED,
          actorId,
          actorType: 'LEARNER',
        },
      });

      return updated;
    });
  }
}
