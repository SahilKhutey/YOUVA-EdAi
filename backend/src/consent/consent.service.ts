import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParentAccessService } from '../parent/parent-access.service';
import { ConsentType, VALID_CONSENT_TYPES } from './consent.constants';

@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parentAccess: ParentAccessService,
  ) {}

  /**
   * Grants parental consent for a specific child and consent type.
   * Enforces verified parent relationship and idempotent composite upsert.
   */
  async grant(
    parentId: string,
    studentId: string,
    consentType: string,
    version: string,
    evidence?: string,
  ) {
    await this.parentAccess.assertParentOfStudent(parentId, studentId);

    if (!VALID_CONSENT_TYPES.includes(consentType as ConsentType)) {
      throw new BadRequestException(
        `Invalid consent type: ${consentType}. Must be one of ${VALID_CONSENT_TYPES.join(', ')}`,
      );
    }

    return this.prisma.consentRecord.upsert({
      where: {
        parentId_studentId_consentType: {
          parentId,
          studentId,
          consentType,
        },
      },
      create: {
        parentId,
        studentId,
        consentType,
        status: 'GRANTED',
        version,
        grantedAt: new Date(),
        evidence,
      },
      update: {
        status: 'GRANTED',
        version,
        grantedAt: new Date(),
        revokedAt: null,
        evidence,
      },
    });
  }

  /**
   * Revokes an existing consent granted by a parent.
   */
  async revoke(
    parentId: string,
    studentId: string,
    consentType: string,
  ) {
    await this.parentAccess.assertParentOfStudent(parentId, studentId);

    if (!VALID_CONSENT_TYPES.includes(consentType as ConsentType)) {
      throw new BadRequestException(
        `Invalid consent type: ${consentType}. Must be one of ${VALID_CONSENT_TYPES.join(', ')}`,
      );
    }

    return this.prisma.consentRecord.update({
      where: {
        parentId_studentId_consentType: {
          parentId,
          studentId,
          consentType,
        },
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Verifies whether an active, unrevoked consent is present for a student.
   */
  async hasConsent(
    studentId: string,
    consentType: string,
  ): Promise<boolean> {
    const record = await this.prisma.consentRecord.findFirst({
      where: {
        studentId,
        consentType,
        status: 'GRANTED',
        revokedAt: null,
      },
      select: { id: true },
    });

    return Boolean(record);
  }

  /**
   * Lists all consent records for a linked child.
   */
  async listConsents(parentId: string, studentId: string) {
    await this.parentAccess.assertParentOfStudent(parentId, studentId);

    return this.prisma.consentRecord.findMany({
      where: {
        parentId,
        studentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
