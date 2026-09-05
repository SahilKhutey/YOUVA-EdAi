import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogEntry } from '../domain/types';

@Injectable()
export class LearningLoopAuditService {
  private readonly logger = new Logger(LearningLoopAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an immutable audit entry to the audit log.
   */
  async logAction(entry: AuditLogEntry): Promise<any> {
    try {
      const record = await this.prisma.learningLoopAuditLog.create({
        data: {
          userId: entry.userId,
          actorType: entry.actorType,
          actorId: entry.actorId,
          action: entry.action,
          stateBefore: entry.stateBefore ? JSON.stringify(entry.stateBefore) : null,
          stateAfter: JSON.stringify(entry.stateAfter),
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        },
      });

      this.logger.debug(
        `Audit Log Recorded: [${entry.actorType}] ${entry.action} for user ${entry.userId} by ${entry.actorId}`,
      );
      return record;
    } catch (error) {
      this.logger.error(`Failed to record audit log for user ${entry.userId}`, error);
      throw error;
    }
  }

  /**
   * Retrieves the immutable audit trail for a specific student.
   */
  async getStudentAuditTrail(userId: string, limit: number = 50) {
    return this.prisma.learningLoopAuditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
