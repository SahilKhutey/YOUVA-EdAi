import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ParentAccessService } from '../parent/parent-access.service';
import { ConsentType, VALID_CONSENT_TYPES } from './consent.constants';

export interface OtpChallengeRecord {
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class ConsentService {
  private readonly secretKey: string;
  private readonly otpChallenges: Map<string, OtpChallengeRecord> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly parentAccess: ParentAccessService,
  ) {
    this.secretKey = process.env.CONSENT_HMAC_SECRET || 'youva-edai-consent-secret-v1';
  }

  /**
   * Generates a 6-digit cryptographically secure OTP for verifiable parental consent.
   */
  async requestConsentOtp(
    parentId: string,
    studentId: string,
    consentType: string,
  ): Promise<{ message: string; challengeKey: string; otpPreview?: string }> {
    await this.parentAccess.assertParentOfStudent(parentId, studentId);

    if (!VALID_CONSENT_TYPES.includes(consentType as ConsentType)) {
      throw new BadRequestException(
        `Invalid consent type: ${consentType}. Must be one of ${VALID_CONSENT_TYPES.join(', ')}`,
      );
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const challengeKey = `${parentId}:${studentId}:${consentType}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.otpChallenges.set(challengeKey, {
      code: otp,
      expiresAt,
      attempts: 0,
    });

    return {
      message: `OTP challenge issued successfully for ${consentType}`,
      challengeKey,
      // Expose OTP preview in test/development environments
      otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verifies the parental OTP and creates/updates the verified consent record.
   */
  async verifyOtpAndGrant(
    parentId: string,
    studentId: string,
    consentType: string,
    otpInput: string,
    version: string = '1.0.0',
  ) {
    await this.parentAccess.assertParentOfStudent(parentId, studentId);

    const challengeKey = `${parentId}:${studentId}:${consentType}`;
    const challenge = this.otpChallenges.get(challengeKey);

    if (!challenge) {
      throw new BadRequestException('No pending OTP challenge found for this consent request.');
    }

    if (new Date() > challenge.expiresAt) {
      this.otpChallenges.delete(challengeKey);
      throw new BadRequestException('OTP verification challenge has expired.');
    }

    challenge.attempts++;
    if (challenge.attempts > 3) {
      this.otpChallenges.delete(challengeKey);
      throw new BadRequestException('Exceeded maximum OTP attempts. Challenge locked.');
    }

    if (challenge.code !== otpInput.trim()) {
      throw new BadRequestException('Invalid OTP code provided.');
    }

    // Clear challenge upon successful match
    this.otpChallenges.delete(challengeKey);

    // Generate cryptographic evidence token
    const rawPayload = `${parentId}:${studentId}:${consentType}:${Date.now()}:${version}`;
    const evidenceToken = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawPayload)
      .digest('hex');

    return this.grant(parentId, studentId, consentType, version, evidenceToken);
  }

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
   * Revokes an existing consent granted by a parent and schedules 24h data purge.
   */
  async revoke(
    parentId: string,
    studentId: string,
    consentType: string,
    purgeHours: number = 24,
  ) {
    await this.parentAccess.assertParentOfStudent(parentId, studentId);

    if (!VALID_CONSENT_TYPES.includes(consentType as ConsentType)) {
      throw new BadRequestException(
        `Invalid consent type: ${consentType}. Must be one of ${VALID_CONSENT_TYPES.join(', ')}`,
      );
    }

    const revokedAt = new Date();
    const purgeScheduledAt = new Date(revokedAt.getTime() + purgeHours * 60 * 60 * 1000);

    const record = await this.prisma.consentRecord.update({
      where: {
        parentId_studentId_consentType: {
          parentId,
          studentId,
          consentType,
        },
      },
      data: {
        status: 'REVOKED',
        revokedAt,
      },
    });

    return {
      ...record,
      purgeScheduledAt,
    };
  }

  /**
   * Executes cryptographic data purge for a student whose consent was revoked.
   * Redacts personal data and updates consent status to PURGED.
   */
  async executePurge(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found.`);
    }

    const anonymizedEmail = `purged_${crypto.randomBytes(6).toString('hex')}@youva-purged.internal`;

    await this.prisma.user.update({
      where: { id: studentId },
      data: {
        name: '[PURGED_ANONYMIZED_DPDP_COMPLIANT]',
        email: anonymizedEmail,
        avatarUrl: null,
      },
    });

    await this.prisma.consentRecord.updateMany({
      where: {
        studentId,
        status: 'REVOKED',
      },
      data: {
        status: 'PURGED',
      },
    });

    return {
      studentId,
      status: 'PURGED_COMPLETED',
      anonymizedEmail,
      purgedAt: new Date(),
    };
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
