import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

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

    async findAll(userId: string) {
        const notifications = await this.prisma.notification.findMany({
            where: { userId },
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
