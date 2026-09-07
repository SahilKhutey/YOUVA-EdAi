import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CredentialVerification } from './competency.types';

@Injectable()
export class CredentialVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates if a credential is currently valid.
   * Returns true for ACTIVE, false for REVOKED or EXPIRED.
   */
  isValid(credential: { status: string }): boolean {
    return credential.status === 'ACTIVE';
  }

  /**
   * Verifies an achievement or credential by ID.
   */
  async verifyCredential(credentialId: string): Promise<CredentialVerification> {
    const prismaClient = this.prisma as any;
    const achievement = await prismaClient.passportAchievement.findUnique({
      where: { id: credentialId },
      include: { passport: true },
    });

    if (!achievement) {
      throw new NotFoundException(`Credential ${credentialId} not found.`);
    }

    const isActive = achievement.verificationStatus === 'VERIFIED' && achievement.passport?.status === 'ACTIVE';

    return {
      valid: isActive,
      credentialId: achievement.id,
      issuer: achievement.passport?.issuer ?? 'YOUVA',
      achievementType: achievement.achievementType,
      issuedAt: achievement.issuedAt.toISOString(),
      status: isActive ? 'ACTIVE' : (achievement.verificationStatus === 'REVOKED' ? 'REVOKED' : 'EXPIRED'),
    };
  }

  /**
   * Returns minimal public verification data without exposing full student profile.
   * Invariant: Data minimization.
   */
  async getPublicVerification(verificationId: string) {
    const prismaClient = this.prisma as any;
    const achievement = await prismaClient.passportAchievement.findUnique({
      where: { id: verificationId },
      include: { passport: true },
    });

    if (!achievement) {
      throw new NotFoundException('Verification record not found.');
    }

    return {
      verificationId: achievement.id,
      valid: achievement.verificationStatus === 'VERIFIED',
      title: achievement.title,
      achievementType: achievement.achievementType,
      issuer: achievement.passport?.issuer ?? 'YOUVA-Verified-Network',
      issuedAt: achievement.issuedAt,
    };
  }
}
