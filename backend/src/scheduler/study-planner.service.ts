import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, startOfDay, addHours } from 'date-fns';

@Injectable()
export class StudyPlannerService {
    constructor(private prisma: PrismaService) { }

    async generateWeeklyPlan(userId: string) {
        // 1. Get user goals
        const goal = await this.prisma.studyGoal.findFirst({
            where: { userId, isActive: true },
        });

        const weeklyMinutes = goal?.weeklyStudyMinutes || 120;
        const minutesPerDay = Math.ceil(weeklyMinutes / 7);

        // 2. Get mastery data to prioritize weak topics
        const mastery = await this.prisma.userTopicMastery.findMany({
            where: { userId },
            include: { topic: true },
            orderBy: { masteryProbability: 'asc' },
            take: 5, // Top 5 priority topics
        });

        if (mastery.length === 0) {
            // Fallback: pick any 5 topics
            const allTopics = await this.prisma.topic.findMany({ take: 5 });
            // @ts-ignore
            mastery.push(...allTopics.map(t => ({ topic: t, topicId: t.id })));
        }

        // 3. Clear future existing study sessions to avoid overlaps
        const today = startOfDay(new Date());
        await this.prisma.studySession.deleteMany({
            where: { userId, scheduledAt: { gte: today }, isCompleted: false }
        });

        // 4. Generate 7-day plan
        const newSessions = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(today, i);
            const topicIndex = i % mastery.length;
            const topic = mastery[topicIndex].topic;

            // Schedule session at 4 PM (typical study time)
            const scheduledTime = addHours(date, 16);

            newSessions.push({
                userId,
                topicId: topic.id,
                title: `Focused Study: ${topic.title}`,
                scheduledAt: scheduledTime,
                durationMinutes: minutesPerDay,
                notes: `AI-Suggested: This topic needs attention (Mastery: ${Math.round((mastery[topicIndex].masteryProbability || 0) * 100)}%)`
            });
        }

        // 5. Batch create
        return this.prisma.studySession.createMany({
            data: newSessions,
        });
    }

    async getSuggestedPlan(userId: string) {
        return this.prisma.studySession.findMany({
            where: {
                userId,
                scheduledAt: { gte: startOfDay(new Date()) },
                isCompleted: false
            },
            include: { topic: { select: { title: true, subject: { select: { name: true } } } } },
            orderBy: { scheduledAt: 'asc' }
        });
    }
}
