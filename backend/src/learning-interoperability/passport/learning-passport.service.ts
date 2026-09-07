import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PassportAchievementDto, generateOpaqueSubjectId } from './passport.types';

@Injectable()
export class LearningPassportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the Learning Passport with all associated achievements.
   */
  async getPassport(learnerId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.learningPassport.findUnique({
      where: {
        learnerId,
      },
      include: {
        achievements: true,
      },
    });
  }

  /**
   * Gets or initializes a new Learning Passport for a learner.
   */
  async getOrCreatePassport(learnerId: string, issuer = 'YOUVA-Global', tenantId = 'default-tenant') {
    const existing = await this.getPassport(learnerId);
    if (existing) return existing;

    const prismaClient = this.prisma as any;
    const opaqueSubjectId = generateOpaqueSubjectId(tenantId, learnerId);

    return prismaClient.learningPassport.create({
      data: {
        learnerId,
        issuer,
        version: 1,
        status: 'ACTIVE',
        metadataJson: JSON.stringify({ opaqueSubjectId }),
      },
      include: {
        achievements: true,
      },
    });
  }

  /**
   * Adds an achievement to a learning passport.
   */
  async addAchievement(passportId: string, dto: PassportAchievementDto) {
    const prismaClient = this.prisma as any;
    return prismaClient.passportAchievement.create({
      data: {
        passportId,
        achievementType: dto.achievementType,
        title: dto.title,
        description: dto.description ?? null,
        conceptId: dto.conceptId ?? null,
        competencyId: dto.competencyId ?? null,
        verificationStatus: dto.verificationStatus ?? 'UNVERIFIED',
        evidenceRefJson: dto.evidenceRefJson ? JSON.stringify(dto.evidenceRefJson) : null,
      },
    });
  }

  /**
   * Lists achievements for a passport.
   */
  async getAchievements(passportId: string) {
    const prismaClient = this.prisma as any;
    return prismaClient.passportAchievement.findMany({
      where: { passportId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  /**
   * Exports sanitized passport claims (claims and references, no unrestricted raw child data).
   */
  async exportPassport(learnerId: string) {
    const passport = await this.getPassport(learnerId);
    if (!passport) {
      throw new NotFoundException(`Passport for learner ${learnerId} not found.`);
    }

    return {
      passportId: passport.id,
      issuer: passport.issuer,
      version: passport.version,
      status: passport.status,
      achievementsCount: passport.achievements?.length || 0,
      achievements: (passport.achievements || []).map((a: any) => ({
        id: a.id,
        achievementType: a.achievementType,
        title: a.title,
        verificationStatus: a.verificationStatus,
        issuedAt: a.issuedAt,
      })),
      exportedAt: new Date().toISOString(),
    };
  }
}
