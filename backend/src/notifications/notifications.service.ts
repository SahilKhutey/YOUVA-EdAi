import { Injectable } from '@nestjs/common';

export interface AppNotification {
    id: string;
    userId: string;
    type: 'badge' | 'xp' | 'announcement' | 'streak' | 'goal' | 'info';
    title: string;
    message: string;
    createdAt: Date;
}

@Injectable()
export class NotificationsService {
    // In-memory per-user queues (cleared once delivered).
    // For production, swap with Redis or DB-backed queue.
    private queues = new Map<string, AppNotification[]>();

    // Lazily-set by the Gateway after it boots
    private sendToUser?: (userId: string, notification: AppNotification) => void;

    /** Called once by NotificationsGateway after it initialises. */
    setSender(fn: (userId: string, n: AppNotification) => void) {
        this.sendToUser = fn;
    }

    /** Send a notification to a specific user (live if connected, queued otherwise). */
    async notify(
        userId: string,
        type: AppNotification['type'],
        title: string,
        message: string,
    ) {
        const notification: AppNotification = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId,
            type,
            title,
            message,
            createdAt: new Date(),
        };

        if (this.sendToUser) {
            this.sendToUser(userId, notification);
        } else {
            // Queue for when user connects
            const q = this.queues.get(userId) ?? [];
            q.push(notification);
            this.queues.set(userId, q);
        }
    }

    /** Broadcast a notification to ALL connected users (e.g. announcements). */
    broadcast?: (n: Omit<AppNotification, 'userId'>) => void;

    /** Drain the pending queue for a user who just connected. */
    drain(userId: string): AppNotification[] {
        const q = this.queues.get(userId) ?? [];
        this.queues.delete(userId);
        return q;
    }
}
