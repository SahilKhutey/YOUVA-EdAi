import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDataShareDto, LearningDataScope } from './data-sharing.types';

@Injectable()
export class LearningExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that a data share is currently authorized and active.
   * Invariants:
   * 1. Unapproved or missing share throws ForbiddenException.
   * 2. Expired share throws ForbiddenException('Learning data share has expired.').
   */
  async validateShare(shareId: string, learnerId: string) {
    const prismaClient = this.prisma as any;
    const share = await prismaClient.learningDataShare.findFirst({
      where: {
        id: shareId,
        learnerId,
        status: 'APPROVED',
      },
    });

    if (!share) {
      throw new ForbiddenException('Learning data share is not authorized.');
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
      throw new ForbiddenException('Learning data share has expired.');
    }

    return share;
  }

  /**
   * Initiates a learner-controlled or guardian-approved data sharing grant.
   */
  async createShare(learnerId: string, tenantId: string, dto: CreateDataShareDto) {
    const prismaClient = this.prisma as any;
    const days = dto.expiresInDays || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return prismaClient.learningDataShare.create({
      data: {
        learnerId,
        tenantId,
        recipientType: dto.recipientType,
        recipientId: dto.recipientId,
        purpose: dto.purpose,
        scopeJson: JSON.stringify(dto.scopes),
        status: 'PENDING',
        expiresAt,
      },
    });
  }

  /**
   * Approves a pending data share.
   */
  async approveShare(shareId: string, approverId: string) {
    const prismaClient = this.prisma as any;
    const share = await prismaClient.learningDataShare.findUnique({
      where: { id: shareId },
    });
    if (!share) throw new NotFoundException('Data share not found.');

    return prismaClient.learningDataShare.update({
      where: { id: shareId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Immediately revokes a data share grant.
   */
  async revokeShare(shareId: string) {
    const prismaClient = this.prisma as any;
    const share = await prismaClient.learningDataShare.findUnique({
      where: { id: shareId },
    });
    if (!share) throw new NotFoundException('Data share not found.');

    return prismaClient.learningDataShare.update({
      where: { id: shareId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Performs the governed export adhering to minimal scope principle.
   */
  async exportLearnerData(shareId: string, learnerId: string) {
    const share = await this.validateShare(shareId, learnerId);
    const scopes: LearningDataScope[] = JSON.parse(share.scopeJson || '[]');

    const prismaClient = this.prisma as any;
    const exportBundle: Record<string, any> = {
      shareId: share.id,
      recipientId: share.recipientId,
      purpose: share.purpose,
      exportedAt: new Date().toISOString(),
    };

    if (scopes.includes('PROFILE_MINIMAL')) {
      exportBundle.profile = { learnerId, opaqueId: `sub_${share.id.slice(0, 8)}` };
    }

    if (scopes.includes('MASTERY')) {
      exportBundle.mastery = [];
    }

    if (scopes.includes('CREDENTIALS')) {
      const achievements = await prismaClient.passportAchievement.findMany({
        where: { passport: { learnerId }, achievementType: 'CREDENTIAL', verificationStatus: 'VERIFIED' },
      }).catch(() => []);
      exportBundle.credentials = achievements;
    }

    return exportBundle;
  }
}
