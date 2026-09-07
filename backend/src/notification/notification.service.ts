import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export enum NotificationEventType {
  STUDENT_MILESTONE = 'STUDENT_MILESTONE',
  ASSIGNMENT_DUE = 'ASSIGNMENT_DUE',
  TEACHER_INTERVENTION = 'TEACHER_INTERVENTION',
  SAFETY_ESCALATION = 'SAFETY_ESCALATION',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  WEEKLY_PROGRESS = 'WEEKLY_PROGRESS',
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    type: string,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  }

  /**
   * Dispatches a notification across specified channels (e.g. IN_APP, EMAIL, PUSH)
   * and creates corresponding NotificationDelivery tracking records.
   */
  async dispatchWithChannels(
    userId: string,
    type: string,
    title: string,
    body: string,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
    metadata?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    const deliveries = [];
    for (const channel of channels) {
      const isDelivered = channel === NotificationChannel.IN_APP; // In-app is immediately persisted
      const delivery = await this.prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel,
          status: isDelivered ? 'DELIVERED' : 'PENDING',
          attempts: isDelivered ? 1 : 0,
          deliveredAt: isDelivered ? new Date() : null,
          lastAttemptAt: new Date(),
        },
      });
      deliveries.push(delivery);
    }

    this.logger.log(
      `Dispatched notification ${notification.id} to user ${userId} across channels: ${channels.join(', ')}`,
    );

    return {
      notification,
      deliveries,
    };
  }

  /**
   * Updates delivery status for external providers (Email/Push).
   */
  async recordDeliveryResult(
    deliveryId: string,
    status: 'DELIVERED' | 'FAILED',
    errorMessage?: string,
  ) {
    return this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
        errorMessage,
        lastAttemptAt: new Date(),
        attempts: {
          increment: 1,
        },
      },
    });
  }

  async findAll(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        deliveries: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((n) => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }));
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
