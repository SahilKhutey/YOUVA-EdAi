import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface OfflineActivity {
  activityId: string;
  topicId: string;
  title: string;
  type: string;
  contentSnapshot: string;
}

export interface OfflineLearningPackage {
  packageId: string;
  learnerId: string;
  version: number;
  activities: OfflineActivity[];
  expiresAt: string;
  checksum: string;
}

@Injectable()
export class OfflineService {
  private readonly logger = new Logger(OfflineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an offline learning package with cryptographic checksum.
   */
  async createPackage(
    learnerId: string,
    activities: OfflineActivity[],
    validityHours = 72,
  ): Promise<OfflineLearningPackage> {
    const expiresAt = new Date(
      Date.now() + validityHours * 3600 * 1000,
    ).toISOString();

    const packageId = `pkg_${crypto.randomUUID()}`;
    const payloadToHash = JSON.stringify({ packageId, learnerId, activities, expiresAt });
    const checksum = createHash('sha256').update(payloadToHash).digest('hex');

    return {
      packageId,
      learnerId,
      version: 1,
      activities,
      expiresAt,
      checksum,
    };
  }

  /**
   * Ingest offline completed learning evidence with strict validation and deduplication.
   */
  async syncEvidence(
    callingUserId: string,
    submission: {
      packageId: string;
      learnerId: string;
      checksum: string;
      expiresAt: string;
      evidenceList: Array<{
        idempotencyKey: string;
        topicId: string;
        accuracy: number;
        completedAt: string;
        rawAnswer?: string;
      }>;
    },
  ) {
    // 1. Learner verification
    if (submission.learnerId !== callingUserId) {
      throw new ForbiddenException('Cannot synchronize offline evidence for another learner.');
    }

    // 2. Expiry check
    if (new Date(submission.expiresAt) < new Date()) {
      throw new BadRequestException('Offline learning package has expired. Re-synchronization required.');
    }

    let syncedCount = 0;
    let duplicateCount = 0;

    for (const item of submission.evidenceList) {
      // 3. Deduplication check using idempotencyKey
      const existing = await this.prisma.learningEvidenceLog.findUnique({
        where: { idempotencyKey: item.idempotencyKey },
      });

      if (existing) {
        duplicateCount++;
        continue;
      }

      // 4. Immutable persistence
      await this.prisma.learningEvidenceLog.create({
        data: {
          idempotencyKey: item.idempotencyKey,
          userId: submission.learnerId,
          topicId: item.topicId,
          answer: item.rawAnswer || '[OFFLINE_COMPLETION]',
          accuracy: item.accuracy,
          attemptNumber: 1,
          hintCount: 0,
        },
      });

      syncedCount++;
    }

    this.logger.log(
      `[OFFLINE SYNC] Ingested ${syncedCount} new evidence items (${duplicateCount} duplicates ignored) for learner [${submission.learnerId}]`,
    );

    return {
      syncedCount,
      duplicateCount,
      status: 'SYNCHRONIZED',
    };
  }
}
