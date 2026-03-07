import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
    constructor(private prisma: PrismaService) { }

    async submitFeedback(userId: string, data: { rating: number; comments?: string; context: string; sessionId?: string }) {
        return this.prisma.feedback.create({
            data: {
                userId,
                rating: data.rating,
                comments: data.comments,
                context: data.context,
                sessionId: data.sessionId,
            },
        });
    }

    async getFeedbackOverview() {
        const feedbacks = await this.prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: { select: { name: true, role: true } },
            }
        });

        const averageRating = feedbacks.length > 0
            ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
            : 0;

        return {
            averageRating: Math.round(averageRating * 10) / 10,
            totalCount: feedbacks.length,
            recentFeedbacks: feedbacks
        };
    }
}
